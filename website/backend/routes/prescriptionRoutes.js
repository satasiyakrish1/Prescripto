import express from 'express';
import {
    createPrescription,
    getPrescription,
    getPatientPrescriptions,
    getDoctorPrescriptions,
    uploadToGoogleDrive,
    deleteFromGoogleDrive,
    listDrivePrescriptions,
    downloadPrescription
} from '../controllers/prescriptionController.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';

const prescriptionRouter = express.Router();

// Create new prescription (Doctor only)
prescriptionRouter.post('/create', authDoctor, createPrescription);

// Get single prescription
prescriptionRouter.get('/:prescriptionId', getPrescription);

// Get all prescriptions for a patient
prescriptionRouter.get('/patient/:patientId', authUser, getPatientPrescriptions);

// Get all prescriptions for a doctor
prescriptionRouter.get('/doctor/:doctorId', authDoctor, getDoctorPrescriptions);

// Upload prescription to Google Drive
prescriptionRouter.post('/upload-drive', authDoctor, uploadToGoogleDrive);

// Delete prescription from Google Drive
prescriptionRouter.post('/delete-drive', authDoctor, deleteFromGoogleDrive);

// List all prescription files from Google Drive
prescriptionRouter.post('/list-drive', authDoctor, listDrivePrescriptions);

// Download prescription PDF
prescriptionRouter.get('/download/:prescriptionId', downloadPrescription);

export default prescriptionRouter;
