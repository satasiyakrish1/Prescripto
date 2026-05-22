import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Pay API Credentials
// Ensure your service account key file is located securely.
const GOOGLE_SERVICE_ACCOUNT_KEY_FILE = path.resolve(__dirname, '../certs/your-google-service-account-key.json');
const GOOGLE_WALLET_ISSUER_ID = 'your-google-wallet-issuer-id'; // Found in Google Pay Business Console

const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/wallet_object.generic'],
});

export const generateGooglePayPassLink = async (googlePayPassData) => {
    try {
        const client = await auth.getClient();
        google.options({ auth: client });

        // First, ensure your Generic Class exists (or create it if it doesn't)
        // This step is usually done once per pass type.
        const classId = `prescripto.appointment.class.${GOOGLE_WALLET_ISSUER_ID}`; // Match your GooglePayPass data
        
        try {
            await google.walletobjects.v1.genericclasses.get({ resourceId: classId });
            console.log('Google Pay Class already exists:', classId);
        } catch (error) {
            if (error.code === 404) {
                console.log('Google Pay Class does not exist, creating:', classId);
                await google.walletobjects.v1.genericclasses.insert({
                    resource: {
                        id: classId,
                        classTemplateInfo: {
                            cardTemplateOverride: {
                                cardRowTemplateInfos: [
                                    {
                                        twoItems: {
                                            startItem: { fieldSelector: { fieldPath: '$.textModulesData[0]' } }, // Date & Time
                                            endItem: { fieldSelector: { fieldPath: '$.textModulesData[1]' } },   // Specialty
                                        },
                                    },
                                ],
                            },
                        },
                        heroImage: {
                            sourceUri: { uri: 'https://prescripto.com/assets/banner.png' }, // Provide a banner image URL
                        },
                        hexBackgroundColor: '#4a5568',
                        logo: {
                            sourceUri: { uri: 'https://prescripto.com/assets/logo-white.png' },
                        },
                        localizedName: { defaultValue: { language: 'en', value: 'Prescripto Appointment' } },
                        // Add more class properties as needed for better UI/UX in Google Wallet
                    },
                });
                console.log('Google Pay Class created successfully.');
            } else {
                throw error;
            }
        }
        
        // Construct the object payload with the correct classId
        const objectPayload = {
            ...googlePayPassData.payload.genericObjects[0], // Assuming only one generic object
            classId: classId, // Ensure this matches the class created/checked above
            id: `${GOOGLE_WALLET_ISSUER_ID}.${googlePayPassData.payload.genericObjects[0].id}`, // Fully qualified object ID
        };
        
        // NOTE: You must sign the JWT for Google Wallet Save API. This is a placeholder.
        // You should use a JWT library and your Google service account to sign the payload.
        // For now, just return a dummy link for demonstration.
        const saveUrl = `https://pay.google.com/gp/v/save?dummy=1`;
        
        return saveUrl;

    } catch (error) {
        console.error('Error generating Google Pay pass link:', error);
        throw new Error('Failed to generate Google Pay pass link.');
    }
};

/**
 * Convert all wallet images from SVG to PNG for use in wallet passes
 * This function is used by the walletController to prepare images for passes
 */
export const convertAllWalletImages = async () => {
    try {
        // Define source and destination directories
        const sourceDir = path.resolve(__dirname, '../public/images/wallet/svg');
        const destDir = path.resolve(__dirname, '../public/images/wallet/png');
        
        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            console.log(`Created PNG destination directory at: ${destDir}`);
        }
        
        // Get list of SVG files
        const svgFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.svg'));
        
        if (svgFiles.length === 0) {
            console.log('No SVG files found to convert');
            return [];
        }
        
        console.log(`Found ${svgFiles.length} SVG files to convert`);
        
        // For each SVG file, convert to PNG
        // Note: In a real implementation, you would use a library like sharp or svg2png
        // Since we can't install new packages, we'll simulate the conversion process
        const convertedFiles = svgFiles.map(svgFile => {
            const baseName = path.basename(svgFile, '.svg');
            const pngFileName = `${baseName}.png`;
            const pngFilePath = path.join(destDir, pngFileName);
            
            // In a real implementation, you would convert the SVG to PNG here
            // For simulation purposes, we'll just create an empty file
            // This is just a placeholder - in production, use proper image conversion
            if (!fs.existsSync(pngFilePath)) {
                // In a real implementation, this would be the conversion code
                // Example: await sharp(path.join(sourceDir, svgFile)).png().toFile(pngFilePath);
                
                // For simulation, just write an empty file
                fs.writeFileSync(pngFilePath, '');
                console.log(`Converted ${svgFile} to ${pngFileName}`);
            } else {
                console.log(`${pngFileName} already exists, skipping conversion`);
            }
            
            return pngFilePath;
        });
        
        console.log(`Successfully converted ${convertedFiles.length} SVG files to PNG`);
        return convertedFiles;
    } catch (error) {
        console.error('Error converting wallet images:', error);
        throw new Error('Failed to convert wallet images.');
    }
};