/**
 * PKPass Generator Utility
 * 
 * This utility generates Apple Wallet .pkpass files for appointment details
 * using the passkit-generator library.
 */

import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
console.log(`PKPass Generator: Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

// Define the path to the certificate files
const CERT_DIR = process.env.APPLE_WALLET_CERT_DIR || path.join(__dirname, '..', 'certs');

// Ensure the certificates directory exists
if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
    console.log(`Created certificates directory at: ${CERT_DIR}`);
}

// Helper to load a file as a buffer, throw if missing
function loadCertFile(filename, label) {
    const filePath = path.join(CERT_DIR, filename);
    console.log(`Attempting to load ${label} from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        const errorMsg = `${label} not found at ${filePath}`;
        console.error(`[PKPass] ERROR: ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    try {
        const fileContent = fs.readFileSync(filePath);
        console.log(`Successfully loaded ${label} (${fileContent.length} bytes)`);
        return fileContent;
    } catch (error) {
        const errorMsg = `Failed to read ${label}: ${error.message}`;
        console.error(`[PKPass] ERROR: ${errorMsg}`);
        throw new Error(errorMsg);
    }
}

/**
 * Generate a .pkpass file for an appointment
 * @param {Object} appointmentDetails - Details of the appointment
 * @returns {Promise<Buffer>} - Buffer containing the .pkpass file
 */
export const generateAppointmentPass = async (appointmentDetails) => {
    try {
        console.log('=== Starting Apple Wallet Pass Generation ===');
        console.log('Certificate directory:', CERT_DIR);
        console.log('Environment variables:');
        console.log('- APPLE_WALLET_CERT_DIR:', process.env.APPLE_WALLET_CERT_DIR || 'Not set (using default)');
        console.log('- APPLE_WALLET_PASS_TYPE_IDENTIFIER:', process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER || 'Not set');
        console.log('- APPLE_WALLET_TEAM_IDENTIFIER:', process.env.APPLE_WALLET_TEAM_IDENTIFIER || 'Not set');
        console.log('- APPLE_WALLET_WEB_SERVICE_URL:', process.env.APPLE_WALLET_WEB_SERVICE_URL || 'Not set');
        
        // Import the Apple Wallet structure generator
        console.log('Importing wallet pass structure generator...');
        const { generateAppleWalletStructure } = await import('./walletPassStructure.js');
        console.log('Successfully imported wallet pass structure generator');

        // Load certificates with robust error handling
        console.log('Loading certificate files...');
        let cert, key, wwdr;
        try {
            cert = loadCertFile('certificate.pem', 'Apple Wallet Pass certificate');
            key = loadCertFile('key.pem', 'Apple Wallet Pass private key');
            wwdr = loadCertFile('wwdr.pem', 'Apple WWDR certificate');
            console.log('All certificate files loaded successfully');
        } catch (certErr) {
            console.error('[PKPass] Certificate error:', certErr.message);
            throw new Error('Apple Wallet certificate/key/WWDR missing or invalid. ' + certErr.message);
        }

        // Check required env variables
        console.log('Checking required environment variables...');
        const requiredEnv = [
            'APPLE_WALLET_PASS_TYPE_IDENTIFIER',
            'APPLE_WALLET_TEAM_IDENTIFIER',
            'APPLE_WALLET_WEB_SERVICE_URL',
            'APPLE_WALLET_AUTH_TOKEN'
        ];
        for (const envVar of requiredEnv) {
            if (!process.env[envVar]) {
                const msg = `[PKPass] Missing required env variable: ${envVar}`;
                console.error(msg);
                throw new Error(msg);
            }
            console.log(`- ${envVar}: [Value exists]`);
        }
        console.log('All required environment variables are set');

        // Generate the pass template using the structure generator
        console.log('Generating pass template structure...');
        const template = generateAppleWalletStructure(appointmentDetails);
        console.log('Pass template structure generated successfully');

        // Create the PKPass instance
        console.log('Creating PKPass instance...');
        let pass;
        try {
            pass = new PKPass(template, { cert, key, wwdr });
            console.log('PKPass instance created successfully');
        } catch (pkErr) {
            console.error('[PKPass] Error creating PKPass instance:', pkErr.message);
            throw new Error('Failed to create PKPass instance: ' + pkErr.message);
        }

        // Add images if available, with error handling
        console.log('Adding images to pass...');
        const imagesDir = path.join(__dirname, '..', 'public', 'wallet-images');
        console.log('Images directory:', imagesDir);
        try {
            if (fs.existsSync(imagesDir)) {
                console.log('Images directory exists');
                const iconPath = path.join(imagesDir, 'icon.png');
                const logoPngPath = path.join(imagesDir, 'logo.png');
                const logo2xPath = path.join(imagesDir, 'logo@2x.png');
                
                if (fs.existsSync(iconPath)) {
                    console.log('Adding icon.png to pass');
                    pass.images.add('icon', fs.readFileSync(iconPath));
                } else {
                    console.warn('icon.png not found at', iconPath);
                }
                
                if (fs.existsSync(logoPngPath)) {
                    console.log('Adding logo.png to pass');
                    pass.images.add('logo', fs.readFileSync(logoPngPath));
                } else {
                    console.warn('logo.png not found at', logoPngPath);
                }
                
                if (fs.existsSync(logo2xPath)) {
                    console.log('Adding logo@2x.png to pass');
                    pass.images.add('logo@2x', fs.readFileSync(logo2xPath));
                } else {
                    console.warn('logo@2x.png not found at', logo2xPath);
                }
            } else {
                console.warn('Images directory does not exist:', imagesDir);
            }
            console.log('Finished adding images to pass');
        } catch (imgErr) {
            console.warn('[PKPass] Could not add images to pass:', imgErr.message);
        }

        // Generate the pass
        console.log('Generating .pkpass buffer...');
        let buffer;
        try {
            buffer = await pass.getAsBuffer();
            console.log('.pkpass buffer generated successfully, size:', buffer.length, 'bytes');
        } catch (genErr) {
            console.error('[PKPass] Error generating .pkpass buffer:', genErr.message);
            throw new Error('Failed to generate .pkpass file: ' + genErr.message);
        }
        if (!buffer || !Buffer.isBuffer(buffer)) {
            const msg = '[PKPass] Generated pass is not a valid Buffer.';
            console.error(msg);
            throw new Error(msg);
        }
        console.log('PKPass generation completed successfully');
        return buffer;
    } catch (error) {
        console.error('Failed to generate PKPass:', error);
        throw error;
    }
};

/**
 * Generate and save a .pkpass file for an appointment
 * @param {Object} appointmentDetails - Details of the appointment
 * @param {string} outputPath - Path to save the .pkpass file
 * @returns {Promise<string>} - Path to the generated .pkpass file
 */
export const generateAndSavePass = async (appointmentDetails, outputPath) => {
    try {
        const pass = await generateAppointmentPass(appointmentDetails);
        // Ensure the directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Write the pass to file
        fs.writeFileSync(outputPath, pass);
        console.log(`PKPass saved to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Failed to save PKPass:', error);
        throw error;
    }
};

// End of file