import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { getAccessToken, refreshAccessToken } from './zohoOAuth.js';
import { getZohoPaymentsConfig, getAlternateApiRoot } from '../config/zohoPaymentsConfig.js';

// Ensure environment variables are loaded
dotenv.config();

const cfg = getZohoPaymentsConfig();
const API_ROOT = cfg.apiRoot;
const STATIC_OAUTH_TOKEN = cfg.staticToken;
let ACCOUNT_ID = cfg.accountId;
const ACCOUNT_NAME = cfg.accountName;
const SIGNING_KEY = cfg.signingKey;

export async function createPaymentLink({ amount, currency = (process.env.CURRENCY || 'INR'), reference_id, description, return_url, email, phone }) {
  try {
    // Debug logging
    console.log('[ZohoPayments] Environment check:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`  ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);
    console.log(`  Payment request:`, { amount, currency, reference_id, description });
    
    // Check if we're in test mode - based on ZOHO_PAYMENTS_TEST_MODE only
    const isTestMode = process.env.ZOHO_PAYMENTS_TEST_MODE === 'true';
    console.log(`  Test mode active: ${isTestMode}`);
    
    if (isTestMode) {
      console.log('[ZohoPayments] Test mode - creating mock payment link');
      
      // Use local test payment page instead of fake Zoho URL
      const frontendUrl = (process.env.DEVELOPMENT_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const testPaymentLinkId = `test_${Date.now()}`;
      const testPaymentUrl = `${frontendUrl}/test-payment?appointmentId=${reference_id}&paymentLinkId=${testPaymentLinkId}&amount=${amount}&currency=${currency}`;
      
      console.log(`[ZohoPayments] Generated test URL: ${testPaymentUrl}`);
      
      return { 
        success: true, 
        link: { test: true }, 
        url: testPaymentUrl, 
        id: testPaymentLinkId, 
        account_id: 'test_account',
        testMode: true
      };
    }

    // Prefer dynamic OAuth; fallback to static token if configured
    let token;
    try {
      token = STATIC_OAUTH_TOKEN || await getAccessToken();
      if (!token) {
        return { success: false, error: 'Zoho OAuth token missing. Please check your ZOHO_PAYMENTS_OAUTH_TOKEN or OAuth credentials.' };
      }
    } catch (oauthError) {
      console.error('[ZohoPayments] OAuth token error:', oauthError.message);
      if (STATIC_OAUTH_TOKEN) {
        token = STATIC_OAUTH_TOKEN;
        console.log('[ZohoPayments] Falling back to static token');
      } else {
        return { success: false, error: `OAuth token error: ${oauthError.message}` };
      }
    }

    // Resolve account id if not configured or to validate access
    let resolvedAccountId = ACCOUNT_ID;
    if (!resolvedAccountId) {
      const accList = await listZohoPaymentAccounts();
      if (accList.success) {
        const accounts = Array.isArray(accList.data?.accounts) ? accList.data.accounts : (accList.data?.data || accList.data || []);
        if (Array.isArray(accounts) && accounts.length) {
          if (ACCOUNT_NAME) {
            const match = accounts.find(a => a?.account_name === ACCOUNT_NAME || a?.name === ACCOUNT_NAME || a?.display_name === ACCOUNT_NAME || a?.id === ACCOUNT_NAME);
            resolvedAccountId = match?.account_id || match?.id || null;
          }
          if (!resolvedAccountId) {
            const first = accounts[0];
            resolvedAccountId = first?.account_id || first?.id || null;
          }
        }
      }
      if (resolvedAccountId) {
        ACCOUNT_ID = resolvedAccountId; // cache for subsequent calls
        console.log('[ZohoPayments] Resolved Account ID:', resolvedAccountId, ACCOUNT_NAME ? `(from name ${ACCOUNT_NAME})` : '(fallback first)');
      }
    }
    if (!resolvedAccountId) {
      return { success: false, error: 'Zoho Account ID missing and could not resolve from API' };
    }

    const payload = {
      amount: Number(Number(amount).toFixed(2)),
      currency,
      reference_id,
      description,
      ...(return_url && { return_url }),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {})
    };

    // Build candidate attempts: header vs query param, and domain variants
    const alt = getAlternateApiRoot(API_ROOT);
    const rootCandidates = Array.from(new Set([API_ROOT, alt].filter(Boolean)));

    const attempts = [];
    for (const root of rootCandidates) {
      // Header-based account selection
      attempts.push({
        url: `${root}/paymentlinks`,
        headers: (bearer) => ({
          'Authorization': `Zoho-oauthtoken ${bearer}`,
          'X-Account-Id': resolvedAccountId,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        note: `POST ${root}/paymentlinks with X-Account-Id`
      });
      // Query param account selection (compat)
      attempts.push({
        url: `${root}/paymentlinks?account_id=${encodeURIComponent(resolvedAccountId)}`,
        headers: (bearer) => ({
          'Authorization': `Zoho-oauthtoken ${bearer}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }),
        note: `POST ${root}/paymentlinks?account_id=...`
      });
    }

    const errors = [];
    let data;
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const doRequest = async (bearer) => axios.post(attempt.url, payload, { headers: attempt.headers(bearer) });
      try {
        ({ data } = await doRequest(token));
        // success
        errors.length = 0; // clear
        break;
      } catch (err) {
        const res = err?.response;
        const body = res?.data;
        errors.push({ attempt: attempt.note, status: res?.status, body });
        // On first auth failure, try refresh once and retry same attempt
        if (!STATIC_OAUTH_TOKEN && (res?.status === 401 || res?.status === 403) && i === 0) {
          try {
            const newToken = await refreshAccessToken();
            ({ data } = await doRequest(newToken));
            errors.length = 0;
            break;
          } catch (retryErr) {
            const rres = retryErr?.response;
            errors.push({ attempt: attempt.note + ' (after refresh)', status: rres?.status, body: rres?.data });
          }
        }
      }
    }

    if (errors.length && !data) {
      const first = errors[0];
      const last = errors[errors.length - 1];
      const body = last?.body || first?.body;
      const apiMsg = body?.message || body?.error || body?.error_message;
      const msg = apiMsg || 'Zoho Payments request failed';
      console.error('[ZohoPayments] All attempts failed:', errors);
      
      // Provide more specific error messages
      if (typeof msg === 'string') {
        if (/not\s*an?\s*authorized\s*user/i.test(msg)) {
          return { 
            success: false, 
            error: 'Zoho: Not an authorized user. Please check your OAuth token and account permissions.', 
            raw: { errors, resolvedAccountId, suggestion: 'Verify ZOHO_PAYMENTS_OAUTH_TOKEN and ZOHO_PAYMENTS_ACCOUNT_ID' }
          };
        }
        if (/invalid.*token/i.test(msg) || /unauthorized/i.test(msg)) {
          return { 
            success: false, 
            error: 'Zoho: Invalid or expired token. Please refresh your OAuth token.', 
            raw: { errors, resolvedAccountId, suggestion: 'Update ZOHO_PAYMENTS_OAUTH_TOKEN with a fresh token' }
          };
        }
        if (/account.*not.*found/i.test(msg)) {
          return { 
            success: false, 
            error: 'Zoho: Account not found. Please verify your account ID.', 
            raw: { errors, resolvedAccountId, suggestion: 'Check ZOHO_PAYMENTS_ACCOUNT_ID value' }
          };
        }
      }
      
      return { success: false, error: msg, raw: { errors, resolvedAccountId } };
    }

    // Normalize common response shapes
    const linkUrl = data?.url || data?.payment_link?.url;
    const linkId = data?.payment_link_id || data?.payment_link?.id || data?.id;
    return { success: true, link: data, url: linkUrl, id: linkId, account_id: resolvedAccountId };
  } catch (error) {
    const res = error?.response;
    const body = res?.data;
    const apiMsg = body?.message || body?.error || body?.error_message;
    const msg = apiMsg || error?.message || 'Unknown error';
    const code = body?.code || res?.status;
    console.error('[ZohoPayments] Error creating payment link:', { code, msg, body });
    // Map common auth errors for clarity
    if (typeof msg === 'string' && /not\s*an?\s*authorized\s*user/i.test(msg)) {
      return { success: false, error: 'Zoho: Not an authorized user (check token scope and account)' , raw: body };
    }
    if (res?.status === 401 || res?.status === 403) {
      return { success: false, error: 'Zoho authorization failed (401/403). Verify OAuth token, scopes, and X-Account-Id.' , raw: body };
    }
    return { success: false, error: msg, raw: body };
  }
}

export function verifyWebhookSignature(rawBody, signature) {
  // Depending on Zoho webhook header spec; assuming HMAC SHA256 using SIGNING_KEY
  try {
    // Check if we're in test mode
    if (process.env.ZOHO_PAYMENTS_TEST_MODE === 'true') {
      console.log('[ZohoPayments] Test mode - webhook verification bypassed');
      return true;
    }

    if (!SIGNING_KEY) return false;
    const expected = crypto.createHmac('sha256', SIGNING_KEY).update(rawBody).digest('hex');
    return expected === signature;
  } catch (e) {
    console.error('[ZohoPayments] Webhook verification error:', e);
    return false;
  }
}

// Diagnostics: list accessible accounts for current token
export async function listZohoPaymentAccounts() {
  try {
    const token = STATIC_OAUTH_TOKEN || await getAccessToken();
    const url = `${API_ROOT}/accounts`;
    const { data } = await axios.get(url, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error?.response?.data || error.message };
  }
}

// Fetch a payment link by id to verify status
export async function getPaymentLink(paymentLinkId) {
  try {
    // Check if we're in test mode
    if (process.env.ZOHO_PAYMENTS_TEST_MODE === 'true') {
      console.log('[ZohoPayments] Test mode - returning mock payment status');
      return { 
        success: true, 
        link: { 
          id: paymentLinkId,
          status: 'paid',
          amount: 100,
          currency: 'INR',
          testMode: true
        } 
      };
    }

    const token = STATIC_OAUTH_TOKEN || await getAccessToken();
    // Use resolved/cached account if available; else try to resolve
    let resolvedAccountId = ACCOUNT_ID;
    if (!resolvedAccountId) {
      const accList = await listZohoPaymentAccounts();
      if (accList.success) {
        const accounts = Array.isArray(accList.data?.accounts) ? accList.data.accounts : (accList.data?.data || accList.data || []);
        if (Array.isArray(accounts) && accounts.length) {
          const first = accounts[0];
          resolvedAccountId = first?.account_id || first?.id || null;
          if (resolvedAccountId) ACCOUNT_ID = resolvedAccountId;
        }
      }
    }
    if (!resolvedAccountId) {
      return { success: false, error: 'Zoho Account ID missing and could not resolve from API' };
    }

    const alt = getAlternateApiRoot(API_ROOT);
    const rootCandidates = Array.from(new Set([API_ROOT, alt].filter(Boolean)));

    const errors = [];
    let data;
    for (const root of rootCandidates) {
      // Prefer header account id
      try {
        const res = await axios.get(`${root}/paymentlinks/${encodeURIComponent(paymentLinkId)}`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'X-Account-Id': resolvedAccountId,
            'Accept': 'application/json'
          }
        });
        data = res.data;
        break;
      } catch (err) {
        errors.push({ root, style: 'header', status: err?.response?.status, body: err?.response?.data });
      }

      // Fallback: query param account id
      try {
        const res = await axios.get(`${root}/paymentlinks/${encodeURIComponent(paymentLinkId)}?account_id=${encodeURIComponent(resolvedAccountId)}`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Accept': 'application/json'
          }
        });
        data = res.data;
        break;
      } catch (err) {
        errors.push({ root, style: 'query', status: err?.response?.status, body: err?.response?.data });
      }
    }

    if (!data) {
      console.error('[ZohoPayments] getPaymentLink attempts failed:', errors);
      const last = errors[errors.length - 1];
      const apiMsg = last?.body?.message || last?.body?.error;
      return { success: false, error: apiMsg || 'Failed to fetch payment link', raw: { errors } };
    }

    return { success: true, link: data };
  } catch (error) {
    const res = error?.response;
    return { success: false, error: res?.data || error.message };
  }
}
