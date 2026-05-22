import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

console.log('🔍 Debug Payment Link Creation');
console.log('==============================\n');

console.log('Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`ZOHO_PAYMENTS_TEST_MODE: ${process.env.ZOHO_PAYMENTS_TEST_MODE}`);
console.log(`DEVELOPMENT_FRONTEND_URL: ${process.env.DEVELOPMENT_FRONTEND_URL}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);

console.log('\nTest Mode Check:');
const isTestMode = process.env.NODE_ENV === 'development' && process.env.ZOHO_PAYMENTS_TEST_MODE === 'true';
console.log(`Should use test mode: ${isTestMode}`);

console.log('\nTesting payment link creation...');

async function testPaymentLink() {
    try {
        const result = await createPaymentLink({
            amount: 100,
            currency: 'INR',
            reference_id: 'debug_test_123',
            description: 'Debug test payment'
        });

        console.log('\nResult:');
        console.log('Success:', result.success);
        console.log('URL:', result.url);
        console.log('ID:', result.id);
        console.log('Test Mode:', result.testMode);
        console.log('Full Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPaymentLink();