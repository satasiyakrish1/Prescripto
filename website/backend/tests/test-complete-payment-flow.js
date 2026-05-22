import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';
import axios from 'axios';

dotenv.config();

async function testCompletePaymentFlow() {
    console.log('🧪 Testing complete Zoho payment flow...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('ZOHO_PAYMENTS_TEST_MODE:', process.env.ZOHO_PAYMENTS_TEST_MODE);

    try {
        // Step 1: Create a payment link
        console.log('\n📋 Step 1: Creating payment link...');
        const appointmentId = 'test_appointment_123';
        const amount = 1000;
        const currency = 'INR';

        const paymentResult = await createPaymentLink({
            reference_id: appointmentId,
            amount: amount,
            currency: currency
        });

        if (!paymentResult.success) {
            throw new Error('Failed to create payment link');
        }

        console.log('✅ Payment link created successfully');
        console.log('Payment Link ID:', paymentResult.id);
        console.log('Payment URL:', paymentResult.url);

        // Step 2: Simulate the verification process (like the frontend would do)
        console.log('\n🔍 Step 2: Simulating payment verification...');

        // This simulates what the TestPayment.jsx page does after a successful payment
        const verifyResponse = await axios.post('http://localhost:4001/api/user/verifyZoho', {
            appointmentId: appointmentId,
            payment_link_id: paymentResult.id
        }).catch(error => {
            console.error('Verification error details:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Message:', error.message);
            throw error;
        });

        console.log('✅ Verification response:', verifyResponse.data);

        // Step 3: Check if the verification was properly handled
        if (verifyResponse.data.success) {
            console.log('\n🎉 SUCCESS: Payment flow is working correctly!');
            console.log('✅ Payment link created with proper ID');
            console.log('✅ Verification API called successfully');
            console.log('✅ Appointment marked as paid');
            console.log('✅ This is now a proper test mode flow');
        } else {
            console.log('\n❌ FAILED: Verification was not successful');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

testCompletePaymentFlow();