import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import MedicalFile from '../models/medicalFileModel.js';
import userModel from '../models/userModel.js';
import { sendEmail } from '../utils/emailService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { InputFile, Storage, ID, Permission, Role, Client } = require('node-appwrite');
import { client } from '../config/appwrite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY);
const storage = new Storage(client);

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPE = 'application/pdf';
const BUCKET_ID = process.env.APPWRITE_STORAGE_BUCKET_ID || 'medical-files'; // Ensure this bucket exists in Appwrite

// Utility: Clean up local file
const cleanupLocalFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[MedicalFiles] Cleaned up local file: ${filePath}`);
        }
    } catch (error) {
        console.error(`[MedicalFiles] Error cleaning up file:`, error.message);
    }
};

// Utility: Validate file
const validateFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('No file provided');
    }

    if (file && file.mimetype !== ALLOWED_MIME_TYPE) {
        errors.push('Only PDF files are allowed');
    }

    if (file && file.size > MAX_FILE_SIZE) {
        errors.push(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Upload medical file to Cloudinary
 * Optimized version with better error handling and cleanup
 */
/**
 * Upload medical file to Appwrite Storage
 * Optimized version with better error handling and cleanup
 */
export const uploadMedicalFile = async (req, res) => {
    const startTime = Date.now();
    let fileId = null;
    const file = req.file;

    try {
        // 1. Extract and validate userId
        const userId = req.body.userId || req.userId;

        console.log(`[MedicalFiles] Upload initiated - User: ${userId}, File: ${file?.originalname}`);

        if (!userId) {
            if (file) cleanupLocalFile(file.path);
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // 2. Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
            if (file) cleanupLocalFile(file.path);
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }

        // 3. Upload to Appwrite Storage
        console.log(`[MedicalFiles] Uploading to Appwrite Storage...`);
        const uploadStartTime = Date.now();

        // Read file buffer
        const fileBuffer = fs.readFileSync(file.path);

        // Create a File-like object for Appwrite
        // Appwrite SDK expects a File object with specific properties
        const fileBlob = new Blob([fileBuffer], { type: file.mimetype });

        // Create File object (available in Node.js 20+)
        const fileObject = new File([fileBlob], file.originalname, {
            type: file.mimetype,
            lastModified: Date.now()
        });

        const appwriteFile = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            fileObject,
            [
                Permission.read(Role.any()), // Public read access for simplicity in sharing
                Permission.write(Role.user(userId))
            ]
        );

        fileId = appwriteFile.$id;
        const baseUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}`;
        const viewUrl = `${baseUrl}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
        const downloadUrl = `${baseUrl}/download?project=${process.env.APPWRITE_PROJECT_ID}`;

        console.log(`[MedicalFiles] Upload completed in ${Date.now() - uploadStartTime}ms`);
        console.log(`[MedicalFiles] File ID: ${fileId}`);

        // 4. AI Analysis
        console.log(`[MedicalFiles] Starting AI Analysis...`);
        let analysisResult = 'AI Analysis could not be completed.';

        try {
            const uploadResponse = await fileManager.uploadFile(file.path, {
                mimeType: file.mimetype,
                displayName: file.originalname,
            });

            // Wait for file to process
            let fileState = await fileManager.getFile(uploadResponse.file.name);
            while (fileState.state === 'PROCESSING') {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                fileState = await fileManager.getFile(uploadResponse.file.name);
            }

            if (fileState.state === 'FAILED') {
                throw new Error("Gemini file processing failed.");
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const prompt = `
            Analyze this medical document deeply and provide a structured response in Markdown.
            
            Output sections:
            1. **Executive Summary**: A brief, high-level summary (2-3 sentences).
            2. **Key Findings**: Bullet points of the most important medical data (diagnoses, test results, vital signs).
            3. **Medications & Prescriptions**: List any mentioned meds with dosages if available.
            4. **Action Items**: Explicit recommendations or next steps (e.g., "See cardiologist", "Take medication").
            5. **Patient-Friendly Explanation**: Explain technical terms in simple language for the patient.
            
            Keep it professional, accurate, and easy to read.
            `;

            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                },
                { text: prompt }
            ]);

            analysisResult = result.response.text();
            console.log(`[MedicalFiles] AI Analysis completed`);

            // Cleanup Gemini file (optional but good practice)
            // await fileManager.deleteFile(uploadResponse.file.name);

        } catch (aiError) {
            console.error(`[MedicalFiles] AI Analysis failed:`, aiError);
            analysisResult = "AI Analysis is currently unavailable. Please try again later. Error: " + aiError.message;
        }

        // 5. Save to MongoDB
        const newMedicalFile = new MedicalFile({
            userId,
            fileName: file.originalname,
            googleDriveFileId: fileId, // Storing Appwrite File ID here
            webViewLink: viewUrl,
            webContentLink: downloadUrl,
            mimeType: file.mimetype,
            resourceType: 'appwrite',
            aiAnalysis: analysisResult,
            uploadDate: new Date()
        });

        await newMedicalFile.save();
        console.log(`[MedicalFiles] File saved to database`);

        // 6. Clean up local file
        cleanupLocalFile(file.path);

        // 7. Send success response
        const totalTime = Date.now() - startTime;
        console.log(`[MedicalFiles] Upload completed successfully in ${totalTime}ms`);

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                id: newMedicalFile._id.toString(),
                name: newMedicalFile.fileName,
                viewLink: viewUrl,
                downloadLink: downloadUrl,
                uploadedAt: newMedicalFile.uploadDate,
                aiAnalysis: newMedicalFile.aiAnalysis,
                mimeType: newMedicalFile.mimeType
            }
        });

    } catch (error) {
        console.error(`[MedicalFiles] Upload error:`, error);

        // Comprehensive cleanup on error
        if (file?.path) cleanupLocalFile(file.path);

        // Try to delete from Appwrite if upload succeeded but DB failed
        if (fileId) {
            try {
                await storage.deleteFile(BUCKET_ID, fileId);
            } catch (delErr) {
                console.error('Failed to cleanup Appwrite file:', delErr);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Error uploading file. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * List all medical files for a user
 * Optimized with select fields and lean query
 */
/**
 * List all medical files for a user
 * Optimized with select fields and lean query
 */
export const listMedicalFiles = async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.userId || req.body.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`[MedicalFiles] Listing files for user: ${userId}`);

        // Optimized query with lean() for better performance
        const files = await MedicalFile.find({ userId })
            .select('fileName googleDriveFileId webViewLink webContentLink mimeType resourceType uploadDate aiAnalysis sharedWith')
            .sort({ uploadDate: -1 })
            .lean()
            .exec();

        // Transform to match frontend expectations
        const transformedFiles = files.map(file => {
            let viewLink = file.webViewLink;
            let downloadLink = file.webContentLink;

            // Appwrite URL Regeneration
            if (file.resourceType === 'appwrite' && file.googleDriveFileId) {
                const baseUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.googleDriveFileId}`;
                // Use view endpoint (free tier compatible)
                viewLink = `${baseUrl}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
                // Download link remains the same
                downloadLink = `${baseUrl}/download?project=${process.env.APPWRITE_PROJECT_ID}`;
            }

            // Legacy Cloudinary Support (keep existing logic just in case)
            if (file.resourceType !== 'appwrite' && file.googleDriveFileId && !file.googleDriveFileId.startsWith('http')) {
                // ... (Cloudinary logic omitted for brevity, assuming migration or new files only)
                // If you still have older files, you might want to keep the old Cloudinary generation logic or just trust the DB links.
                // Assuming we trust the DB links for now or they are already fully qualified URLs.
            }

            return {
                id: file._id.toString(),
                name: file.fileName,
                mimeType: file.mimeType,
                size: 0,
                viewLink: viewLink,
                downloadLink: downloadLink,
                uploadedAt: file.uploadDate,
                aiAnalysis: file.aiAnalysis,
                googleDriveFileId: file.googleDriveFileId,
                sharedWith: file.sharedWith
            };
        });

        const queryTime = Date.now() - startTime;
        console.log(`[MedicalFiles] Found ${transformedFiles.length} files in ${queryTime}ms`);

        return res.status(200).json({
            success: true,
            files: transformedFiles,
            count: transformedFiles.length,
            performanceMs: queryTime
        });

    } catch (error) {
        console.error(`[MedicalFiles] List error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error loading files',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete a medical file
 * Optimized with parallel cleanup
 */
