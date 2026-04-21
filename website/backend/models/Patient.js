import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        patientId: {
            type: String,
            unique: true,
            sparse: true
        },
        age: {
            type: Number,
            required: true
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true
        },
        dateOfBirth: {
            type: Date
        },
        contactNumber: {
            type: String,
            required: true
        },
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        },
        admissionDate: {
            type: Date,
            default: Date.now
        },
        dischargeDate: {
            type: Date
        },
        ward: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ward'
        },
        bedNumber: {
            type: Number
        },
        assignedBedId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ward.beds',
            default: null
        },
        diagnosis: {
            type: String,
            required: true
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        },
        allergies: [String],
        medications: [
            {
                name: String,
                dosage: String,
                frequency: String,
                startDate: Date,
                endDate: Date
            }
        ],
        status: {
            type: String,
            enum: ['admitted', 'discharged', 'critical', 'stable'],
            default: 'admitted'
        },
        notes: String,
        medicalHistory: [String]
    },
    {
        timestamps: true
    }
);

patientSchema.index({ contactNumber: 1 });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
