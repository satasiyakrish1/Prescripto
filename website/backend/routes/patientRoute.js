import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import authDoctor from '../middleware/authDoctor.js';

// Import the patient controller using ES modules
import { 
    getAllPatients, 
    createPatient, 
    getPatientStats, 
    getPatientById, 
    updatePatient, 
    deletePatient, 
    updateMedications,
    addMedicalHistory,
    getPatientsByWard 
} from '../controllers/patientController.js';

const router = express.Router();

// Patient routes
router.get('/', authAdmin, getAllPatients);
router.post('/', authAdmin, createPatient);
router.get('/stats', authAdmin, getPatientStats);
router.get('/:id', authAdmin, getPatientById);
router.put('/:id', authAdmin, updatePatient);
router.delete('/:id', authAdmin, deletePatient);

// Patient medical records routes
router.put('/:id/medications', authAdmin, updateMedications);
router.post('/:id/medical-history', authAdmin, addMedicalHistory);
router.get('/ward/:wardId', authAdmin, getPatientsByWard);

export default router;