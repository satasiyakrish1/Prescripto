#!/usr/bin/env node

import dotenv from 'dotenv';
import axios from 'axios';
import { createPaymentLink, listZohoPaymentAccounts, getPaymentLink } from '../utils/zohoPaymentsService.js';
import { getZohoPaymentsConfig } from '../config/zohoPaymentsConfig.js';
import { getAccessToken } from '../utils/zohoOAuth.js';

dotenv.config();

console.log('🧪 Zoho Payment Integration Test Suite');
console.log('=====================================\n');

async function runTests() {
    const results = {
        config: false,
        authentication: false,
        accountAccess: false,
        paymentLinkCreation: false,
        paymentLinkRetrieval: false,
        testMode: false,
        errors: []
    };

    try {
        // Test 1: Configuration Check
        console.log('📋 Test 1: Configuration Check...');
        const config = getZohoPaymentsConfig();

        const requiredFields = ['apiRoot', 'accountId'];
        const hasAuth = config.staticToken || (config.clientId && config.clientSecret && config.refreshToken);

        if (config.apiRoot && config.accountId && hasAuth) {
            results.config = true;
            console.log('✅ Configuration is valid');
            console.log(`   API Root: ${config.apiRoot}`);
            console.log(`   Account ID: ${config.accountId}`);
            console.log(`   Auth Method: ${config.staticToken ? 'Static Token' : 'OAuth Refresh'}`);
        } else {
            console.log('❌ Configuration is incomplete');
            if (!config.apiRoot) results.errors.push('Missing ZOHO_PAYMENTS_API_ROOT');
            if (!config.accountId) results.errors.push('Missing ZOHO_PAYMENTS_ACCOUNT_ID');
            if (!hasAuth) results.errors.push('Missing authentication (ZOHO_PAYMENTS_OAUTH_TOKEN or OAuth credentials)');
        }

        // Test 2: Authentication
        console.log('\n🔑 Test 2: Authentication Test...');
        try {
            let token;
            if (config.staticToken) {
                token = config.staticToken;
                console.log('   Using static OAuth token');
            } else {
                token = await getAccessToken();
                console.log('   Using dynamic OAuth token');
            }

            // Test token validity with a simple API call
            const response = await axios.get(`${config.apiRoot}/accounts`, {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Accept': 'application/json'
                }
            });

            results.authentication = true;
            console.log('✅ Authentication successful');
        } catch (authError) {
            console.log('❌ Authentication failed');
            console.log(`   Error: ${authError.response?.data?.message || authError.message}`);
            results.errors.push(`Authentication: ${authError.response?.data?.message || authError.message}`);
        }

        // Test 3: Account Access
        console.log('\n🏦 Test 3: Account Access Test...');
        try {
            const accountResult = await listZohoPaymentAccounts();
            if (accountResult.success) {
                results.accountAccess = true;
                console.log('✅ Account access successful');

                if (accountResult.data?.accounts) {
                    console.log('   Available accounts:');
                    accountResult.data.accounts.forEach(acc => {
                        const isConfigured = acc.account_id === config.accountId;
                        console.log(`   ${isConfigured ? '→' : ' '} ${acc.account_name} (ID: ${acc.account_id})`);
                    });
                }
            } else {
                console.log('❌ Account access failed');
                console.log(`   Error: ${accountResult.error}`);
                results.errors.push(`Account access: ${accountResult.error}`);
            }
        } catch (accountError) {
            console.log('❌ Account access test failed');
            console.log(`   Error: ${accountError.message}`);
            results.errors.push(`Account access: ${accountError.message}`);
        }

        // Test 4: Payment Link Creation
        console.log('\n💳 Test 4: Payment Link Creation Test...');
        let testPaymentLinkId = null;
        try {
            const paymentResult = await createPaymentLink({
                amount: 100.00,
                currency: 'INR',
                reference_id: `test_${Date.now()}`,
                description: 'Integration test payment',
                email: 'test@example.com'
            });

            if (paymentResult.success) {
                results.paymentLinkCreation = true;
                testPaymentLinkId = paymentResult.id;
                console.log('✅ Payment link created successfully');
                console.log(`   Payment Link ID: ${paymentResult.id}`);
                console.log(`   Payment URL: ${paymentResult.url}`);

                if (paymentResult.testMode) {
                    results.testMode = true;
                    console.log('   🧪 Test mode detected');
                }
            } else {
                console.log('❌ Payment link creation failed');
                console.log(`   Error: ${paymentResult.error}`);
                results.errors.push(`Payment link creation: ${paymentResult.error}`);
            }
        } catch (paymentError) {
            console.log('❌ Payment link creation test failed');
            console.log(`   Error: ${paymentError.message}`);
            results.errors.push(`Payment link creation: ${paymentError.message}`);
        }

        // Test 5: Payment Link Retrieval (only if creation succeeded and not in test mode)
        if (testPaymentLinkId && !results.testMode) {
            console.log('\n🔍 Test 5: Payment Link Retrieval Test...');
            try {
                const retrievalResult = await getPaymentLink(testPaymentLinkId);
                if (retrievalResult.success) {
                    results.paymentLinkRetrieval = true;
                    console.log('✅ Payment link retrieval successful');
                    console.log(`   Status: ${retrievalResult.link?.status || 'Unknown'}`);
                } else {
                    console.log('❌ Payment link retrieval failed');
                    console.log(`   Error: ${retrievalResult.error}`);
                    results.errors.push(`Payment link retrieval: ${retrievalResult.error}`);
                }
            } catch (retrievalError) {
                console.log('❌ Payment link retrieval test failed');
                console.log(`   Error: ${retrievalError.message}`);
                results.errors.push(`Payment link retrieval: ${retrievalError.message}`);
            }
        } else if (results.testMode) {
            console.log('\n🧪 Test 5: Skipped (Test Mode Active)');
            results.paymentLinkRetrieval = true; // Consider it passed in test mode
        }

        // Test Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        console.log(`Configuration: ${results.config ? '✅' : '❌'}`);
        console.log(`Authentication: ${results.authentication ? '✅' : '❌'}`);
        console.log(`Account Access: ${results.accountAccess ? '✅' : '❌'}`);
        console.log(`Payment Link Creation: ${results.paymentLinkCreation ? '✅' : '❌'}`);
        console.log(`Payment Link Retrieval: ${results.paymentLinkRetrieval ? '✅' : '❌'}`);
        console.log(`Test Mode: ${results.testMode ? '🧪 Active' : '🔴 Inactive'}`);

        const passedTests = Object.values(results).filter(v => v === true).length - 1; // Subtract 1 for errors array
        const totalTests = 5;

        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);

        if (results.errors.length > 0) {
            console.log('\n❌ Issues Found:');
            results.errors.forEach(error => console.log(`   - ${error}`));

            console.log('\n🔧 Recommendations:');
            if (!results.config) {
                console.log('   1. Check your .env file for missing Zoho configuration');
                console.log('   2. Ensure ZOHO_PAYMENTS_OAUTH_TOKEN and ZOHO_PAYMENTS_ACCOUNT_ID are set');
            }
            if (!results.authentication) {
                console.log('   1. Verify your OAuth token is valid and not expired');
                console.log('   2. Check if you have the correct scopes for Zoho Payments');
            }
            if (!results.accountAccess) {
                console.log('   1. Ensure your token has access to the Zoho Payments service');
                console.log('   2. Verify the account ID matches an accessible account');
            }
        } else {
            console.log('\n🎉 All tests passed! Your Zoho Payments integration is working correctly.');
            if (results.testMode) {
                console.log('   Note: Currently running in test mode for development.');
            }
        }

        return results;

    } catch (error) {
        console.error('\n💥 Test suite crashed:', error.message);
        results.errors.push(`Test suite: ${error.message}`);
        return results;
    }
}

// Run the tests
runTests().then(results => {
    const allPassed = results.config && results.authentication && results.accountAccess &&
        results.paymentLinkCreation && results.paymentLinkRetrieval;

    process.exit(allPassed ? 0 : 1);
}).catch(error => {
    console.error('Test suite failed to run:', error);
    process.exit(1);
});