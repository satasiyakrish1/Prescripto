import mongoose from 'mongoose';

const perioperativeChecklistSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: false
    },
    surgeryType: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    surgeon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },
    anesthesiologist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: false
    },
    operatingRoom: {
        type: String,
        required: false
    },
    preOperative: {
        patientConsent: {
            obtained: { type: Boolean, default: false },
            date: Date,
            notes: String
        },
        medicalHistory: {
            reviewed: { type: Boolean, default: false },
            notes: String
        },
        allergies: {
            checked: { type: Boolean, default: false },
            list: [String],
            notes: String
        },
        medications: {
            reviewed: { type: Boolean, default: false },
            medicationsToStop: [{
                name: String,
                stopDate: Date
            }],
            notes: String
        },
        labTests: {
            completed: { type: Boolean, default: false },
            results: [{
                testName: String,
                resultDate: Date,
                resultSummary: String,
                isNormal: Boolean
            }],
            notes: String
        },
        imaging: {
            completed: { type: Boolean, default: false },
            results: [{
                imagingType: String,
                date: Date,
                resultSummary: String
            }],
            notes: String
        },
        physicalExam: {
            completed: { type: Boolean, default: false },
            date: Date,
            findings: String,
            notes: String
        },
        anesthesiaAssessment: {
            completed: { type: Boolean, default: false },
            date: Date,
            assessmentSummary: String,
            asaClass: {
                type: String,
                enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'E']
            },
            notes: String
        },
        patientInstructions: {
            provided: { type: Boolean, default: false },
            fastingInstructions: String,
            medicationInstructions: String,
            additionalInstructions: String
        },
        specialEquipment: [String],
        specialConsiderations: String
    },
    intraOperative: {
        timeOut: {
            completed: { type: Boolean, default: false },
            verifiedPatient: { type: Boolean, default: false },
            verifiedProcedure: { type: Boolean, default: false },
            verifiedSite: { type: Boolean, default: false },
            verifiedEquipment: { type: Boolean, default: false },
            notes: String
        },
        anesthesia: {
            type: {
                type: String,
                enum: ['General', 'Regional', 'Local', 'Sedation', 'Other']
            },
            startTime: Date,
            endTime: Date,
            complications: String,
            notes: String
        },
        procedure: {
            startTime: Date,
            endTime: Date,
            findings: String,
            complications: String,
            notes: String
        },
        specimens: [{
            type: String,
            sentToLab: Boolean,
            notes: String
        }],
        implants: [{
            type: String,
            manufacturer: String,
            serialNumber: String,
            notes: String
        }],
        medications: [{
            name: String,
            dose: String,
            time: Date,
            notes: String
        }],
        fluids: [{
            type: String,
            volume: Number,
            notes: String
        }],
        bloodLoss: Number,
        bloodProducts: [{
            type: String,
            units: Number,
            notes: String
        }]
    },
    postOperative: {
        recovery: {
            arrivalTime: Date,
            vitalSigns: [{
                time: Date,
                bloodPressure: String,
                heartRate: Number,
                respiratoryRate: Number,
                temperature: Number,
                oxygenSaturation: Number,
                pain: Number
            }],
            medications: [{
                name: String,
                dose: String,
                time: Date,
                notes: String
            }],
            fluids: [{
                type: String,
                volume: Number,
                notes: String
            }],
            complications: String,
            dischargeCriteriaMet: { type: Boolean, default: false },
            dischargeTime: Date,
            notes: String
        },
        followUpInstructions: {
            provided: { type: Boolean, default: false },
            medicationInstructions: String,
            woundCare: String,
            activityRestrictions: String,
            followUpAppointment: Date,
            contactInformation: String,
            additionalInstructions: String
        },
        dischargeSummary: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'pre-op-completed', 'in-progress', 'post-op-completed', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    completedBy: [{
        stage: {
            type: String,
            enum: ['pre-op', 'intra-op', 'post-op']
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    notes: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const PerioperativeChecklistModel = mongoose.models.perioperativeChecklist || mongoose.model('perioperativeChecklist', perioperativeChecklistSchema);
export default PerioperativeChecklistModel;