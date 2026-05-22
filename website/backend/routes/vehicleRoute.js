import express from 'express';
import {
    getAllVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    addMaintenanceRecord,
    getVehiclesByStatus,
    getVehicleStats
} from '../controllers/vehicleController.js';
import authAdmin from '../middleware/authAdmin.js';

const vehicleRouter = express.Router();

// Get all vehicles
vehicleRouter.get('/all', authAdmin, getAllVehicles);

// Get vehicle statistics
vehicleRouter.get('/stats', authAdmin, getVehicleStats);

// Get vehicles by status
vehicleRouter.get('/status/:status', authAdmin, getVehiclesByStatus);

// Get vehicle by ID
vehicleRouter.get('/:id', authAdmin, getVehicleById);

// Create new vehicle
vehicleRouter.post('/create', authAdmin, createVehicle);

// Update vehicle
vehicleRouter.put('/:id', authAdmin, updateVehicle);

// Update vehicle status
vehicleRouter.patch('/:id/status', authAdmin, updateVehicleStatus);

// Delete vehicle
vehicleRouter.delete('/:id', authAdmin, deleteVehicle);

// Add maintenance record
vehicleRouter.post('/:id/maintenance', authAdmin, addMaintenanceRecord);

export default vehicleRouter;