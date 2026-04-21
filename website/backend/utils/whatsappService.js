/**
 * Vonage WhatsApp Service
 * 
 * This service handles WhatsApp notifications for appointments using Vonage API
 * including confirmations, reminders, and cancellations.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Vonage } from '@vonage/server-sdk';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct path to the .env file
const utilsEnvPath = path.join(__dirname, '.env');
const backendEnvPath = path.join(__dirname, '..', '.env');
const rootEnvPath = path.join(__dirname, '..', '..', '.env');

// Check which .env file exists and load it
let envPath = fs.existsSync(utilsEnvPath) ? utilsEnvPath : 
              fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;

dotenv.config({ path: envPath });

// Vonage API configuration
const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID;
const VONAGE_PRIVATE_KEY = process.env.VONAGE_PRIVATE_KEY;
const VONAGE_WHATSAPP_NUMBER = process.env.VONAGE_WHATSAPP_NUMBER;

// Initialize Vonage client
let vonageClient = null;

try {
    if (VONAGE_API_KEY && VONAGE_API_SECRET && VONAGE_APPLICATION_ID && VONAGE_PRIVATE_KEY) {
        vonageClient = new Vonage({
            apiKey: VONAGE_API_KEY,
            apiSecret: VONAGE_API_SECRET,
            applicationId: VONAGE_APPLICATION_ID,
            privateKey: VONAGE_PRIVATE_KEY
        });
        console.log('Vonage client initialized successfully');
    } else {
        console.warn('Vonage configuration incomplete. WhatsApp messages will be logged only.');
    }
} catch (error) {
    console.error('Failed to initialize Vonage client:', error.message);
}

/**
 * Format phone number for Vonage (ensure it has country code)
 */
const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // If phone doesn't start with country code, assume it's an Indian number
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    
    // If it starts with 91 but doesn't have full length, it might already be formatted
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        return cleanPhone;
    }
    
    // For other country codes, handle appropriately
    return cleanPhone;
};

/**
 * Send WhatsApp message using Vonage Messages API
 */
const sendVonageWhatsAppMessage = async (to, message) => {
    try {
        if (!vonageClient) {
            console.log('Vonage not configured. Message that would be sent:');
            console.log(`To: ${to}`);
            console.log(`Message: ${message}`);
            return { success: false, message: 'Vonage API not configured' };
        }

        const formattedPhone = formatPhoneNumber(to);
        
        // Use the sandbox endpoint for testing
        const response = await vonageClient.messages.send({
            message_type: 'text',
            text: message,
            to: formattedPhone,
            from: VONAGE_WHATSAPP_NUMBER,
            channel: 'whatsapp'
        });

        console.log('Vonage WhatsApp message sent successfully:', response);
        return { success: true, result: response };
        
    } catch (error) {
        console.error('Error sending Vonage WhatsApp message:', error);
        
        // Log more details for debugging
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment confirmation via WhatsApp
 */
export const sendWhatsAppConfirmation = async (appointmentDetails) => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;
        
        // Format the date for better readability
        const formattedDate = new Date(slotDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const message = `🏥 *Appointment Confirmed*

Hello ${userData.name},

Your appointment has been successfully booked!

📅 *Date:* ${formattedDate}
🕐 *Time:* ${slotTime}
👨‍⚕️ *Doctor:* Dr. ${docData.name}
🏥 *Speciality:* ${docData.speciality}
${docData.address ? `📍 *Location:* ${docData.address}` : ''}

📋 *Important Reminders:*
• Please arrive 15 minutes early
• Bring a valid ID and insurance card
• Bring any relevant medical records
• Contact us if you need to reschedule

Thank you for choosing Prescripto!

For any queries, please contact our support team.`;

        const result = await sendVonageWhatsAppMessage(userData.phone, message);
        
        if (result.success) {
            console.log(`Confirmation sent to ${userData.name} (${userData.phone})`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to send WhatsApp confirmation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Schedule WhatsApp reminder for appointment
 */
export const scheduleWhatsAppReminder = async (appointmentDetails) => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;
        
        // Parse the appointment date and time
        const appointmentDateTime = new Date(`${slotDate} ${slotTime}`);
        
        // Calculate reminder times
        const reminder24h = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
        const reminder2h = new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000));
        const now = new Date();
        
        const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Schedule 24-hour reminder
        if (reminder24h > now) {
            const delay24h = reminder24h.getTime() - now.getTime();
            
            setTimeout(async () => {
                const message = `🔔 *Appointment Reminder - 24 Hours*

Hello ${userData.name},

This is a friendly reminder about your upcoming appointment:

📅 *Tomorrow:* ${formattedDate}
🕐 *Time:* ${slotTime}
👨‍⚕️ *Doctor:* Dr. ${docData.name}
🏥 *Speciality:* ${docData.speciality}

📋 *Preparation Checklist:*
• Confirm your availability
• Prepare any questions for the doctor
• Gather required documents
• Plan your travel route

If you need to reschedule, please contact us ASAP.

Prescripto Team 💙`;

                await sendVonageWhatsAppMessage(userData.phone, message);
            }, delay24h);
            
            console.log(`24-hour reminder scheduled for ${reminder24h}`);
        }
        
        // Schedule 2-hour reminder
        if (reminder2h > now) {
            const delay2h = reminder2h.getTime() - now.getTime();
            
            setTimeout(async () => {
                const message = `⏰ *Appointment Reminder - 2 Hours*

Hello ${userData.name},

Your appointment is in 2 hours!

📅 *Today:* ${formattedDate}
🕐 *Time:* ${slotTime}
👨‍⚕️ *Doctor:* Dr. ${docData.name}

🚗 *Time to leave soon!*
Please start preparing and head to the clinic.

See you soon!
Prescripto Team`;

                await sendVonageWhatsAppMessage(userData.phone, message);
            }, delay2h);
            
            console.log(`2-hour reminder scheduled for ${reminder2h}`);
        }
        
        return { 
            success: true, 
            message: 'WhatsApp reminders scheduled',
            reminders: {
                reminder24h: reminder24h > now ? reminder24h.toISOString() : 'Not scheduled (too late)',
                reminder2h: reminder2h > now ? reminder2h.toISOString() : 'Not scheduled (too late)'
            }
        };
        
    } catch (error) {
        console.error('Failed to schedule WhatsApp reminders:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment cancellation via WhatsApp
 */
export const sendWhatsAppCancellation = async (appointmentDetails, reason = '') => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;
        
        const formattedDate = new Date(slotDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const message = `❌ *Appointment Cancelled*

Hello ${userData.name},

We regret to inform you that your appointment has been cancelled.

📅 *Date:* ${formattedDate}
🕐 *Time:* ${slotTime}
👨‍⚕️ *Doctor:* Dr. ${docData.name}
🏥 *Speciality:* ${docData.speciality}
${reason ? `\n📝 *Reason:* ${reason}` : ''}

🔄 *Next Steps:*
• You can book a new appointment anytime
• Visit our platform or call our support
• We apologize for any inconvenience

Thank you for your understanding.
Prescripto Team

Need help? Contact our support team immediately.`;

        const result = await sendVonageWhatsAppMessage(userData.phone, message);
        
        if (result.success) {
            console.log(`Cancellation notice sent to ${userData.name} (${userData.phone})`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to send WhatsApp cancellation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment reschedule notification via WhatsApp
 */
export const sendWhatsAppReschedule = async (oldDetails, newDetails) => {
    try {
        const { userData, docData } = oldDetails;
        
        const oldFormattedDate = new Date(oldDetails.slotDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const newFormattedDate = new Date(newDetails.slotDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const message = `🔄 *Appointment Rescheduled*

Hello ${userData.name},

Your appointment has been rescheduled successfully!

❌ *Previous Appointment:*
📅 Date: ${oldFormattedDate}
🕐 Time: ${oldDetails.slotTime}

✅ *New Appointment:*
📅 Date: ${newFormattedDate}
🕐 Time: ${newDetails.slotTime}
👨‍⚕️ Doctor: Dr. ${docData.name}
🏥 Speciality: ${docData.speciality}

📋 *Please Note:*
• Arrive 15 minutes early
• Bring required documents
• Save this new date and time

Thank you for your flexibility!
Prescripto Team`;

        const result = await sendVonageWhatsAppMessage(userData.phone, message);
        
        if (result.success) {
            console.log(`Reschedule notice sent to ${userData.name} (${userData.phone})`);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to send WhatsApp reschedule notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send custom WhatsApp message
 */
export const sendCustomWhatsAppMessage = async (phone, message) => {
    return await sendVonageWhatsAppMessage(phone, message);
};

/**
 * Validate Vonage configuration
 */
export const validateVonageConfig = () => {
    const required = [
        'VONAGE_API_KEY',
        'VONAGE_API_SECRET', 
        'VONAGE_APPLICATION_ID',
        'VONAGE_PRIVATE_KEY',
        'VONAGE_WHATSAPP_NUMBER'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    return {
        isValid: missing.length === 0,
        missing: missing,
        configured: vonageClient !== null
    };
};



// Export the Vonage client for direct use if needed
export { vonageClient };