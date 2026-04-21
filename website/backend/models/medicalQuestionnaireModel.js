import mongoose from 'mongoose';

const medicalQuestionnaireSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    medicalHistory: {
        allergies: [String],
        chronicConditions: [String],
        currentMedications: [{
            name: String,
            dosage: String,
            frequency: String
        }],
        pastSurgeries: [{
            procedure: String,
            date: String
        }],
        familyHistory: [{
            condition: String,
            relationship: String
        }]
    },
    currentSymptoms: {
        primary: String,
        duration: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe']
        },
        additionalSymptoms: [String]
    },
    vitalSigns: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        respiratoryRate: Number,
        weight: Number,
        height: Number
    },
    lifestyle: {
        smoking: Boolean,
        alcohol: Boolean,
        exercise: String,
        diet: String
    },
    additionalNotes: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const MedicalQuestionnaireModel = mongoose.models.medicalQuestionnaire || mongoose.model('medicalQuestionnaire', medicalQuestionnaireSchema);
export default MedicalQuestionnaireModel;