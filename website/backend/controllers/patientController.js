import Patient from '../models/Patient.js';
import Ward from '../models/Ward.js';

// Get all patients
export const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find()
            .populate('ward', 'name type')
            .sort('-admissionDate');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('ward', 'name type floor department');
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new patient
export const createPatient = async (req, res) => {
    try {
        // Validate required fields
        const { name, age, contactNumber, diagnosis } = req.body;
        if (!name || !age || !contactNumber || !diagnosis) {
            return res.status(400).json({ message: 'Name, age, contact number, and diagnosis are required fields' });
        }

        // Create patient document in MongoDB
        const patientData = {
            ...req.body,
            // Ensure proper data types for MongoDB schema
            name: String(name).trim(),
            age: Number(age),
            contactNumber: String(contactNumber).trim(),
            diagnosis: String(diagnosis).trim(),
            // Handle optional fields with proper data types
            bloodGroup: req.body.bloodGroup || undefined,
            allergies: Array.isArray(req.body.allergies) ? req.body.allergies : [],
            medicalHistory: Array.isArray(req.body.medicalHistory) ? req.body.medicalHistory : [],
            notes: req.body.notes || undefined,
            status: req.body.status || 'Active'
        };

        const patient = new Patient(patientData);
        await patient.save();
        
        console.log('Patient created successfully:', patient._id);
        res.status(201).json(patient);
    } catch (error) {
        console.error('Error creating patient in MongoDB:', error);
        res.status(400).json({ message: error.message });
    }
};

// Update patient
export const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete patient
export const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // If patient is admitted, update bed status
        if (patient.ward && patient.status === 'admitted') {
            const ward = await Ward.findById(patient.ward);
            if (ward) {
                const bed = ward.beds.find(b => b.patient && b.patient.toString() === patient._id.toString());
                if (bed) {
                    bed.status = 'available';
                    bed.patient = null;
                    await ward.save();
                }
            }
        }

        await patient.deleteOne(); // Using deleteOne instead of remove which is deprecated
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get patients by ward
export const getPatientsByWard = async (req, res) => {
    try {
        const patients = await Patient.find({ 
            ward: req.params.wardId,
            status: 'admitted'
        }).sort('-admissionDate');
        
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update patient medications
export const updateMedications = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient.medications = req.body.medications;
        await patient.save();
        
        res.json(patient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Add medical history entry
export const addMedicalHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient.medicalHistory.push(req.body.entry);
        await patient.save();
        
        res.json(patient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get patient statistics
export const getPatientStats = async (req, res) => {
    try {
        const stats = await Patient.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    averageAge: { $avg: '$age' }
                }
            }
        ]);
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};