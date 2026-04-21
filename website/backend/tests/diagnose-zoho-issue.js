import dotenv from 'dotenv';
import { createPaymentLink, listZohoPaymentAccounts } from '../utils/zohoPaymentsService.js';

dotenv.config();

console.log('🔍 Zoho Payment Issue Diagnosis');
console.log('===============================\n');

async function diagnose() {
    console.log('📋 Environment Check:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);
    console.log(`ZOHO_PAYMENTS_OAUTH_TOKEN: ${process.env.ZOHO_PAYMENTS_OAUTH_TOKEN ? 'SET' : 'MISSING'}`);
    console.log(`ZOHO_PAYMENTS_ACCOUNT_ID: ${process.env.ZOHO_PAYMENTS_ACCOUNT_ID}`);
    console.log(`ZOHO_PAYMENTS_API_ROOT: ${process.env.ZOHO_PAYMENTS_API_ROOT}`);

    // Test 1: Check if test mode should be active
    const isTestMode = process.env.ZOHO_PAYMENTS_TEST_MODE === 'true';
    console.log(`\n🧪 Test Mode: ${isTestMode ? 'ACTIVE' : 'INACTIVE'}`);

    if (isTestMode) {
        console.log('   - Payments will be simulated');
        console.log('   - No real API calls to Zoho');

        try {
            const result = await createPaymentLink({
                amount: 100,
                currency: 'INR',
                reference_id: 'test_123',
                description: 'Test payment'
            });

            console.log('   ✅ Test mode payment link creation works');
            console.log(`   URL: ${result.url}`);
        } catch (error) {
            console.log('   ❌ Test mode payment link creation failed');
            console.log(`   Error: ${error.message}`);
        }
        return;
    }

    // Test 2: Real mode - check account access
    console.log('\n🏦 Testing Account Access...');
    try {
        const accountResult = await listZohoPaymentAccounts();
        if (accountResult.success) {
            console.log('   ✅ Account access successful');
            if (accountResult.data?.accounts) {
                console.log('   Available accounts:');
                accountResult.data.accounts.forEach(acc => {
                    const isConfigured = acc.account_id === process.env.ZOHO_PAYMENTS_ACCOUNT_ID;
                    console.log(`     ${isConfigured ? '→' : ' '} ${acc.account_name} (ID: ${acc.account_id})`);
                });
            }
        } else {
            console.log('   ❌ Account access failed');
            console.log(`   Error: ${accountResult.error}`);
            return;
        }
    } catch (error) {
        console.log('   ❌ Account access test failed');
        console.log(`   Error: ${error.message}`);
        return;
    }

    // Test 3: Payment link creation
    console.log('\n💳 Testing Payment Link Creation...');
    try {
        const result = await createPaymentLink({
            amount: 1.00, // Small amount for testing
            currency: 'INR',
            reference_id: 'diagnostic_test_' + Date.now(),
            description: 'Diagnostic test payment',
            email: 'test@example.com'
        });

        if (result.success) {
            console.log('   ✅ Payment link created successfully');
            console.log(`   URL: ${result.url}`);
            console.log(`   ID: ${result.id}`);
        } else {
            console.log('   ❌ Payment link creation failed');
            console.log(`   Error: ${result.error}`);
            if (result.raw) {
                console.log('   Raw response:', JSON.stringify(result.raw, null, 2));
            }
        }
    } catch (error) {
        console.log('   ❌ Payment link creation test failed');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }

    console.log('\n🎯 Diagnosis Complete');
    console.log('If issues persist, check:');
    console.log('1. OAuth token validity and scopes');
    console.log('2. Account ID correctness');
    console.log('3. Network connectivity to Zoho');
    console.log('4. Server logs for detailed error messages');
}

diagnose();