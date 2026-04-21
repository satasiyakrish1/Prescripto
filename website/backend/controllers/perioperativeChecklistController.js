import PerioperativeChecklistModel from '../models/perioperativeChecklistModel.js';
import Patient from '../models/Patient.js';
import appointmentModel from '../models/appointmentModel.js';

// Create a new perioperative checklist
export const createChecklist = async (req, res) => {
    try {
        const checklistData = req.body;

        // Validate patient exists
        const patient = await Patient.findById(checklistData.patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Validate appointment if provided
        if (checklistData.appointmentId) {
            const appointment = await appointmentModel.findById(checklistData.appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
        }

        // Create new checklist
        const checklist = await PerioperativeChecklistModel.create(checklistData);

        res.status(201).json({
            success: true,
            checklist
        });
    } catch (error) {
        console.error('Error creating perioperative checklist:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get a perioperative checklist by ID
export const getChecklist = async (req, res) => {
    try {
        const { checklistId } = req.params;
        
        const checklist = await PerioperativeChecklistModel.findById(checklistId)
            .populate('patientId', 'name age gender contactNumber')
            .populate('appointmentId')
            .populate('surgeon', 'name speciality')
            .populate('anesthesiologist', 'name speciality')
            .populate('completedBy.userId', 'name role');

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Perioperative checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            checklist
        });
    } catch (error) {
        console.error('Error fetching perioperative checklist:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update a perioperative checklist
export const updateChecklist = async (req, res) => {
    try {
        const { checklistId } = req.params;
        const updateData = req.body;
        
        // Set last updated timestamp
        updateData.lastUpdated = new Date();
        
        const checklist = await PerioperativeChecklistModel.findByIdAndUpdate(
            checklistId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Perioperative checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            checklist
        });
    } catch (error) {
        console.error('Error updating perioperative checklist:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all checklists for a patient
export const getPatientChecklists = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Validate patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        
        const checklists = await PerioperativeChecklistModel.find({ patientId })
            .populate('surgeon', 'name speciality')
            .sort({ scheduledDate: -1 });

        res.status(200).json({
            success: true,
            count: checklists.length,
            checklists
        });
    } catch (error) {
        console.error('Error fetching patient checklists:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all upcoming surgeries/procedures
export const getUpcomingProcedures = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingProcedures = await PerioperativeChecklistModel.find({
            scheduledDate: { $gte: today },
            status: { $nin: ['completed', 'cancelled'] }
        })
            .populate('patientId', 'name age gender contactNumber')
            .populate('surgeon', 'name speciality')
            .sort({ scheduledDate: 1 });

        res.status(200).json({
            success: true,
            count: upcomingProcedures.length,
            procedures: upcomingProcedures
        });
    } catch (error) {
        console.error('Error fetching upcoming procedures:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update checklist status
export const updateStatus = async (req, res) => {
    try {
        const { checklistId } = req.params;
        const { status, stage, notes } = req.body;
        
        // Validate status
        const validStatuses = ['scheduled', 'pre-op-completed', 'in-progress', 'post-op-completed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        
        // Update the checklist status
        const updateData = { 
            status,
            lastUpdated: new Date()
        };
        
        // Add to completedBy array if stage is provided
        if (stage) {
            const validStages = ['pre-op', 'intra-op', 'post-op'];
            if (!validStages.includes(stage)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid stage value'
                });
            }
            
            updateData.$push = {
                completedBy: {
                    stage,
                    userId: req.user.id, // Assuming user ID is available from auth middleware
                    timestamp: new Date(),
                    notes: notes || ''
                }
            };
        }
        
        const checklist = await PerioperativeChecklistModel.findByIdAndUpdate(
            checklistId,
            updateData,
            { new: true }
        );

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Perioperative checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            checklist
        });
    } catch (error) {
        console.error('Error updating checklist status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete a perioperative checklist
export const deleteChecklist = async (req, res) => {
    try {
        const { checklistId } = req.params;
        
        const checklist = await PerioperativeChecklistModel.findByIdAndDelete(checklistId);

        if (!checklist) {
            return res.status(404).json({
                success: false,
                message: 'Perioperative checklist not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Perioperative checklist deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting perioperative checklist:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};