#!/usr/bin/env node

import dotenv from 'dotenv';
import axios from 'axios';
import { getZohoPaymentsConfig } from '../config/zohoPaymentsConfig.js';
import { getAccessToken, refreshAccessToken } from '../utils/zohoOAuth.js';
import { listZohoPaymentAccounts, createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

console.log('🔧 Zoho Payment System Diagnostic & Fix Tool');
console.log('==============================================\n');

async function diagnoseZohoPayments() {
  const results = {
    config: {},
    token: {},
    account: {},
    paymentLink: {},
    errors: []
  };

  try {
    // Step 1: Check Configuration
    console.log('📋 Step 1: Checking Configuration...');
    const config = getZohoPaymentsConfig();
    results.config = {
      apiRoot: config.apiRoot,
      accountId: config.accountId,
      hasStaticToken: !!config.staticToken,
      hasSigningKey: !!config.signingKey,
      hasClientId: !!config.clientId,
      hasClientSecret: !!config.clientSecret,
      hasRefreshToken: !!config.refreshToken
    };

    console.log('✅ Configuration loaded:');
    console.log(`   API Root: ${config.apiRoot}`);
    console.log(`   Account ID: ${config.accountId || 'Not set'}`);
    console.log(`   Static Token: ${config.staticToken ? 'Present' : 'Missing'}`);
    console.log(`   OAuth Credentials: ${config.clientId ? 'Present' : 'Missing'}`);
    console.log(`   Signing Key: ${config.signingKey ? 'Present' : 'Missing'}\n`);

    // Step 2: Test Token
    console.log('🔑 Step 2: Testing Authentication...');

    if (config.staticToken) {
      console.log('   Testing static token...');
      try {
        const response = await axios.get(`${config.apiRoot}/accounts`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${config.staticToken}`,
            'Accept': 'application/json'
          }
        });
        results.token.staticValid = true;
        console.log('   ✅ Static token is valid');
      } catch (error) {
        results.token.staticValid = false;
        console.log(`   ❌ Static token failed: ${error.response?.data?.message || error.message}`);
        results.errors.push(`Static token: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test OAuth refresh if available
    if (config.clientId && config.clientSecret && config.refreshToken) {
      console.log('   Testing OAuth refresh...');
      try {
        const newToken = await refreshAccessToken();
        results.token.oauthValid = true;
        results.token.newToken = newToken;
        console.log('   ✅ OAuth refresh successful');
      } catch (error) {
        results.token.oauthValid = false;
        console.log(`   ❌ OAuth refresh failed: ${error.message}`);
        results.errors.push(`OAuth refresh: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  OAuth credentials missing for refresh token flow');
      results.errors.push('OAuth credentials missing');
    }

    // Step 3: Test Account Access
    console.log('\n🏦 Step 3: Testing Account Access...');
    try {
      const accountResult = await listZohoPaymentAccounts();
      results.account = accountResult;
      if (accountResult.success) {
        console.log('   ✅ Account access successful');
        if (accountResult.data?.accounts) {
          console.log('   Available accounts:');
          accountResult.data.accounts.forEach(acc => {
            console.log(`   - ${acc.account_name} (ID: ${acc.account_id})`);
          });
        }
      } else {
        console.log(`   ❌ Account access failed: ${accountResult.error}`);
        results.errors.push(`Account access: ${accountResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Account test failed: ${error.message}`);
      results.errors.push(`Account test: ${error.message}`);
    }

    // Step 4: Test Payment Link Creation
    console.log('\n💳 Step 4: Testing Payment Link Creation...');
    try {
      const paymentResult = await createPaymentLink({
        amount: 1.00,
        currency: 'INR',
        reference_id: 'diagnostic_test_123',
        description: 'Diagnostic test payment',
        email: 'test@example.com'
      });
      results.paymentLink = paymentResult;
      if (paymentResult.success) {
        console.log('   ✅ Payment link created successfully');
        console.log(`   URL: ${paymentResult.url}`);
        console.log(`   ID: ${paymentResult.id}`);
      } else {
        console.log(`   ❌ Payment link creation failed: ${paymentResult.error}`);
        results.errors.push(`Payment link: ${paymentResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Payment link test failed: ${error.message}`);
      results.errors.push(`Payment link test: ${error.message}`);
    }

    // Step 5: Recommendations
    console.log('\n🔧 Step 5: Recommendations...');
    if (results.errors.length > 0) {
      console.log('   Issues found:');
      results.errors.forEach(error => console.log(`   - ${error}`));

      if (!results.token.staticValid && !results.token.oauthValid) {
        console.log('\n   🔑 Authentication Issues:');
        console.log('   1. Static OAuth token is invalid');
        console.log('   2. OAuth refresh credentials are missing or invalid');
        console.log('   3. You need to obtain a valid OAuth token');
        console.log('\n   To fix this, you need to:');
        console.log('   1. Get a new OAuth token from Zoho');
        console.log('   2. Set up OAuth refresh token flow, or');
        console.log('   3. Update the static token with a valid one');
      }

      if (config.accountId && results.account.success === false) {
        console.log('\n   🏦 Account Issues:');
        console.log('   The configured account ID may be incorrect.');
        console.log('   Check the available accounts above and update ZOHO_PAYMENTS_ACCOUNT_ID');
      }
    } else {
      console.log('   ✅ All systems working correctly!');
    }

    return results;

  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
    results.errors.push(`Diagnostic: ${error.message}`);
    return results;
  }
}

// Run diagnostic
console.log('Starting comprehensive Zoho Payments diagnostic...\n');
diagnoseZohoPayments().then(results => {
  console.log('\n📊 Diagnostic Complete!');
  console.log('Results saved to zoho-diagnostic-results.json');

  // Save results for review
  const fs = require('fs');
  fs.writeFileSync('zoho-diagnostic-results.json', JSON.stringify(results, null, 2));

  if (results.errors.length === 0) {
    console.log('🎉 Your Zoho Payments integration is ready to use!');
    process.exit(0);
  } else {
    console.log('⚠️  Issues found. Please review the recommendations above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Diagnostic crashed:', error);
  process.exit(1);
});