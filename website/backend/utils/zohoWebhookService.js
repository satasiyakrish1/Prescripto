import axios from 'axios';

/**
 * Send appointment data to Zoho webhook
 * @param {string} eventType - Type of event (booking_confirmed, appointment_cancelled, payment_completed, appointment_completed)
 * @param {object} appointmentData - Appointment data to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendToZohoWebhook = async (eventType, appointmentData) => {
    try {
        const webhookUrl = process.env.ZOHO_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.warn('Zoho webhook URL not configured');
            return { success: false, error: 'Webhook URL not configured' };
        }

        // Format the appointment data for Zoho
        const webhookPayload = {
            event_type: eventType,
            timestamp: new Date().toISOString(),
            appointment_id: appointmentData._id?.toString() || appointmentData.appointmentId,
            appointment_details: {
                // Patient Information
                patient_name: appointmentData.userData?.name || '',
                patient_email: appointmentData.userData?.email || '',
                patient_phone: appointmentData.userData?.phone || '',
                
                // Doctor Information
                doctor_name: appointmentData.docData?.name || '',
                doctor_speciality: appointmentData.docData?.speciality || '',
                doctor_email: appointmentData.docData?.email || '',
                
                // Appointment Details
                slot_date: appointmentData.slotDate || '',
                slot_time: appointmentData.slotTime || '',
                booking_date: appointmentData.date ? new Date(appointmentData.date).toISOString() : '',
                booking_mode: appointmentData.bookingMode || 'default',
                is_emergency: appointmentData.isEmergency || false,
                
                // Payment & Status
                amount: appointmentData.amount || 0,
                currency: process.env.CURRENCY || 'INR',
                payment_status: appointmentData.payment ? 'paid' : 'pending',
                is_cancelled: appointmentData.cancelled || false,
                is_completed: appointmentData.isCompleted || false,
                
                // Additional Info
                custom_slot_id: appointmentData.customSlotId || null
            }
        };

        // Send POST request to Zoho webhook
        const response = await axios.post(webhookUrl, webhookPayload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 seconds timeout
        });

        console.log(`Zoho webhook sent successfully for event: ${eventType}`, {
            appointmentId: webhookPayload.appointment_id,
            status: response.status
        });

        return { success: true, response: response.data };

    } catch (error) {
        console.error('Error sending to Zoho webhook:', {
            eventType,
            error: error.message,
            response: error.response?.data
        });
        
        return { 
            success: false, 
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Send booking confirmation to Zoho
 */
export const sendBookingConfirmation = async (appointmentData) => {
    return sendToZohoWebhook('booking_confirmed', appointmentData);
};

/**
 * Send appointment cancellation to Zoho
 */
export const sendAppointmentCancellation = async (appointmentData) => {
    return sendToZohoWebhook('appointment_cancelled', appointmentData);
};

/**
 * Send payment completion to Zoho
 */
export const sendPaymentCompletion = async (appointmentData) => {
    return sendToZohoWebhook('payment_completed', appointmentData);
};

/**
 * Send appointment completion to Zoho
 */
export const sendAppointmentCompletion = async (appointmentData) => {
    return sendToZohoWebhook('appointment_completed', appointmentData);
};
