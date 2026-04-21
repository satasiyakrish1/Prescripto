import express from 'express';
import {
    getAllWards,
    getWardById,
    createWard,
    updateWard,
    deleteWard,
    updateBedStatus,
    getWardStats,
    registerEmergency,
    getEmergencyCases,
    updateEmergencyCase
} from '../controllers/wardController.js';
import authAdmin from '../middleware/authAdmin.js';

const wardRouter = express.Router();

// Ward management routes
wardRouter.get('/all', authAdmin, getAllWards);
wardRouter.get('/stats', authAdmin, getWardStats);
wardRouter.get('/:id', authAdmin, getWardById);
wardRouter.post('/create', authAdmin, createWard);
wardRouter.put('/update/:id', authAdmin, updateWard);
wardRouter.delete('/:id', authAdmin, deleteWard);
wardRouter.put('/bed-status', authAdmin, updateBedStatus);

// Emergency case routes
wardRouter.post('/emergency/register', authAdmin, registerEmergency);
wardRouter.get('/emergency/cases', authAdmin, getEmergencyCases);
wardRouter.put('/emergency/update/:id', authAdmin, updateEmergencyCase);

export default wardRouter;