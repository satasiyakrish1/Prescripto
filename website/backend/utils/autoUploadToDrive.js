import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadFile from './uploadToDrive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automatically uploads a PDF file to Google Drive after it's generated
 * and optionally deletes the local file
 * @param {string} localFilePath - Path to the local PDF file
 * @param {string} driveFileName - Name for the file in Google Drive
 * @param {boolean} deleteLocal - Whether to delete the local file after upload (default: true)
 * @returns {Promise<Object>} - Google Drive upload result
 */
export async function autoUploadPDFToDrive(localFilePath, driveFileName, deleteLocal = true) {
    try {
        console.log(`[AutoUpload] Starting upload for: ${localFilePath}`);
        
        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`File not found: ${localFilePath}`);
        }

        // Upload to Google Drive
        const driveResult = await uploadFile(localFilePath, driveFileName);
        
        console.log(`[AutoUpload] Successfully uploaded to Google Drive:`, driveResult);

        // Delete local file if requested
        if (deleteLocal) {
            try {
                fs.unlinkSync(localFilePath);
                console.log(`[AutoUpload] Deleted local file: ${localFilePath}`);
            } catch (deleteError) {
                console.warn(`[AutoUpload] Failed to delete local file: ${deleteError.message}`);
                // Don't throw error if deletion fails - upload was successful
            }
        }

        return {
            success: true,
            googleDrive: {
                fileId: driveResult.id,
                fileUrl: driveResult.webViewLink,
                fileName: driveFileName
            },
            localPath: deleteLocal ? null : localFilePath
        };

    } catch (error) {
        console.error(`[AutoUpload] Error uploading to Google Drive:`, error);
        throw error;
    }
}

/**
 * Watches a directory for new PDF files and automatically uploads them
 * @param {string} watchDir - Directory to watch for new PDF files
 * @param {Function} callback - Optional callback function after upload
 */
export function watchAndUploadPDFs(watchDir, callback) {
    const absoluteWatchDir = path.isAbsolute(watchDir) 
        ? watchDir 
        : path.join(__dirname, '..', watchDir);

    console.log(`[AutoUpload] Watching directory: ${absoluteWatchDir}`);

    // Ensure directory exists
    if (!fs.existsSync(absoluteWatchDir)) {
        fs.mkdirSync(absoluteWatchDir, { recursive: true });
    }

    // Watch for new files
    fs.watch(absoluteWatchDir, async (eventType, filename) => {
        if (eventType === 'rename' && filename && filename.endsWith('.pdf')) {
            const filePath = path.join(absoluteWatchDir, filename);
            
            // Wait a bit to ensure file is fully written
            setTimeout(async () => {
                try {
                    if (fs.existsSync(filePath)) {
                        console.log(`[AutoUpload] New PDF detected: ${filename}`);
                        const result = await autoUploadPDFToDrive(filePath, filename, true);
                        
                        if (callback) {
                            callback(null, result);
                        }
                    }
                } catch (error) {
                    console.error(`[AutoUpload] Error processing ${filename}:`, error);
                    if (callback) {
                        callback(error, null);
                    }
                }
            }, 1000); // Wait 1 second for file to be fully written
        }
    });
}

export default autoUploadPDFToDrive;
