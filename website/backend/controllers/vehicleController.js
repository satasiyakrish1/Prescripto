import Vehicle from '../models/vehicleModel.js';

// Get all vehicles
export const getAllVehicles = async (req, res) => {
    try {
        console.log('Fetching all vehicles...');
        const vehicles = await Vehicle.find();
        console.log(`Found ${vehicles.length} vehicles`);
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get vehicle by ID
export const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new vehicle
export const createVehicle = async (req, res) => {
    try {
        console.log('Received vehicle creation request with body:', req.body);
        
        const vehicleData = { ...req.body };
        console.log('Creating new vehicle with data:', vehicleData);
        
        const vehicle = new Vehicle(vehicleData);
        
        // Validate the vehicle before saving
        const validationError = vehicle.validateSync();
        if (validationError) {
            console.error('Vehicle validation failed:', validationError);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationError.errors 
            });
        }
        
        const savedVehicle = await vehicle.save();
        console.log('Vehicle created successfully with ID:', savedVehicle._id);
        res.status(201).json(savedVehicle);
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(400).json({ message: error.message });
    }
};

// Update vehicle details
export const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update vehicle status
export const updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['available', 'in_use', 'maintenance', 'out_of_service'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        
        const vehicle = await Vehicle.findByIdAndUpdate(
            id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete vehicle
export const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add maintenance record
export const addMaintenanceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description, cost, performedBy } = req.body;
        
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        // Add new maintenance record
        vehicle.maintenanceSchedule.maintenanceHistory.push({
            date: date || new Date(),
            description,
            cost,
            performedBy
        });
        
        // Update last maintenance date
        vehicle.maintenanceSchedule.lastMaintenance = date || new Date();
        
        // Calculate next maintenance date (e.g., 3 months from now)
        const nextMaintenance = new Date();
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 3);
        vehicle.maintenanceSchedule.nextMaintenance = nextMaintenance;
        
        vehicle.updatedAt = Date.now();
        
        await vehicle.save();
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get vehicles by status
export const getVehiclesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        if (!['available', 'in_use', 'maintenance', 'out_of_service', 'all'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        
        let vehicles;
        if (status === 'all') {
            vehicles = await Vehicle.find();
        } else {
            vehicles = await Vehicle.find({ status });
        }
        
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get vehicles statistics
export const getVehicleStats = async (req, res) => {
    try {
        const totalVehicles = await Vehicle.countDocuments();
        const availableVehicles = await Vehicle.countDocuments({ status: 'available' });
        const inUseVehicles = await Vehicle.countDocuments({ status: 'in_use' });
        const maintenanceVehicles = await Vehicle.countDocuments({ status: 'maintenance' });
        const outOfServiceVehicles = await Vehicle.countDocuments({ status: 'out_of_service' });
        
        // Count by vehicle type
        const ambulances = await Vehicle.countDocuments({ type: 'ambulance' });
        const patientTransport = await Vehicle.countDocuments({ type: 'patient_transport' });
        const medicalSupply = await Vehicle.countDocuments({ type: 'medical_supply' });
        const staffTransport = await Vehicle.countDocuments({ type: 'staff_transport' });
        const other = await Vehicle.countDocuments({ type: 'other' });
        
        // Vehicles needing maintenance soon (next 7 days)
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const needingMaintenance = await Vehicle.countDocuments({
            'maintenanceSchedule.nextMaintenance': { $lte: oneWeekFromNow }
        });
        
        res.status(200).json({
            totalVehicles,
            byStatus: {
                available: availableVehicles,
                inUse: inUseVehicles,
                maintenance: maintenanceVehicles,
                outOfService: outOfServiceVehicles
            },
            byType: {
                ambulances,
                patientTransport,
                medicalSupply,
                staffTransport,
                other
            },
            needingMaintenance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};