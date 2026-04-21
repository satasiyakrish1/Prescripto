import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

console.log('🧪 Testing Zoho Payment Creation');
console.log('=================================\n');

console.log('Configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);
console.log(`ZOHO_PAYMENTS_OAUTH_TOKEN: ${process.env.ZOHO_PAYMENTS_OAUTH_TOKEN ? 'SET' : 'MISSING'}`);
console.log(`ZOHO_PAYMENTS_ACCOUNT_ID: ${process.env.ZOHO_PAYMENTS_ACCOUNT_ID}`);

async function testPayment() {
    try {
        console.log('\n🔗 Creating payment link...');

        const result = await createPaymentLink({
            amount: 500,
            currency: 'INR',
            reference_id: 'test_123',
            description: 'Test payment',
            email: 'test@example.com'
        });

        console.log('\n📊 Result:');
        console.log('Success:', result.success);
        if (result.success) {
            console.log('URL:', result.url);
            console.log('ID:', result.id);
            console.log('Test Mode:', result.testMode);
        } else {
            console.log('Error:', result.error);
            console.log('Details:', result.raw);
        }

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testPayment();