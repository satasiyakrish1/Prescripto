import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    registrationTime: {
        type: Date,
        default: Date.now
    },
    severity: {
        type: String,
        required: true,
        enum: ['critical', 'severe', 'moderate', 'stable'],
        default: 'moderate'
    },
    chiefComplaint: {
        type: String,
        required: true
    },
    vitalSigns: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        oxygenSaturation: Number,
        respiratoryRate: Number
    },
    assignedWard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ward'
    },
    assignedBed: {
        type: String
    },
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    status: {
        type: String,
        enum: ['waiting', 'in_treatment', 'admitted', 'discharged', 'transferred'],
        default: 'waiting'
    },
    treatmentNotes: [{
        note: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    estimatedWaitTime: {
        type: Number,  // in minutes
        default: 0
    },
    triageCategory: {
        type: String,
        enum: ['red', 'yellow', 'green', 'black'],
        default: 'green'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated timestamp before saving
emergencySchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;