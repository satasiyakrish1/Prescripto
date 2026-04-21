import Ward from '../models/wardModel.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/doctorModel.js';
import Admission from '../models/admissionModel.js';
import BedHistory from '../models/BedHistory.js';

const OCCUPANCY_CACHE_TTL_MS = 10000;
let occupancyCache = {
    data: null,
    expiresAt: 0
};

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Ward.distinct('department');
        res.status(200).json({ departments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get beds by department
export const getBedsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const wards = await Ward.find({ department })
            .populate({
                path: 'beds.patient',
                select: 'name age gender diagnosis status contactNumber patientId'
            })
            .lean();

        // Format the response to include ward details and bed status
        const formattedResponse = wards.map(ward => {
            const beds = Array.isArray(ward.beds)
                ? ward.beds.map(bed => ({
                    bedId: bed._id,
                    bedNumber: bed.bedNumber,
                    status: bed.status,
                    patient: bed.patient,
                    isEmergency: bed.isEmergency || false,
                    categoryId: bed.categoryId || null
                }))
                : [];

            return {
                wardId: ward._id,
                wardName: ward.name,
                floor: ward.floor,
                type: ward.type,
                department: ward.department,
                totalBeds: beds.length,
                occupiedBeds: beds.filter(b => b.status === 'occupied').length,
                availableBeds: beds.filter(b => b.status === 'available').length,
                reservedBeds: beds.filter(b => b.status === 'reserved').length,
                cleaningBeds: beds.filter(b => b.status === 'cleaning').length,
                maintenanceBeds: beds.filter(b => b.status === 'maintenance').length,
                beds
            };
        });

        res.status(200).json({ beds: formattedResponse });
    } catch (error) {
        console.error('Error fetching beds by department:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get beds by status
export const getBedsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const wards = await Ward.find({ 'beds.status': status })
            .populate({
                path: 'beds.patient',
                select: 'name age gender diagnosis status contactNumber patientId'
            })
            .lean();

        // Filter beds by status and format response
        const formattedResponse = wards
            .map(ward => {
                const beds = (ward.beds || []).filter(bed => bed.status === status).map(bed => ({
                    bedId: bed._id,
                    bedNumber: bed.bedNumber,
                    status: bed.status,
                    patient: bed.patient,
                    categoryId: bed.categoryId || null
                }));

                return {
                    wardId: ward._id,
                    wardName: ward.name,
                    department: ward.department,
                    floor: ward.floor,
                    beds
                };
            })
            .filter(ward => ward.beds.length > 0);

        res.status(200).json({ beds: formattedResponse });
    } catch (error) {
        console.error('Error fetching beds by status:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get doctors by department
export const getDoctorsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;

        // Map department names to doctor specialities
        const specialityMap = {
            'Emergency': ['Emergency Medicine', 'Trauma'],
            'ICU': ['Critical Care', 'Anesthesiology', 'Pulmonology'],
            'General': ['General Medicine', 'Internal Medicine'],
            'Pediatric': ['Pediatrics'],
            'Maternity': ['Obstetrics', 'Gynecology'],
            'Surgery': ['General Surgery', 'Orthopedics']
        };

        const specialities = specialityMap[department] || [department];

        const doctors = await Doctor.find({
            speciality: { $in: specialities },
            status: 'active',
            available: true
        }).select('name speciality experience fees available');

        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error fetching doctors by department:', error);
        res.status(500).json({ message: error.message });
    }
};

// Search patients from MongoDB
export const searchPatients = async (req, res) => {
    try {
        const { query, page = 1, limit = 20 } = req.query;
        const trimmedQuery = typeof query === 'string' ? query.trim() : '';

        if (!trimmedQuery) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const numericPage = Math.max(parseInt(page, 10) || 1, 1);
        const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        const searchConditions = [
            { name: { $regex: trimmedQuery, $options: 'i' } },
            { contactNumber: { $regex: trimmedQuery, $options: 'i' } },
            { patientId: { $regex: trimmedQuery, $options: 'i' } }
        ];

        const [patients, total] = await Promise.all([
            Patient.find({ $or: searchConditions })
                .select(
                    '_id name age gender contactNumber patientId address diagnosis bloodGroup allergies medicalHistory notes emergencyContact'
                )
                .skip((numericPage - 1) * numericLimit)
                .limit(numericLimit)
                .lean(),
            Patient.countDocuments({ $or: searchConditions })
        ]);

        // Check for current admissions for these patients
        const patientIds = patients.map(patient => patient._id);
        const activeAdmissions = await Admission.find({
            patientId: { $in: patientIds },
            dischargeDate: null
        })
            .select('patientId wardId bedId admissionDate')
            .lean();

        // Create a map of patient IDs to their admission status
        const admissionMap = {};
        activeAdmissions.forEach(admission => {
            admissionMap[admission.patientId.toString()] = admission;
        });

        // Enhance patient data with admission information
        const enhancedPatients = patients.map(patient => {
            const admission = admissionMap[patient._id.toString()];

            return {
                ...patient,
                currentAdmission: admission
                    ? {
                        admissionId: admission._id,
                        wardId: admission.wardId,
                        bedId: admission.bedId,
                        admissionDate: admission.admissionDate
                    }
                    : null
            };
        });

        res.status(200).json({
            patients: enhancedPatients,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                totalPages: Math.ceil(total / numericLimit) || 1
            }
        });
    } catch (error) {
        console.error('Error searching patients in MongoDB:', error);
        res.status(500).json({ message: error.message });
    }
};

// Allocate bed to patient
export const allocateBed = async (req, res) => {
    try {
        const {
            wardId,
            bedId,
            patientId,
            doctorId,
            admissionType,
            expectedDischargeDate,
            notes
        } = req.body;

        // Validate required fields
        if (!wardId || !bedId || !patientId || !doctorId || !admissionType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the ward and check if bed exists and is available
        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bedIndex = ward.beds.findIndex(bed => bed._id.toString() === bedId);
        if (bedIndex === -1) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        if (ward.beds[bedIndex].status !== 'available') {
            return res.status(400).json({ message: 'Bed is not available' });
        }

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Create admission record (save all relevant data)
        const admission = new Admission({
            patientId,
            doctorId,
            bedId,
            wardId,
            type: admissionType,
            expectedDischargeDate: expectedDischargeDate || null,
            notes,
            createdBy: req.user?.id || req.admin?._id || null // robustly set createdBy
        });

        await admission.save();

        // Update bed status and references
        const previousStatus = ward.beds[bedIndex].status;

        ward.beds[bedIndex].status = 'occupied';
        ward.beds[bedIndex].patient = patientId;
        ward.beds[bedIndex].admissionDate = new Date();
        ward.beds[bedIndex].expectedDischargeDate = expectedDischargeDate || null;
        ward.beds[bedIndex].lastUpdated = new Date();
        await ward.save();

        // Update patient status and references
        patient.status = 'admitted';
        patient.ward = wardId;
        patient.bedNumber = ward.beds[bedIndex].bedNumber;
        patient.assignedBedId = ward.beds[bedIndex]._id;
        await patient.save();

        await BedHistory.create({
            wardId,
            bedId,
            patientId,
            previousStatus,
            newStatus: 'occupied',
            changedBy: req.admin?._id || null,
            reason: notes || 'Bed allocated to patient'
        });

        if (global.io) {
            global.io.to('admin').emit('bed_status_updated', {
                type: 'allocation',
                wardId,
                bedId,
                status: 'occupied',
                patientId
            });
        }

        // Respond with all relevant details for frontend
        res.status(201).json({
            message: 'Bed allocated successfully',
            admission,
            ward: {
                id: ward._id,
                name: ward.name,
                department: ward.department,
                floor: ward.floor,
                type: ward.type
            },
            bed: {
                id: ward.beds[bedIndex]._id,
                bedNumber: ward.beds[bedIndex].bedNumber,
                status: ward.beds[bedIndex].status
            },
            patient: {
                id: patient._id,
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                contactNumber: patient.contactNumber
            },
            doctor: {
                id: doctor._id,
                name: doctor.name,
                speciality: doctor.speciality
            }
        });
    } catch (error) {
        console.error('Error allocating bed:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all admissions
export const getAllAdmissions = async (req, res) => {
    try {
        const admissions = await Admission.find()
            .populate('patientId', 'name age gender contactNumber')
            .populate('doctorId', 'name speciality')
            .populate('wardId', 'name department floor')
            .sort({ createdAt: -1 });

        res.status(200).json(admissions);
    } catch (error) {
        console.error('Error fetching admissions:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get admission by ID
export const getAdmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const admission = await Admission.findById(id)
            .populate('patientId', 'name age gender contactNumber diagnosis')
            .populate('doctorId', 'name speciality experience')
            .populate('wardId', 'name department floor');

        if (!admission) {
            return res.status(404).json({ message: 'Admission not found' });
        }

        res.status(200).json(admission);
    } catch (error) {
        console.error('Error fetching admission:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get bed allocation statistics
export const getBedAllocationStats = async (req, res) => {
    try {
        const stats = {};

        // Get total beds and occupancy by department
        const departmentStats = await Ward.aggregate([
            {
                $group: {
                    _id: '$department',
                    totalBeds: { $sum: '$totalBeds' },
                    totalWards: { $sum: 1 }
                }
            }
        ]);

        // Get occupied beds count by department
        const occupiedStats = await Ward.aggregate([
            { $unwind: '$beds' },
            { $match: { 'beds.status': 'occupied' } },
            {
                $group: {
                    _id: '$department',
                    occupiedBeds: { $sum: 1 }
                }
            }
        ]);

        // Merge the stats
        stats.departments = departmentStats.map(dept => {
            const occupied = occupiedStats.find(o => o._id === dept._id);
            return {
                department: dept._id,
                totalBeds: dept.totalBeds,
                totalWards: dept.totalWards,
                occupiedBeds: occupied ? occupied.occupiedBeds : 0,
                availableBeds: dept.totalBeds - (occupied ? occupied.occupiedBeds : 0),
                occupancyRate: occupied ? (occupied.occupiedBeds / dept.totalBeds * 100).toFixed(2) : 0
            };
        });

        // Get overall stats
        stats.overall = {
            totalBeds: departmentStats.reduce((sum, dept) => sum + dept.totalBeds, 0),
            totalWards: departmentStats.reduce((sum, dept) => sum + dept.totalWards, 0),
            occupiedBeds: occupiedStats.reduce((sum, dept) => sum + dept.occupiedBeds, 0)
        };

        stats.overall.availableBeds = stats.overall.totalBeds - stats.overall.occupiedBeds;
        stats.overall.occupancyRate = (stats.overall.occupiedBeds / stats.overall.totalBeds * 100).toFixed(2);

        // Get admission stats by type
        const admissionTypeStats = await Admission.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        stats.admissionTypes = admissionTypeStats;

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching bed allocation stats:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getOccupancySummary = async (req, res) => {
    try {
        const now = Date.now();
        if (occupancyCache.data && occupancyCache.expiresAt > now) {
            return res.status(200).json(occupancyCache.data);
        }

        const [statusAggregation, floorAggregation] = await Promise.all([
            Ward.aggregate([
                { $unwind: '$beds' },
                {
                    $group: {
                        _id: '$beds.status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Ward.aggregate([
                { $unwind: '$beds' },
                {
                    $group: {
                        _id: { floor: '$floor', status: '$beds.status' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const statusCounts = statusAggregation.reduce(
            (acc, item) => {
                acc[item._id] = item.count;
                acc.totalBeds += item.count;
                return acc;
            },
            {
                totalBeds: 0,
                available: 0,
                occupied: 0,
                reserved: 0,
                cleaning: 0,
                maintenance: 0
            }
        );

        const occupancyRate =
            statusCounts.totalBeds > 0 ? (statusCounts.occupied / statusCounts.totalBeds) * 100 : 0;

        const floorsMap = {};
        floorAggregation.forEach(item => {
            const floorKey = item._id.floor || 'Unknown';
            const status = item._id.status || 'unknown';
            if (!floorsMap[floorKey]) {
                floorsMap[floorKey] = {
                    floor: floorKey,
                    totalBeds: 0,
                    occupied: 0,
                    available: 0,
                    reserved: 0,
                    cleaning: 0,
                    maintenance: 0
                };
            }
            floorsMap[floorKey].totalBeds += item.count;
            if (status === 'occupied') floorsMap[floorKey].occupied += item.count;
            if (status === 'available') floorsMap[floorKey].available += item.count;
            if (status === 'reserved') floorsMap[floorKey].reserved += item.count;
            if (status === 'cleaning') floorsMap[floorKey].cleaning += item.count;
            if (status === 'maintenance') floorsMap[floorKey].maintenance += item.count;
        });

        const floors = Object.values(floorsMap).map(floor => ({
            ...floor,
            occupancyRate: floor.totalBeds > 0 ? (floor.occupied / floor.totalBeds) * 100 : 0
        }));

        const data = {
            summary: {
                totalBeds: statusCounts.totalBeds,
                available: statusCounts.available,
                occupied: statusCounts.occupied,
                reserved: statusCounts.reserved,
                cleaning: statusCounts.cleaning,
                maintenance: statusCounts.maintenance,
                occupancyRate: Number(occupancyRate.toFixed(2))
            },
            floors
        };

        occupancyCache = {
            data,
            expiresAt: now + OCCUPANCY_CACHE_TTL_MS
        };

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching occupancy summary:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getFloorDistribution = async (req, res) => {
    try {
        const wards = await Ward.find().lean();

        const floorsMap = {};

        wards.forEach(ward => {
            const floorKey = ward.floor || 'Unknown';
            if (!floorsMap[floorKey]) {
                floorsMap[floorKey] = {
                    floor: floorKey,
                    rooms: [],
                    totalBeds: 0,
                    occupiedBeds: 0,
                    availableBeds: 0
                };
            }

            const beds = Array.isArray(ward.beds) ? ward.beds : [];
            const room = {
                wardId: ward._id,
                roomNumber: ward.name,
                wardType: ward.type,
                department: ward.department,
                totalBeds: beds.length,
                occupiedBeds: beds.filter(b => b.status === 'occupied').length,
                availableBeds: beds.filter(b => b.status === 'available').length,
                beds: beds.map(bed => ({
                    bedId: bed._id,
                    bedNumber: bed.bedNumber,
                    status: bed.status,
                    categoryId: bed.categoryId || null,
                    patient: bed.patient || null
                }))
            };

            floorsMap[floorKey].rooms.push(room);
            floorsMap[floorKey].totalBeds += room.totalBeds;
            floorsMap[floorKey].occupiedBeds += room.occupiedBeds;
            floorsMap[floorKey].availableBeds += room.availableBeds;
        });

        const floors = Object.values(floorsMap);

        res.status(200).json({ floors });
    } catch (error) {
        console.error('Error fetching floor distribution:', error);
        res.status(500).json({ message: error.message });
    }
};

export const createBed = async (req, res) => {
    try {
        const { wardId } = req.params;
        const { bedNumber } = req.body;

        if (!bedNumber) {
            return res.status(400).json({ message: 'Bed number is required' });
        }

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const exists = ward.beds.some(bed => String(bed.bedNumber) === String(bedNumber));
        if (exists) {
            return res.status(400).json({ message: 'Bed number already exists in this ward' });
        }

        ward.beds.push({
            bedNumber,
            status: 'available',
            patient: null,
            lastUpdated: new Date()
        });
        ward.totalBeds = ward.beds.length;
        ward.lastUpdated = new Date();

        await ward.save();

        occupancyCache.data = null;

        const newBed = ward.beds[ward.beds.length - 1];

        res.status(201).json({
            message: 'Bed created successfully',
            bed: {
                id: newBed._id,
                bedNumber: newBed.bedNumber,
                status: newBed.status
            }
        });
    } catch (error) {
        console.error('Error creating bed:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateBedDetails = async (req, res) => {
    try {
        const { wardId, bedId } = req.params;
        const { bedNumber } = req.body;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        if (bedNumber) {
            const exists = ward.beds.some(
                b => b._id.toString() !== bedId && String(b.bedNumber) === String(bedNumber)
            );
            if (exists) {
                return res.status(400).json({ message: 'Bed number already exists in this ward' });
            }
            bed.bedNumber = bedNumber;
        }

        bed.lastUpdated = new Date();
        ward.lastUpdated = new Date();

        await ward.save();

        occupancyCache.data = null;

        res.status(200).json({
            message: 'Bed updated successfully',
            bed: {
                id: bed._id,
                bedNumber: bed.bedNumber,
                status: bed.status
            }
        });
    } catch (error) {
        console.error('Error updating bed:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteBed = async (req, res) => {
    try {
        const { wardId, bedId } = req.params;

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        if (bed.status === 'occupied') {
            return res.status(400).json({ message: 'Cannot delete an occupied bed' });
        }

        bed.deleteOne();
        ward.totalBeds = Math.max(0, (ward.totalBeds || 0) - 1);
        ward.lastUpdated = new Date();

        await ward.save();

        occupancyCache.data = null;

        res.status(200).json({
            message: 'Bed deleted successfully',
            bedId
        });
    } catch (error) {
        console.error('Error deleting bed:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateBedStatus = async (req, res) => {
    try {
        const { wardId, bedId } = req.params;
        const { status, reason } = req.body;

        const allowedStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid bed status' });
        }

        const ward = await Ward.findById(wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        const previousStatus = bed.status;
        bed.status = status;
        bed.lastUpdated = new Date();

        if (status === 'available') {
            bed.patient = null;
            bed.admissionDate = null;
            bed.expectedDischargeDate = null;
        }

        await ward.save();

        await BedHistory.create({
            wardId,
            bedId,
            patientId: bed.patient || null,
            previousStatus,
            newStatus: status,
            changedBy: req.admin?._id || null,
            reason: reason || 'Bed status updated'
        });

        if (global.io) {
            global.io.to('admin').emit('bed_status_updated', {
                type: 'status_update',
                wardId,
                bedId,
                status
            });
        }

        res.status(200).json({
            message: 'Bed status updated successfully',
            bed: {
                id: bed._id,
                bedNumber: bed.bedNumber,
                status: bed.status
            }
        });
    } catch (error) {
        console.error('Error updating bed status:', error);
        res.status(500).json({ message: error.message });
    }
};

export const dischargePatient = async (req, res) => {
    try {
        const { admissionId } = req.body;

        if (!admissionId) {
            return res.status(400).json({ message: 'Admission ID is required' });
        }

        const admission = await Admission.findById(admissionId);
        if (!admission) {
            return res.status(404).json({ message: 'Admission not found' });
        }

        if (admission.dischargeDate) {
            return res.status(400).json({ message: 'Patient already discharged' });
        }

        const ward = await Ward.findById(admission.wardId);
        if (!ward) {
            return res.status(404).json({ message: 'Ward not found' });
        }

        const bed = ward.beds.id(admission.bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        const patient = await Patient.findById(admission.patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const previousStatus = bed.status;

        bed.status = 'available';
        bed.patient = null;
        bed.admissionDate = null;
        bed.expectedDischargeDate = null;
        bed.lastUpdated = new Date();
        await ward.save();

        admission.dischargeDate = new Date();
        await admission.save();

        patient.status = 'discharged';
        patient.ward = null;
        patient.bedNumber = null;
        patient.assignedBedId = null;
        patient.dischargeDate = admission.dischargeDate;
        await patient.save();

        await BedHistory.create({
            wardId: ward._id,
            bedId: bed._id,
            patientId: patient._id,
            previousStatus,
            newStatus: 'available',
            changedBy: req.admin?._id || null,
            reason: 'Patient discharged'
        });

        if (global.io) {
            global.io.to('admin').emit('bed_status_updated', {
                type: 'discharge',
                wardId: ward._id,
                bedId: bed._id,
                status: 'available',
                patientId: patient._id
            });
        }

        res.status(200).json({
            message: 'Patient discharged successfully',
            admissionId: admission._id,
            wardId: ward._id,
            bedId: bed._id,
            patientId: patient._id
        });
    } catch (error) {
        console.error('Error discharging patient:', error);
        res.status(500).json({ message: error.message });
    }
};
