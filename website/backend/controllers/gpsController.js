import GPSLocation from '../models/gpsLocationModel.js';
import Vehicle from '../models/vehicleModel.js';

// Update GPS location
export const updateGPSLocation = async (req, res) => {
    try {
        const { vehicleId, latitude, longitude, speed, heading, accuracy } = req.body;

        // Validate vehicle exists
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Create new GPS location record
        const gpsLocation = new GPSLocation({
            vehicleId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy
        });

        // Save GPS location
        await gpsLocation.save();

        // Update vehicle's current location in vehicle collection
        vehicle.currentLocation = `${latitude},${longitude}`;
        await vehicle.save();

        res.status(201).json(gpsLocation);
    } catch (error) {
        console.error('Error updating GPS location:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get latest location for a vehicle
export const getLatestLocation = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const location = await GPSLocation.getLatestLocation(vehicleId);
        if (!location) {
            return res.status(404).json({ message: 'No location data found for this vehicle' });
        }

        res.status(200).json(location);
    } catch (error) {
        console.error('Error fetching latest location:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get location history for a vehicle
export const getLocationHistory = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { start, end } = req.query;

        const query = { vehicleId };
        if (start || end) {
            query.timestamp = {};
            if (start) query.timestamp.$gte = new Date(start);
            if (end) query.timestamp.$lte = new Date(end);
        }

        const locations = await GPSLocation.find(query)
            .sort({ timestamp: -1 })
            .limit(100);

        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all active vehicles' latest locations
export const getAllActiveLocations = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: 'in_use' });
        const locationPromises = vehicles.map(vehicle => 
            GPSLocation.getLatestLocation(vehicle._id)
        );

        const locations = await Promise.all(locationPromises);
        const activeLocations = locations.filter(location => location !== null);

        res.status(200).json(activeLocations);
    } catch (error) {
        console.error('Error fetching active locations:', error);
        res.status(500).json({ message: error.message });
    }
};