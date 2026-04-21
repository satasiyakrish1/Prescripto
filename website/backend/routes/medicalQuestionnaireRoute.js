import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import {
    saveQuestionnaire,
    getQuestionnaire,
    getPatientHistory
} from '../controllers/medicalQuestionnaireController.js';

const router = express.Router();

// Create or update medical questionnaire
router.post('/appointments/:appointmentId', authAdmin, saveQuestionnaire);

// Get questionnaire by appointment ID
router.get('/appointments/:appointmentId', authAdmin, getQuestionnaire);

// Get patient's medical history
router.get('/patients/:patientId/history', authAdmin, getPatientHistory);

export default router;