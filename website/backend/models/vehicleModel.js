import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['ambulance', 'patient_transport', 'medical_supply', 'staff_transport', 'other'],
        default: 'ambulance'
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    features: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['available', 'in_use', 'maintenance', 'out_of_service'],
        default: 'available'
    },
    currentDriver: {
        name: String,
        contactNumber: String,
        licenseNumber: String,
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    maintenanceSchedule: {
        lastMaintenance: Date,
        nextMaintenance: Date,
        maintenanceHistory: [{
            date: Date,
            description: String,
            cost: Number,
            performedBy: String
        }]
    },
    purchaseInfo: {
        purchaseDate: Date,
        cost: Number,
        warranty: String
    },
    currentLocation: String,
    fuelType: String,
    fuelEfficiency: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;