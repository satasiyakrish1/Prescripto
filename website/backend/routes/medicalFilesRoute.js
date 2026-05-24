import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authUser from '../middleware/authUser.js';
import {
    uploadMedicalFile,
    listMedicalFiles,
    deleteMedicalFile,
    shareMedicalFile,
    getFileDetails,
    analyzeMedicalFile
} from '../controllers/medicalFilesController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const medicalFilesRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.env.UPLOADS_DIR || path.join(__dirname, '../uploads'), 'medical-files'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only PDF
        if (file.mimetype === 'application/pdf') {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Upload medical file
medicalFilesRouter.post('/upload', authUser, upload.single('file'), uploadMedicalFile);

// List all medical files for user
medicalFilesRouter.get('/list', authUser, listMedicalFiles);

// Get file details
medicalFilesRouter.get('/:fileId', authUser, getFileDetails);

// Delete medical file
medicalFilesRouter.delete('/:fileId', authUser, deleteMedicalFile);

// Share medical file with doctor
medicalFilesRouter.post('/:fileId/share', authUser, shareMedicalFile);

// Analyze medical file with AI
medicalFilesRouter.post('/:fileId/analyze', authUser, analyzeMedicalFile);

export default medicalFilesRouter;
