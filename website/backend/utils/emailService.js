import { client } from '../config/appwrite.js';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend with API key safely
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
    console.warn('Warning: RESEND_API_KEY is missing. Email functionality will not work.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : { emails: { send: async () => ({ success: false, error: 'Missing API Key' }) } };

/**
 * Send appointment confirmation emails to both user and doctor
 * @param {Object} appointmentDetails - Details of the appointment
 * @param {string} userEmail - User's email address
 * @param {string} doctorEmail - Doctor's email address
 * @returns {Promise<Object>} - Result of the email sending operations
 */
export const sendAppointmentConfirmation = async (appointmentDetails, userEmail, doctorEmail) => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;

        // Email content for user
        // Email content for user
        const userSubject = 'Appointment Confirmed - Prescripto';
        const userContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                </div>

                <!-- Main Content -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">Appointment Confirmed</h1>
                    <p style="color: #666666; font-size: 16px; margin: 0;">We look forward to seeing you, ${userData.name}.</p>
                </div>

                <!-- Details Card -->
                <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                    <div style="margin-bottom: 25px;">
                        <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Doctor</p>
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">Dr. ${docData.name}</p>
                    </div>
                     <div style="margin-bottom: 25px;">
                        <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                    </div>
                    <div>
                        <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Location</p>
                        <p style="color: #1a1a1a; font-size: 16px; margin: 0; line-height: 1.5;">${docData.address.line1 || ''} ${docData.address.line2 ? ', ' + docData.address.line2 : ''}</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                    <p style="color: #999999; font-size: 13px; margin-bottom: 10px; line-height: 1.5;">Please arrive 10 minutes before your scheduled time.</p>
                    <p style="color: #cccccc; font-size: 12px; margin-top: 20px;">Prescripto Inc.</p>
                </div>
            </div>
        `;

        // Email content for doctor
        const doctorSubject = 'New Appointment Scheduled - Prescripto';
        const doctorContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                </div>

                <!-- Main Content -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">New Appointment</h1>
                    <p style="color: #666666; font-size: 16px; margin: 0;">You have a new booking, Dr. ${docData.name}.</p>
                </div>

                <!-- Details Card -->
                <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                    <div style="margin-bottom: 25px;">
                        <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Patient</p>
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${userData.name}</p>
                    </div>
                     <div style="margin-bottom: 25px;">
                        <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                    <a href="https://prescripto.com/doctor-dashboard" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Dashboard</a>
                    <p style="color: #cccccc; font-size: 12px; margin-top: 30px;">Prescripto Inc.</p>
                </div>
            </div>
        `;

        // Send emails using Resend
        console.log('Attempting to send emails with Resend...');
        console.log('API Key configured:', process.env.RESEND_API_KEY ? 'Yes' : 'No');

        const results = await Promise.all([
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: userEmail,
                subject: userSubject,
                html: userContent
            }),
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: doctorEmail,
                subject: doctorSubject,
                html: doctorContent
            })
        ]);

        console.log('Email sending results:', JSON.stringify(results));
        return { success: true };
    } catch (error) {
        console.error('Failed to send appointment confirmation emails:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
};

/**
 * Send login notification email to user
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @param {Object} loginInfo - Information about the login event
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export const sendLoginNotification = async (userEmail, userName, loginInfo) => {
    try {
        // Get current date and time for the email
        const loginDate = new Date().toLocaleString();

        const subject = 'New Login Detected - Prescripto';
        const content = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                    <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                </div>
                <h2 style="color: #4a5568;">New Login Alert</h2>
                <p>Dear ${userName},</p>
                <p>A new login was detected on your Prescripto account:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                    <p><strong>Date & Time:</strong> ${loginDate}</p>
                    <p><strong>Device:</strong> ${loginInfo.device || 'Unknown'}</p>
                    <p><strong>Location:</strong> ${loginInfo.location || 'Unknown'}</p>
                </div>
                <p>If this wasn't you, please contact support immediately.</p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                    <p>This is an automated security message, please do not reply to this email.</p>
                </div>
            </div>
        `;

        await resend.emails.send({
            from: 'Prescripto <onboarding@resend.dev>',
            to: userEmail,
            subject: subject,
            html: content
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send login notification email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send email using a template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.data - Data for the template
 * @returns {Promise<Object>} - Result of the email sending operation
 */
export const sendEmail = async ({ to, subject, template, data }) => {
    try {
        let content = '';

        // Select template based on template name
        switch (template) {
            case 'eventRsvpConfirmation':
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                        </div>
                        <h2 style="color: #4a5568;">Event RSVP Confirmation</h2>
                        <p>Dear ${data.name},</p>
                        <p>Thank you for registering for our event!</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                            <p><strong>Event:</strong> ${data.eventTitle}</p>
                            <p><strong>Date:</strong> ${data.eventDate}</p>
                            <p><strong>Time:</strong> ${data.eventTime}</p>
                            <p><strong>Location:</strong> ${data.eventLocation}</p>
                            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
                        </div>
                        <p>We look forward to seeing you there!</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                `;
                break;

            case 'eventPaymentConfirmation':
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                        </div>
                        <h2 style="color: #4a5568;">Payment Confirmation</h2>
                        <p>Dear ${data.name},</p>
                        <p>Your payment for the event has been successfully processed!</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                            <p><strong>Event:</strong> ${data.eventTitle}</p>
                            <p><strong>Date:</strong> ${data.eventDate}</p>
                            <p><strong>Time:</strong> ${data.eventTime}</p>
                            <p><strong>Amount:</strong> ${data.currency.toUpperCase()} ${data.amount}</p>
                            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
                            <p><strong>Location:</strong> ${data.eventLocation}</p>
                            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
                        </div>
                        <p>We look forward to seeing you at the event!</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                `;
                break;

            case 'eventRsvpCancellation':
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                        </div>
                        <h2 style="color: #4a5568;">RSVP Cancellation</h2>
                        <p>Dear ${data.name},</p>
                        <p>Your RSVP for the following event has been cancelled:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                            <p><strong>Event:</strong> ${data.eventTitle}</p>
                            <p><strong>Date:</strong> ${data.eventDate}</p>
                            <p><strong>Time:</strong> ${data.eventTime}</p>
                        </div>
                        <p>If you did not request this cancellation or have any questions, please contact us.</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                `;
                break;

            case 'eventReminder':
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                        </div>
                        <h2 style="color: #4a5568;">Event Reminder</h2>
                        <p>Dear ${data.name},</p>
                        <p>This is a friendly reminder about the upcoming event you've registered for:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                            <p><strong>Event:</strong> ${data.eventTitle}</p>
                            <p><strong>Date:</strong> ${data.eventDate}</p>
                            <p><strong>Time:</strong> ${data.eventTime}</p>
                            <p><strong>Location:</strong> ${data.eventLocation}</p>
                            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
                        </div>
                        <p>We look forward to seeing you there!</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                `;
                break;

                break;

            case 'medicalFileShare':
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
                            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.svg" alt="Prescripto" style="max-width: 100%; height: auto;">
                        </div>
                        <h2 style="color: #4a5568;">Medical File Shared With You</h2>
                        <p>Dear User,</p>
                        <p>${data.sharerName} has shared a medical file with you.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
                            <p><strong>File Name:</strong> ${data.fileName}</p>
                            <p><strong>Shared At:</strong> ${new Date().toLocaleString()}</p>
                            <p><a href="${data.fileLink}" style="background-color: #5f6fff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View File</a></p>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">Or copy this link: ${data.fileLink}</p>
                        </div>
                        <p>Thank you for using Prescripto!</p>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                `;
                break;

            default:
                throw new Error(`Template '${template}' not found`);
        }

        await resend.emails.send({
            from: 'Prescripto <onboarding@resend.dev>',
            to,
            subject,
            html: content
        });

        return { success: true };
    } catch (error) {
        console.error(`Failed to send ${template} email:`, error);
        return { success: false, error: error.message };
    }
};