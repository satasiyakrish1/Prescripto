import axios from 'axios';

// Lightweight OAuth token manager for Zoho (server-side only)
// Uses refresh token flow and caches the access token in-memory

let cachedToken = null;
let tokenExpiryEpoch = 0; // seconds epoch when token expires
let refreshing = null; // Promise when a refresh is in progress

const getEnv = (k) => process.env[k];

function getAccountsBase() {
  // Default for India data center; allow override via env
  return getEnv('ZOHO_ACCOUNTS_BASE') || 'https://accounts.zoho.in';
}

function isTokenValid() {
  // Consider 30s buffer
  const now = Math.floor(Date.now() / 1000) + 30;
  return !!cachedToken && tokenExpiryEpoch > now;
}

export async function getAccessToken() {
  if (isTokenValid()) return cachedToken;
  return await refreshAccessToken();
}

export async function refreshAccessToken() {
  if (refreshing) return refreshing;

  const clientId = getEnv('ZOHO_CLIENT_ID');
  const clientSecret = getEnv('ZOHO_CLIENT_SECRET');
  const refreshToken = getEnv('ZOHO_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho OAuth env missing: ZOHO_CLIENT_ID/ZOHO_CLIENT_SECRET/ZOHO_REFRESH_TOKEN');
  }

  const accountsBase = getAccountsBase();
  const url = `${accountsBase}/oauth/v2/token`;

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token'
  });

  refreshing = axios
    .post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then((res) => {
      const data = res.data || {};
      if (!data.access_token) {
        throw new Error('Zoho refresh response missing access_token');
      }
      cachedToken = data.access_token;
      // Zoho returns expires_in_sec or expires_in; handle both
      const expiresIn = Number(data.expires_in_sec || data.expires_in || 3300);
      tokenExpiryEpoch = Math.floor(Date.now() / 1000) + (isNaN(expiresIn) ? 3300 : expiresIn);
      return cachedToken;
    })
    .catch((err) => {
      cachedToken = null;
      tokenExpiryEpoch = 0;
      const body = err?.response?.data;
      const msg = body?.error || body?.error_description || err.message;
      throw new Error(`Zoho token refresh failed: ${msg}`);
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function getZohoUserInfo() {
  const token = await getAccessToken();
  const accountsBase = getAccountsBase();
  const url = `${accountsBase}/oauth/user/info`;
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err?.response?.data || err.message };
  }
}