/**
 * Delete a medical file
 * Optimized with parallel cleanup
 */
export const deleteMedicalFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.body.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`[MedicalFiles] Deleting file: ${fileId}`);

        // Find and verify ownership
        const file = await MedicalFile.findOne({ _id: fileId, userId }).lean();

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Parallel deletion from Storage and MongoDB for better performance
        const [storageResult, dbResult] = await Promise.allSettled([
            // Delete from Appwrite Storage
            (async () => {
                if (file.resourceType === 'appwrite') {
                    try {
                        await storage.deleteFile(BUCKET_ID, file.googleDriveFileId);
                        console.log(`[MedicalFiles] Appwrite deletion success`);
                    } catch (err) {
                        console.error(`[MedicalFiles] Appwrite deletion error:`, err.message);
                    }
                } else {
                    // Legacy Cloudinary Deletion (optional, if you want to keep cleaning up old files)
                    console.log('[MedicalFiles] Skipping Cloudinary deletion for legacy file');
                }
            })(),
            // Delete from MongoDB
            MedicalFile.findByIdAndDelete(fileId)
        ]);

        console.log(`[MedicalFiles] File deleted successfully`);

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error(`[MedicalFiles] Delete error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Share a medical file with a doctor or any user
 * Supports email sharing and public link generation
 */
export const shareMedicalFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { recipeintEmail } = req.body; // Changed from doctorEmail to generic
        const userId = req.body.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`[MedicalFiles] Sharing request for file ${fileId} by user ${userId}`);

        // Find file and verify ownership
        const file = await MedicalFile.findOne({ _id: fileId, userId });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const sharer = await userModel.findById(userId).select('name');
        const sharerName = sharer ? sharer.name : 'A Prescripto User';

        let shareMessage = 'Link generated successfully';

        // If email is provided, send email and add to sharedWith
        if (recipientEmail && recipientEmail.includes('@')) {
            console.log(`[MedicalFiles] Sharing with email: ${recipientEmail}`);

            // Add to sharedWith if not already present
            const alreadyShared = file.sharedWith.some(share => share.email === recipientEmail);
            if (!alreadyShared) {
                file.sharedWith.push({
                    email: recipientEmail,
                    sharedAt: new Date(),
                    accessType: 'view'
                });
                await file.save();
            }

            // Send Email
            const emailResult = await sendEmail({
                to: recipientEmail,
                subject: 'Medical File Shared With You - Prescripto',
                template: 'medicalFileShare',
                data: {
                    sharerName: sharerName,
                    fileName: file.fileName,
                    fileLink: file.webViewLink
                }
            });

            if (emailResult.success) {
                shareMessage = `File shared successfully and email sent to ${recipientEmail}`;
            } else {
                shareMessage = `File shared but failed to send email to ${recipientEmail}`;
            }
        }

        return res.status(200).json({
            success: true,
            message: shareMessage,
            shareableLink: file.webViewLink,
            fileName: file.fileName,
            sharedWith: file.sharedWith
        });

    } catch (error) {
        console.error(`[MedicalFiles] Share error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error sharing file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


/**
 * Analyze a medical file using Gemini AI
 * Optimized for on-demand analysis
 */
export const analyzeMedicalFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { prompt } = req.body;
        const userId = req.body.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`[MedicalFiles] Analyzing file: ${fileId}`);

        const file = await MedicalFile.findOne({ _id: fileId, userId });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check if file is hosted on Cloudinary or just a URL
        // We need a way to pass the file to Gemini. 
        // If it was just uploaded, we had the local path.
        // For existing files, we might need to download it or pass the URL if Gemini supports it.
        // GoogleAIFileManager usually needs a local file or a File API compatible object.
        // However, we stored `googleDriveFileId`. If that's a Cloudinary public ID, we can't directly use it with Gemini FileManager unless we download it first.

        // LIMITATION: The current uploaded file path is deleted after upload.
        // To re-analyze, we must download the file from Cloudinary to a temp path.

        console.log(`[MedicalFiles] Downloading file for analysis...`);
        const tempFilePath = path.join(__dirname, `../uploads/temp_${Date.now()}_${file.fileName}`);

        // Helper to download file
        const downloadFile = async (url, dest) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(dest, buffer);
        };

        try {
            let fileUrl = file.webViewLink;
            // If it's an Appwrite file, ensure we have a valid download URL
            if (file.resourceType === 'appwrite' && file.googleDriveFileId) {
                fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${file.googleDriveFileId}/download?project=${process.env.APPWRITE_PROJECT_ID}`;
            }

            await downloadFile(fileUrl, tempFilePath);

            // Upload to Google AI File Manager
            const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                mimeType: file.mimeType,
                displayName: file.fileName,
            });

            // Wait for file to process
            let fileState = await fileManager.getFile(uploadResponse.file.name);
            while (fileState.state === 'PROCESSING') {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                fileState = await fileManager.getFile(uploadResponse.file.name);
            }

            if (fileState.state === 'FAILED') {
                throw new Error("Gemini file processing failed.");
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const defaultPrompt = `
            Analyze this medical document deeply and provide a structured response in Markdown.
            
            Output sections:
            1. **Executive Summary**: A brief, high-level summary (2-3 sentences).
            2. **Key Findings**: Bullet points of the most important medical data (diagnoses, test results, vital signs).
            3. **Medications & Prescriptions**: List any mentioned meds with dosages if available.
            4. **Action Items**: Explicit recommendations or next steps (e.g., "See cardiologist", "Take medication").
            5. **Patient-Friendly Explanation**: Explain technical terms in simple language for the patient.
            
            Keep it professional, accurate, and easy to read.
            `;

            const analysisPrompt = prompt || defaultPrompt;

            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                },
                { text: analysisPrompt }
            ]);

            const analysisText = result.response.text();

            // Update the record
            file.aiAnalysis = analysisText;
            await file.save();

            // Cleanup
            cleanupLocalFile(tempFilePath);
            console.log(`[MedicalFiles] Analysis updated`);

            return res.status(200).json({
                success: true,
                message: 'File analyzed successfully',
                analysis: analysisText
            });

        } catch (downloadError) {
            if (fs.existsSync(tempFilePath)) cleanupLocalFile(tempFilePath);
            throw downloadError;
        }

    } catch (error) {
        console.error(`[MedicalFiles] Analysis error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error analyzing file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get file details
 * Optimized with lean query
 */
export const getFileDetails = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.userId || req.body.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`[MedicalFiles] Getting details for file: ${fileId}`);

        const file = await MedicalFile.findById(fileId)
            .select('-__v')
            .lean();

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        return res.status(200).json({
            success: true,
            file: {
                id: file._id.toString(),
                name: file.fileName,
                viewLink: file.webViewLink,
                downloadLink: file.webContentLink,
                uploadedAt: file.uploadDate,
                aiAnalysis: file.aiAnalysis,
                mimeType: file.mimeType
            }
        });

    } catch (error) {
        console.error(`[MedicalFiles] Get details error:`, error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching file details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default {
    uploadMedicalFile,
    listMedicalFiles,
    deleteMedicalFile,
    shareMedicalFile,
    getFileDetails,
    analyzeMedicalFile
};
