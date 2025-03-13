import { client } from '../config/appwrite.js';
import { ID } from 'node-appwrite';

/**
 * Send login notification email to user
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @param {Object} loginInfo - Information about the login event
 * @returns {Promise<Object>} - Result of the email sending operation
 */
const sendLoginNotification = async (userEmail, userName, loginInfo) => {
    try {
        // Get current date and time for the email
        const loginDate = new Date().toLocaleString();
        
        // Get device information
        const deviceInfo = loginInfo.userAgent || 'Unknown device';
        
        // Create email content
        const emailSubject = 'Login Alert - Prescripto Account';
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #4a5568;">Hello ${userName},</h2>
                <p>We detected a new login to your Prescripto account.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                    <p><strong>Login Time:</strong> ${loginDate}</p>
                    <p><strong>Device:</strong> ${deviceInfo}</p>
                </div>
                <p>If this was you, you can ignore this email. If you didn't log in recently, please secure your account by changing your password immediately.</p>
                <p>Thank you for using Prescripto!</p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        `;

        // Send email using Appwrite
        const result = await client.functions.createExecution(
            process.env.APPWRITE_EMAIL_FUNCTION_ID,
            JSON.stringify({
                to: userEmail,
                subject: emailSubject,
                content: emailContent,
            }),
            false,
            '/',
            'POST',
            {}
        );

        return { success: true, result };
    } catch (error) {
        console.error('Error sending login notification email:', error);
        return { success: false, error: error.message };
    }
};

export { sendLoginNotification };