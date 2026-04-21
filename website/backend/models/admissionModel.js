import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },
    bedId: {
        type: String,
        required: true
    },
    wardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ward',
        required: true
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    expectedDischargeDate: {
        type: Date
    },
    dischargeDate: {
        type: Date
    },
    type: {
        type: String,
        enum: ['Emergency', 'Scheduled'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Discharged', 'Transferred'],
        default: 'Active'
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;