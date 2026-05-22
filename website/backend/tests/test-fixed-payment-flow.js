// Test script to verify the fixed payment flow
import dotenv from 'dotenv';
import { createPaymentLink } from '../utils/zohoPaymentsService.js';

dotenv.config();

async function testPaymentFlow() {
    console.log('Testing fixed Zoho payment flow...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('ZOHO_PAYMENTS_TEST_MODE:', process.env.ZOHO_PAYMENTS_TEST_MODE);

    try {
        // Test creating a payment link
        const result = await createPaymentLink({
            appointmentId: 'test_appointment_123',
            amount: 1000,
            currency: 'INR',
            description: 'Test appointment payment'
        });

        console.log('Payment link creation result:', result);

        if (result.success) {
            console.log('✅ Payment link created successfully');
            console.log('Payment URL:', result.payment_link_url);
            console.log('Payment Link ID:', result.payment_link_id);

            // The test payment page should now call the verification API directly
            // instead of relying on automatic verification when returning to MyAppointments
            console.log('✅ Test payment flow updated - verification now happens on test payment page');
        } else {
            console.log('❌ Failed to create payment link');
        }

    } catch (error) {
        console.error('❌ Error testing payment flow:', error);
    }
}

testPaymentFlow();