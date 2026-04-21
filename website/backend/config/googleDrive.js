import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Initialize Google Drive API
const initializeDrive = (accessToken) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: accessToken
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
};

// Create or get @prescripto folder
const getOrCreatePrescriptoFolder = async (drive) => {
    try {
        // Search for existing @prescripto folder
        const response = await drive.files.list({
            q: "name='@prescripto' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }

        // Create @prescripto folder if it doesn't exist
        const folderMetadata = {
            name: '@prescripto',
            mimeType: 'application/vnd.google-apps.folder'
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        return folder.data.id;
    } catch (error) {
        console.error('Error creating/getting @prescripto folder:', error);
        throw error;
    }
};

// Create or get appointments subfolder
const getOrCreateAppointmentsFolder = async (drive, prescriptoFolderId) => {
    try {
        // Search for existing appointments folder
        const response = await drive.files.list({
            q: `name='appointments' and '${prescriptoFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }

        // Create appointments folder if it doesn't exist
        const folderMetadata = {
            name: 'appointments',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [prescriptoFolderId]
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        return folder.data.id;
    } catch (error) {
        console.error('Error creating/getting appointments folder:', error);
        throw error;
    }
};

// Upload file to Google Drive
const uploadFileToDrive = async (accessToken, filePath, fileName, mimeType) => {
    try {
        const drive = initializeDrive(accessToken);

        // Get or create folder structure
        const prescriptoFolderId = await getOrCreatePrescriptoFolder(drive);
        const appointmentsFolderId = await getOrCreateAppointmentsFolder(drive, prescriptoFolderId);

        // Upload file
        const fileMetadata = {
            name: fileName,
            parents: [appointmentsFolderId]
        };

        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(filePath)
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink'
        });

        // Make file accessible (optional - set permissions)
        await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        return {
            fileId: file.data.id,
            fileName: file.data.name,
            fileUrl: file.data.webViewLink,
            downloadUrl: file.data.webContentLink,
            folderId: appointmentsFolderId
        };
    } catch (error) {
        console.error('Error uploading file to Drive:', error);
        throw error;
    }
};

// Delete file from Google Drive
const deleteFileFromDrive = async (accessToken, fileId) => {
    try {
        const drive = initializeDrive(accessToken);
        await drive.files.delete({
            fileId: fileId
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting file from Drive:', error);
        throw error;
    }
};

// List files in appointments folder
const listPrescriptionFiles = async (accessToken) => {
    try {
        const drive = initializeDrive(accessToken);
        
        const prescriptoFolderId = await getOrCreatePrescriptoFolder(drive);
        const appointmentsFolderId = await getOrCreateAppointmentsFolder(drive, prescriptoFolderId);

        const response = await drive.files.list({
            q: `'${appointmentsFolderId}' in parents and trashed=false`,
            fields: 'files(id, name, createdTime, modifiedTime, size, webViewLink)',
            orderBy: 'createdTime desc',
            pageSize: 100
        });

        return response.data.files || [];
    } catch (error) {
        console.error('Error listing prescription files:', error);
        throw error;
    }
};

export {
    initializeDrive,
    uploadFileToDrive,
    deleteFileFromDrive,
    listPrescriptionFiles,
    getOrCreatePrescriptoFolder,
    getOrCreateAppointmentsFolder
};
