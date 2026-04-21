import express from 'express';
import {
    updateGPSLocation,
    getLatestLocation,
    getLocationHistory,
    getAllActiveLocations
} from '../controllers/gpsController.js';
import authAdmin from '../middleware/authAdmin.js';

const gpsRouter = express.Router();

// Update GPS location
gpsRouter.post('/update', authAdmin, updateGPSLocation);

// Get latest location for a vehicle
gpsRouter.get('/latest/:vehicleId', authAdmin, getLatestLocation);

// Get location history for a vehicle
gpsRouter.get('/history/:vehicleId', authAdmin, getLocationHistory);

// Get all active vehicles' latest locations
gpsRouter.get('/active', authAdmin, getAllActiveLocations);

export default gpsRouter;