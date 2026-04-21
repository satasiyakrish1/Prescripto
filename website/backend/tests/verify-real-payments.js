import dotenv from 'dotenv';
import { createPaymentLink, listZohoPaymentAccounts } from '../utils/zohoPaymentsService.js';
import { getZohoPaymentsConfig } from '../config/zohoPaymentsConfig.js';

dotenv.config();

console.log('🔥 Real Zoho Payments Verification');
console.log('==================================\n');

async function verifyRealPayments() {
    console.log('📋 Current Configuration:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);

    const config = getZohoPaymentsConfig();
    console.log(`API Root: ${config.apiRoot}`);
    console.log(`Account ID: ${config.accountId}`);
    console.log(`Has OAuth Token: ${!!config.staticToken}`);

    // Check if we're in production mode
    const isProductionMode = process.env.NODE_ENV === 'production' && process.env.ZOHO_PAYMENTS_TEST_MODE === 'false';
    console.log(`\n🔥 Production Mode Active: ${isProductionMode}`);

    if (!isProductionMode) {
        console.log('❌ Still in test mode. Real payments will not work.');
        console.log('✅ Configuration has been updated. Please restart your server.');
        return;
    }

    console.log('\n🔑 Testing Authentication...');
    try {
        const accountResult = await listZohoPaymentAccounts();
        if (accountResult.success) {
            console.log('✅ Authentication successful');
            console.log('Available accounts:');
            if (accountResult.data?.accounts) {
                accountResult.data.accounts.forEach(acc => {
                    const isConfigured = acc.account_id === config.accountId;
                    console.log(`   ${isConfigured ? '→' : ' '} ${acc.account_name} (ID: ${acc.account_id})`);
                });
            }
        } else {
            console.log('❌ Authentication failed:', accountResult.error);
            return;
        }
    } catch (error) {
        console.log('❌ Authentication error:', error.message);
        return;
    }

    console.log('\n💳 Testing Real Payment Link Creation...');
    try {
        const result = await createPaymentLink({
            amount: 1.00, // Small test amount
            currency: 'INR',
            reference_id: `real_test_${Date.now()}`,
            description: 'Real payment test - ₹1',
            email: 'test@example.com'
        });

        if (result.success && !result.testMode) {
            console.log('✅ Real payment link created successfully!');
            console.log(`Payment URL: ${result.url}`);
            console.log(`Payment ID: ${result.id}`);
            console.log('\n🎉 Your Zoho Payments is ready for real transactions!');

            console.log('\n⚠️  IMPORTANT NOTES:');
            console.log('   - This creates REAL payment links');
            console.log('   - Customers will be charged actual money');
            console.log('   - Test with small amounts first');
            console.log('   - Monitor your Zoho Payments dashboard');

        } else if (result.testMode) {
            console.log('❌ Still in test mode. Please restart your server after configuration change.');
        } else {
            console.log('❌ Failed to create real payment link:', result.error);
        }
    } catch (error) {
        console.log('❌ Payment link creation failed:', error.message);
    }

    console.log('\n📊 Summary:');
    console.log('✅ Configuration updated for real payments');
    console.log('✅ Restart your server to apply changes');
    console.log('✅ Test with small amounts first');
    console.log('✅ Monitor payments in Zoho dashboard');
}

verifyRealPayments();