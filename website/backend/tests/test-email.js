import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct path to the .env file
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

// Check which .env file exists and load it
let envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// API key must be set via environment variable
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in environment variables.');
  console.error('Please set RESEND_API_KEY in your .env file before running this test.');
  process.exit(1);
}

const testEmailSending = async () => {
  try {
    console.log('Testing Resend email sending...');
    if (process.env.RESEND_API_KEY) {
      console.log('Using API Key from environment variables');
    } else {
      console.log('Using fallback API Key for testing');
    }
    console.log('API Key (first few chars):', `${RESEND_API_KEY.substring(0, 5)}...`);
    
    const resend = new Resend(RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'Prescripto <onboarding@resend.dev>', // Use Resend's default domain for testing
      to: 'krishsatasiya44@gmail.com', // Using the email from the .env file
      subject: 'Test Email from Prescripto',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #4a5568; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; text-align: center;">
            <img src="https://krishsatasiya-prescriptosystem.onrender.com/Emailbanner.png" alt="Prescripto" style="max-width: 100%; height: auto;">
          </div>
          <h2 style="color: #4a5568;">Test Email</h2>
          <p>This is a test email to verify Resend integration.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
            <p>This is an automated message from Prescripto.</p>
          </div>
        </div>
      `
    });
    
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send test email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
};

testEmailSending();