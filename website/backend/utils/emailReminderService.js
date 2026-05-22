/**
 * Notification Service
 * 
 * This service handles email and WhatsApp notifications for appointments including
 * confirmations, reminders, and cancellations using customizable templates.
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
    getAppointmentConfirmationTemplate,
    getAppointmentReminderTemplate,
    getAppointmentCancellationTemplate
} from './emailTemplates.js';
import {
    sendWhatsAppConfirmation,
    scheduleWhatsAppReminder,
    sendWhatsAppCancellation
} from './whatsappService.js';

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
console.log(`Email Reminder Service: Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Fallback to hardcoded API key if environment variable is not available
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Initialize Resend with API key
const resend = new Resend(RESEND_API_KEY);

/**
 * Schedule and send appointment reminder emails
 */
const scheduleReminderEmail = async (appointment) => {
    const { userData, docData, slotDate, slotTime } = appointment;
    
    // Convert appointment date string to Date object
    const appointmentDate = new Date(slotDate);
    
    // Calculate reminder time (24 hours before appointment)
    const reminderTime = new Date(appointmentDate);
    reminderTime.setHours(reminderTime.getHours() - 24);
    
    // Get current time
    const now = new Date();
    
    // Calculate delay in milliseconds
    const delay = reminderTime.getTime() - now.getTime();
    
    // Only schedule if the reminder time is in the future
    if (delay > 0) {
        setTimeout(async () => {
            try {
                const template = getAppointmentReminderTemplate(userData, docData, slotDate, slotTime);
                
                console.log('Sending reminder email with Resend...');
                console.log('API Key configured:', RESEND_API_KEY ? 'Yes' : 'No');
                
                const result = await resend.emails.send({
                    from: 'Prescripto <onboarding@resend.dev>',
                    to: userData.email,
                    subject: template.subject,
                    html: template.html,
                    sender: {
                        name: 'Prescripto',
                        email: 'onboarding@resend.dev',
                        logo: {
                            href: 'https://prescripto.com',
                            image: 'https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg'
                        }
                    }
                });
                
                console.log(`Reminder email sent successfully for appointment on ${slotDate}:`, JSON.stringify(result));
            } catch (error) {
                console.error('Failed to send reminder email:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
            }
        }, delay);
        
        console.log(`Reminder email scheduled for ${reminderTime} (Appointment: ${slotDate})`);
    }
};

/**
 * Send appointment confirmation emails to both user and doctor
 */
export const sendAppointmentConfirmation = async (appointmentDetails) => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;
        
        // Get email templates
        const templates = getAppointmentConfirmationTemplate(userData, docData, slotDate, slotTime);
        
        // Send confirmation emails to both user and doctor
        console.log('Attempting to send confirmation emails with Resend...');
        console.log('API Key configured:', RESEND_API_KEY ? 'Yes' : 'No');
        
        // Send cancellation notifications via email and WhatsApp
        const results = await Promise.all([
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: userData.email,
                subject: templates.user.subject,
                html: templates.user.html,
                sender: {
                    name: 'Prescripto',
                    email: 'onboarding@resend.dev',
                    logo: {
                        href: 'https://prescripto.com',
                        image: 'https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg'
                    }
                }
            }),
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: docData.email,
                subject: templates.doctor.subject,
                html: templates.doctor.html,
                sender: {
                    name: 'Prescripto',
                    email: 'onboarding@resend.dev',
                    logo: {
                        href: 'https://prescripto.com',
                        image: 'https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg'
                    }
                }
            })
        ]);
        
        console.log('Email sending results:', JSON.stringify(results));
        
        // Schedule reminder email and WhatsApp message
        await Promise.all([
            scheduleReminderEmail(appointmentDetails),
            scheduleWhatsAppReminder(appointmentDetails)
        ]);

        // Send WhatsApp confirmation
        await sendWhatsAppConfirmation(appointmentDetails);
        
        return { success: true };
    } catch (error) {
        console.error('Failed to send appointment confirmation emails:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment cancellation emails
 */
export const sendAppointmentCancellation = async (appointmentDetails) => {
    try {
        const { userData, docData, slotDate, slotTime } = appointmentDetails;
        
        // Get email templates
        const templates = getAppointmentCancellationTemplate(userData, docData, slotDate, slotTime);
        
        // Send cancellation emails to both user and doctor
        console.log('Attempting to send cancellation emails with Resend...');
        console.log('API Key configured:', RESEND_API_KEY ? 'Yes' : 'No');
        
        // Send cancellation notifications via email and WhatsApp
        const results = await Promise.all([
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: userData.email,
                subject: templates.user.subject,
                html: templates.user.html,
                sender: {
                    name: 'Prescripto',
                    email: 'onboarding@resend.dev',
                    logo: {
                        href: 'https://prescripto.com',
                        image: 'https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg'
                    }
                }
            }),
            resend.emails.send({
                from: 'Prescripto <onboarding@resend.dev>',
                to: docData.email,
                subject: templates.doctor.subject,
                html: templates.doctor.html,
                sender: {
                    name: 'Prescripto',
                    email: 'onboarding@resend.dev',
                    logo: {
                        href: 'https://prescripto.com',
                        image: 'https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg'
                    }
                }
            })
        ]);
        
        console.log('Email sending results:', JSON.stringify(results));
        return { success: true };
    } catch (error) {
        console.error('Failed to send appointment cancellation emails:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
};