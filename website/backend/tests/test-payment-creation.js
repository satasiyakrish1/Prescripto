import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

console.log('🧪 Testing Payment Link Creation');
console.log('================================\n');

console.log('Environment Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);
console.log(`DEVELOPMENT_FRONTEND_URL: ${process.env.DEVELOPMENT_FRONTEND_URL}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);

async function testPaymentCreation() {
    try {
        console.log('\n🔗 Creating payment link...');

        const result = await createPaymentLink({
            amount: 500,
            currency: 'INR',
            reference_id: 'test_appointment_123',
            description: 'Test appointment payment',
            email: 'test@example.com'
        });

        console.log('\n📊 Result:');
        console.log(`Success: ${result.success}`);
        console.log(`Test Mode: ${result.testMode}`);
        console.log(`Payment URL: ${result.url}`);
        console.log(`Payment ID: ${result.id}`);

        if (result.success && result.testMode) {
            console.log('\n✅ Test mode is working correctly!');
            console.log('The URL should point to your local frontend, not Zoho.');

            if (result.url.includes('localhost') || result.url.includes('127.0.0.1')) {
                console.log('✅ URL is correctly pointing to local frontend');
            } else {
                console.log('❌ URL is not pointing to local frontend');
            }
        } else if (result.success && !result.testMode) {
            console.log('\n⚠️  Production mode is active');
            console.log('This will create real Zoho payment links');
        } else {
            console.log('\n❌ Payment link creation failed');
            console.log(`Error: ${result.error}`);
        }

    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
    }
}

testPaymentCreation();