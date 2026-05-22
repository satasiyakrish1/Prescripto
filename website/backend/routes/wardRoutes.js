const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');
const patientController = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// Ward routes
router.get('/', protect, wardController.getAllWards);
router.post('/', protect, wardController.createWard);
router.get('/stats', protect, wardController.getWardStats);
router.get('/:id', protect, wardController.getWardById);
router.put('/:id', protect, wardController.updateWard);
router.delete('/:id', protect, wardController.deleteWard);

// Bed management routes
router.patch('/:wardId/bed/:bedId', protect, wardController.updateBedStatus);

// Patient management routes within wards
router.post('/:wardId/bed/:bedId/admit', protect, wardController.admitPatient);
router.post('/:wardId/bed/:bedId/discharge/:patientId', protect, wardController.dischargePatient);
router.get('/:wardId/patients', protect, patientController.getPatientsByWard);

module.exports = router; 