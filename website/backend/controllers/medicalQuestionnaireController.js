import MedicalQuestionnaireModel from '../models/medicalQuestionnaireModel.js';
import appointmentModel from '../models/appointmentModel.js';

// Create or update medical questionnaire
export const saveQuestionnaire = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const questionnaireData = req.body;

        // Validate appointment exists
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Find existing questionnaire or create new one
        let questionnaire = await MedicalQuestionnaireModel.findOne({ appointmentId });
        
        if (questionnaire) {
            // Update existing questionnaire
            questionnaire = await MedicalQuestionnaireModel.findOneAndUpdate(
                { appointmentId },
                { ...questionnaireData, lastUpdated: new Date() },
                { new: true }
            );
        } else {
            // Create new questionnaire
            questionnaire = await MedicalQuestionnaireModel.create({
                ...questionnaireData,
                appointmentId,
                patientId: appointment.userId
            });
        }

        res.status(200).json({
            success: true,
            questionnaire
        });
    } catch (error) {
        console.error('Error saving questionnaire:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get questionnaire by appointment ID
export const getQuestionnaire = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const questionnaire = await MedicalQuestionnaireModel.findOne({ appointmentId })
            .populate('patientId', 'name email phone')
            .populate('appointmentId');

        if (!questionnaire) {
            return res.status(404).json({
                success: false,
                message: 'Questionnaire not found'
            });
        }

        res.status(200).json({
            success: true,
            questionnaire
        });
    } catch (error) {
        console.error('Error fetching questionnaire:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get patient's medical history
export const getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const questionnaires = await MedicalQuestionnaireModel.find({ patientId })
            .sort({ createdAt: -1 })
            .populate('appointmentId');

        res.status(200).json({
            success: true,
            questionnaires
        });
    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};