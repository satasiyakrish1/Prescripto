#!/usr/bin/env node

import dotenv from 'dotenv';
import { getZohoPaymentsConfig } from '../config/zohoPaymentsConfig.js';

dotenv.config();

console.log('🔍 Zoho Payments Configuration Validator');
console.log('========================================\n');

function validateConfig() {
    const config = getZohoPaymentsConfig();
    const issues = [];
    const warnings = [];

    console.log('📋 Current Configuration:');
    console.log(`   API Root: ${config.apiRoot || 'NOT SET'}`);
    console.log(`   Account ID: ${config.accountId || 'NOT SET'}`);
    console.log(`   Account Name: ${config.accountName || 'NOT SET'}`);
    console.log(`   Static Token: ${config.staticToken ? 'SET (length: ' + config.staticToken.length + ')' : 'NOT SET'}`);
    console.log(`   Signing Key: ${config.signingKey ? 'SET (length: ' + config.signingKey.length + ')' : 'NOT SET'}`);
    console.log(`   OAuth Client ID: ${config.clientId || 'NOT SET'}`);
    console.log(`   OAuth Client Secret: ${config.clientSecret ? 'SET' : 'NOT SET'}`);
    console.log(`   OAuth Refresh Token: ${config.refreshToken ? 'SET' : 'NOT SET'}`);

    // Check required fields
    if (!config.apiRoot) {
        issues.push('ZOHO_PAYMENTS_API_ROOT is required');
    } else if (!config.apiRoot.includes('payments.zoho.')) {
        warnings.push('API Root should be a Zoho Payments API URL (e.g., https://payments.zoho.in/api/v1)');
    }

    if (!config.accountId) {
        issues.push('ZOHO_PAYMENTS_ACCOUNT_ID is required');
    } else if (!/^\d+$/.test(config.accountId)) {
        warnings.push('Account ID should be numeric');
    }

    // Check authentication
    const hasStaticAuth = !!config.staticToken;
    const hasOAuthAuth = !!(config.clientId && config.clientSecret && config.refreshToken);

    if (!hasStaticAuth && !hasOAuthAuth) {
        issues.push('Authentication required: Either ZOHO_PAYMENTS_OAUTH_TOKEN or (ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET + ZOHO_REFRESH_TOKEN)');
    }

    if (hasStaticAuth && config.staticToken.length < 50) {
        warnings.push('Static OAuth token seems too short - verify it\'s complete');
    }

    if (!config.signingKey) {
        warnings.push('ZOHO_PAYMENTS_SIGNING_KEY is recommended for webhook verification');
    } else if (config.signingKey.length < 32) {
        warnings.push('Signing key seems too short - verify it\'s complete');
    }

    // Check environment settings
    const nodeEnv = process.env.NODE_ENV;
    const testMode = process.env.ZOHO_PAYMENTS_TEST_MODE;

    console.log(`\n🌍 Environment Settings:`);
    console.log(`   NODE_ENV: ${nodeEnv || 'NOT SET'}`);
    console.log(`   ZOHO_PAYMENTS_TEST_MODE: ${testMode || 'NOT SET'}`);

    if (nodeEnv === 'development' && testMode === 'true') {
        console.log('   🧪 Test mode is active - payments will be simulated');
    } else if (nodeEnv === 'production' && testMode === 'true') {
        warnings.push('Test mode is enabled in production environment');
    }

    // Display results
    console.log('\n📊 Validation Results:');

    if (issues.length === 0) {
        console.log('✅ Configuration is valid');
    } else {
        console.log('❌ Configuration has issues:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    // Recommendations
    console.log('\n💡 Recommendations:');

    if (nodeEnv !== 'development' && nodeEnv !== 'production') {
        console.log('   - Set NODE_ENV to either "development" or "production"');
    }

    if (nodeEnv === 'development' && testMode !== 'true') {
        console.log('   - Consider setting ZOHO_PAYMENTS_TEST_MODE=true for development');
    }

    if (!hasOAuthAuth && hasStaticAuth) {
        console.log('   - Consider setting up OAuth refresh flow for better security');
    }

    if (!config.accountName && config.accountId) {
        console.log('   - Set ZOHO_PAYMENTS_ACCOUNT_NAME for easier account identification');
    }

    console.log('\n📝 Next Steps:');
    if (issues.length > 0) {
        console.log('   1. Fix the configuration issues listed above');
        console.log('   2. Update your .env file with the correct values');
        console.log('   3. Run this validator again to confirm fixes');
    } else {
        console.log('   1. Run the integration test: node test-zoho-integration.js');
        console.log('   2. Test payment creation in your application');
        console.log('   3. Verify webhook handling if using webhooks');
    }

    return {
        valid: issues.length === 0,
        issues,
        warnings,
        config
    };
}

const result = validateConfig();
process.exit(result.valid ? 0 : 1);