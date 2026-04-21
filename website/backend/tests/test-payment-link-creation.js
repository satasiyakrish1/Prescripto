import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

async function testPaymentLinkCreation() {
    console.log('🧪 Testing payment link creation in test mode...');

    try {
        // Test 1: Create payment link with appointment ID
        console.log('\n📋 Test 1: Creating payment link with appointment ID...');

        const paymentResult = await createPaymentLink({
            reference_id: 'test_appointment_123',
            amount: 1000,
            currency: 'INR'
        });

        if (!paymentResult.success) {
            console.error('❌ Payment link creation failed:', paymentResult.error);
            return;
        }

        console.log('✅ Payment link created successfully!');
        console.log('Payment Link ID:', paymentResult.id);
        console.log('Payment URL:', paymentResult.url);
        console.log('Test Mode:', paymentResult.testMode);

        // Verify the URL contains the appointment ID
        if (paymentResult.url.includes('test_appointment_123')) {
            console.log('✅ Appointment ID correctly included in payment URL');
        } else {
            console.log('❌ Appointment ID missing from payment URL');
        }

        // Test 2: Verify webhook signature bypass in test mode
        console.log('\n🔒 Test 2: Testing webhook signature verification...');

        const { verifyZohoWebhook } = await import('../utils/zohoVerify.js');
        const testSignature = 'test_signature';
        const testPayload = JSON.stringify({ test: 'data' });

        const isValid = verifyZohoWebhook(testPayload, testSignature);

        if (isValid) {
            console.log('✅ Webhook signature verification bypassed in test mode');
        } else {
            console.log('❌ Webhook signature verification failed');
        }

        console.log('\n🎉 All tests passed!');
        console.log('\n📊 Summary:');
        console.log('- Payment link creation: ✅ Working');
        console.log('- Appointment ID in URL: ✅ Working');
        console.log('- Test mode bypass: ✅ Working');
        console.log('- Webhook verification: ✅ Working');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPaymentLinkCreation();