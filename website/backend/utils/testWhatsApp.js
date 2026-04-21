// ====================================
// FILE 1: testWhatsApp.js (Root directory)
// ====================================

/**
 * Test script for Vonage WhatsApp Service
 * Save this as: testWhatsApp.js
 */

import { 
    sendWhatsAppConfirmation, 
    validateVonageConfig,
    sendCustomWhatsAppMessage 
} from './utils/vonageWhatsAppService.js';

// Test configuration validation
console.log('🔍 Validating Vonage configuration...');
const configValidation = validateVonageConfig();
console.log('Configuration status:', configValidation);

if (!configValidation.isValid) {
    console.error('❌ Configuration is invalid. Missing:', configValidation.missing);
    process.exit(1);
}

console.log('✅ Configuration is valid!');

// Test appointment data (replace with your actual test data)
const testAppointmentDetails = {
    userData: {
        name: 'Test User',
        phone: '9876543210', // Replace with YOUR phone number
        email: 'test@example.com'
    },
    docData: {
        name: 'Dr. Smith',
        speciality: 'General Medicine',
        address: 'Test Hospital, Mumbai'
    },
    slotDate: '2024-12-30',
    slotTime: '10:30 AM'
};

// Test custom message
async function testCustomMessage() {
    console.log('\n📱 Testing custom WhatsApp message...');
    
    const customMessage = `🎉 *Test Message*

Hello! This is a test message from Prescripto.

✅ If you receive this, your Vonage setup is working!

Time: ${new Date().toLocaleString()}`;

    try {
        const result = await sendCustomWhatsAppMessage(
            testAppointmentDetails.userData.phone, 
            customMessage
        );
        
        if (result.success) {
            console.log('✅ Custom message sent successfully!');
            console.log('Message ID:', result.result?.message_uuid);
        } else {
            console.log('❌ Failed to send message');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test appointment confirmation
async function testConfirmation() {
    console.log('\n📱 Testing appointment confirmation...');
    
    try {
        const result = await sendWhatsAppConfirmation(testAppointmentDetails);
        
        if (result.success) {
            console.log('✅ Confirmation sent successfully!');
            console.log('Message ID:', result.result?.message_uuid);
        } else {
            console.log('❌ Failed to send confirmation');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting WhatsApp Tests\n');
    console.log(`📱 Testing with phone: ${testAppointmentDetails.userData.phone}`);
    console.log('⚠️  Make sure to replace the phone number with your own!\n');
    
    // Test 1: Simple custom message
    await testCustomMessage();
    
    // Wait between tests
    console.log('\n⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Appointment confirmation
    await testConfirmation();
    
    console.log('\n🏁 Tests completed!');
    console.log('\n📝 Check your WhatsApp for messages');
}

// Handle command line phone number
const args = process.argv.slice(2);
const phoneArg = args.find(arg => arg.startsWith('--phone='));
if (phoneArg) {
    const phoneNumber = phoneArg.split('=')[1];
    testAppointmentDetails.userData.phone = phoneNumber;
    console.log(`📱 Using phone number: ${phoneNumber}`);
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});

// ====================================
// FILE 2: utils/vonageWhatsAppService.js
// ====================================

/**
 * Vonage WhatsApp Service
 * Save this as: utils/vonageWhatsAppService.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Vonage } from '@vonage/server-sdk';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find .env file
const utilsEnvPath = path.join(__dirname, '.env');
const backendEnvPath = path.join(__dirname, '..', '.env');
const rootEnvPath = path.join(__dirname, '..', '..', '.env');

let envPath = fs.existsSync(utilsEnvPath) ? utilsEnvPath : 
              fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;

dotenv.config({ path: envPath });

// Vonage configuration
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
        console.log('✅ Vonage client initialized successfully');
    } else {
        console.warn('⚠️  Vonage configuration incomplete');
    }
} catch (error) {
    console.error('❌ Failed to initialize Vonage:', error.message);
}

// Format phone number for India
const formatPhoneNumber = (phone) => {
    let cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    
    return cleanPhone;
};

// Send WhatsApp message
const sendVonageWhatsAppMessage = async (to, message) => {
    try {
        if (!vonageClient) {
            console.log('❌ Vonage not configured');
            return { success: false, message: 'Vonage API not configured' };
        }

        const formattedPhone = formatPhoneNumber(to);
        console.log(`📱 Sending to: ${formattedPhone}`);
        
        const response = await vonageClient.messages.send({
            message_type: 'text',
            text: message,
            to: formattedPhone,
            from: VONAGE_WHATSAPP_NUMBER,
            channel: 'whatsapp'
        });

        console.log('✅ Message sent:', response.message_uuid);
        return { success: true, result: response };
        
    } catch (error) {
        console.error('❌ Send error:', error.message);
        return { success: false, error: error.message };
    }
};

// Export functions
export const sendWhatsAppConfirmation = async (appointmentDetails) => {
    const { userData, docData, slotDate, slotTime } = appointmentDetails;
    
    const message = `🏥 *Appointment Confirmed*

Hello ${userData.name},

Your appointment is confirmed!

📅 *Date:* ${slotDate}
🕐 *Time:* ${slotTime}
👨‍⚕️ *Doctor:* Dr. ${docData.name}
🏥 *Speciality:* ${docData.speciality}

Please arrive 15 minutes early.

Thank you!
Prescripto Team`;

    return await sendVonageWhatsAppMessage(userData.phone, message);
};

export const sendCustomWhatsAppMessage = async (phone, message) => {
    return await sendVonageWhatsAppMessage(phone, message);
};

export const validateVonageConfig = () => {
    const required = ['VONAGE_API_KEY', 'VONAGE_API_SECRET', 'VONAGE_APPLICATION_ID', 'VONAGE_PRIVATE_KEY', 'VONAGE_WHATSAPP_NUMBER'];
    const missing = required.filter(key => !process.env[key]);
    
    return {
        isValid: missing.length === 0,
        missing: missing,
        configured: vonageClient !== null
    };
};

export { vonageClient };