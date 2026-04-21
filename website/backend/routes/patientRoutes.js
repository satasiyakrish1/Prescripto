const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// Patient routes
router.get('/', protect, patientController.getAllPatients);
router.post('/', protect, patientController.createPatient);
router.get('/stats', protect, patientController.getPatientStats);
router.get('/:id', protect, patientController.getPatientById);
router.put('/:id', protect, patientController.updatePatient);
router.delete('/:id', protect, patientController.deletePatient);

// Patient medical records routes
router.put('/:id/medications', protect, patientController.updateMedications);
router.post('/:id/medical-history', protect, patientController.addMedicalHistory);

module.exports = router; 