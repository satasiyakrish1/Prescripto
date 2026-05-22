import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to service account key file
const keyFilePath = path.join(__dirname, '..', 'service-account.json');

// Check if service account file exists
if (!fs.existsSync(keyFilePath)) {
  console.error(`Service account file not found at: ${keyFilePath}`);
}

// Load the service account key file
let serviceAccount;
try {
  const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
  serviceAccount = JSON.parse(keyFileContent);
  console.log('Service account key loaded successfully');
} catch (error) {
  console.error('Error loading service account key:', error.message);
  serviceAccount = null;
}

/**
 * Uploads a file to Google Drive using service account authentication
 * @param {string} filePath - Path to the file to upload
 * @param {string} fileName - Name to give the file in Google Drive
 * @returns {Promise<Object>} - Object containing file id and webViewLink
 */
async function uploadFile(filePath, fileName) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Create auth client using service account
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Create drive client
    const drive = google.drive({ version: 'v3', auth });

    // File metadata
    const fileMetadata = {
      name: fileName,
      // Optional: specify a folder ID if you want to upload to a specific folder
      // parents: ['FOLDER_ID_HERE']
    };

    // Media object for the file
    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath),
    };

    // Upload the file and make it accessible to anyone with the link
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Set file to be accessible by anyone with the link (as a reader)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('File uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error.message && error.message.includes('DECODER')) {
      throw new Error('Invalid service account key format. Please check your service-account.json file.');
    } else if (error.message && error.message.includes('invalid_grant')) {
      throw new Error('Authentication failed: Invalid JWT Signature. Please check if the service account key is valid and not expired.');
    } else {
      throw error;
    }
  }
}

export default uploadFile;