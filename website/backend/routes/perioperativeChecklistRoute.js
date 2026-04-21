import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import authDoctor from '../middleware/authDoctor.js';
import {
    createChecklist,
    getChecklist,
    updateChecklist,
    getPatientChecklists,
    getUpcomingProcedures,
    updateStatus,
    deleteChecklist
} from '../controllers/perioperativeChecklistController.js';

const router = express.Router();

// Create a new perioperative checklist
router.post('/', authAdmin, createChecklist);

// Get a perioperative checklist by ID
router.get('/:checklistId', authAdmin, getChecklist);

// Update a perioperative checklist
router.put('/:checklistId', authAdmin, updateChecklist);

// Get all checklists for a patient
router.get('/patient/:patientId', authAdmin, getPatientChecklists);

// Get all upcoming surgeries/procedures
router.get('/upcoming', authAdmin, getUpcomingProcedures);

// Update checklist status
router.patch('/:checklistId/status', authAdmin, updateStatus);

// Delete a perioperative checklist
router.delete('/:checklistId', authAdmin, deleteChecklist);

// Doctor routes - with more limited permissions
router.get('/doctor/upcoming', authDoctor, getUpcomingProcedures);
router.get('/doctor/:checklistId', authDoctor, getChecklist);
router.patch('/doctor/:checklistId/status', authDoctor, updateStatus);

export default router;