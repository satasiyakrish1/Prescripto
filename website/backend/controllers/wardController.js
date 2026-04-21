import Ward from '../models/wardModel.js';
import Emergency from '../models/emergencyModel.js';
import Patient from '../models/Patient.js';

// Get all wards with their current occupancy status
export const getAllWards = async (req, res) => {
    try {
        console.log('Fetching all wards...');
        const wards = await Ward.find()
            .populate('staff', 'name role department')
            .populate('beds.patient', 'name');
        console.log(`Found ${wards.length} wards`);

        const wardStats = wards.map(ward => ({
            ...ward.toObject(),
            totalBeds: ward.beds.length,
            occupiedBeds: ward.beds.filter(bed => bed.status === 'occupied').length,
            availableBeds: ward.beds.filter(bed => bed.status === 'available').length,
            maintenanceBeds: ward.beds.filter(bed => bed.status === 'maintenance').length
        }));

        res.status(200).json(wardStats);
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get ward details by ID
export const getWardById = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id)
            .populate({
                path: 'beds.patient',
                select: 'name age gender diagnosis status contactNumber emergencyContact admissionDate'
            });
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }
        res.status(200).json(ward);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new ward
export const createWard = async (req, res) => {
    try {
        const { name, type, floor, department, capacity, description } = req.body;

        // Create beds array based on capacity
        const beds = Array.from({ length: capacity }, (_, i) => ({
            bedNumber: i + 1,
            status: 'available'
        }));

        const ward = new Ward({
            name,
            type,
            floor,
            department,
            totalBeds: capacity,
            description,
            beds
        });

        await ward.save();
        res.status(201).json(ward);
    } catch (error) {
        console.error('Error creating ward:', error);
        res.status(400).json({ message: error.message });
    }
};

// Update ward details
export const updateWard = async (req, res) => {
    try {
        const { name, type, floor, department, description, status } = req.body;
        const ward = await Ward.findByIdAndUpdate(
            req.params.id,
            { name, type, floor, department, description, status },
            { new: true }
        );

        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        res.status(200).json(ward);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete ward
export const deleteWard = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        // Check if ward has any occupied beds
        const hasOccupiedBeds = ward.beds.some(bed => bed.status === 'occupied');
        if (hasOccupiedBeds) {
            return res.status(400).json({ message: 'Cannot delete ward with occupied beds' });
        }

        await ward.deleteOne();
        res.json({ message: 'Ward deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admit patient to ward
export const admitPatient = async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(req.params.bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        if (bed.status !== 'available') {
            return res.status(400).json({ message: 'Bed is not available' });
        }

        // Create new patient
        const patient = new Patient({
            ...req.body,
            ward: ward._id,
            bedNumber: bed.bedNumber
        });
        await patient.save();

        // Update bed status
        bed.status = 'occupied';
        bed.patient = patient._id;
        await ward.save();

        res.status(201).json({ patient, bed });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Discharge patient
export const dischargePatient = async (req, res) => {
    try {
        const { wardId, bedId, patientId } = req.params;

        const [ward, patient] = await Promise.all([
            Ward.findById(wardId),
            Patient.findById(patientId)
        ]);

        if (!ward || !patient) {
            return res.status(404).json({ message: 'Ward or patient not found' });
        }

        const bed = ward.beds.id(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Update patient status
        patient.status = 'discharged';
        patient.dischargeDate = new Date();
        await patient.save();

        // Update bed status
        bed.status = 'available';
        bed.patient = null;
        await ward.save();

        res.json({ message: 'Patient discharged successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update bed status
export const updateBedStatus = async (req, res) => {
    try {
        const { wardId, bedId } = req.params;
        const { status } = req.body;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        if (status === 'maintenance' && bed.status === 'occupied') {
            return res.status(400).json({ message: 'Cannot set occupied bed to maintenance' });
        }

        bed.status = status;
        await ward.save();

        res.json(bed);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get ward occupancy statistics
export const getWardStats = async (req, res) => {
    try {
        const stats = await Ward.aggregate([
            {
                $group: {
                    _id: '$type',
                    totalWards: { $sum: 1 },
                    totalBeds: { $sum: '$capacity' },
                    avgOccupancy: { $avg: '$occupancyRate' }
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register emergency case
export const registerEmergency = async (req, res) => {
    try {
        const emergency = new Emergency(req.body);
        const savedEmergency = await emergency.save();

        // If ward and bed are specified, update bed status
        if (req.body.assignedWard && req.body.assignedBed) {
            const ward = await Ward.findById(req.body.assignedWard);
            if (ward) {
                const bed = ward.beds.find(b => b.bedNumber === req.body.assignedBed);
                if (bed) {
                    bed.status = 'occupied';
                    bed.patient = emergency.patient;
                    bed.isEmergency = true;
                    bed.admissionDate = new Date();
                    await ward.save();
                }
            }
        }

        res.status(201).json(savedEmergency);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get emergency cases
export const getEmergencyCases = async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .populate('patient', 'name')
            .populate('assignedDoctor', 'name')
            .populate('assignedWard', 'name type');
        res.status(200).json(emergencies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update emergency case
export const updateEmergencyCase = async (req, res) => {
    try {
        const emergency = await Emergency.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!emergency) {
            return res.status(404).json({ message: 'Emergency case not found' });
        }
        res.status(200).json(emergency);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};