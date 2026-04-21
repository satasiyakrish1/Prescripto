import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
    bedNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    }
});

const wardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'private', 'semi-private', 'icu', 'emergency', 'pediatric', 'maternity', 'psychiatric', 'other'],
        required: true
    },
    floor: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    beds: [bedSchema],
    description: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    chargePerDay: {
        type: Number,
        default: 0
    },
    amenities: [String],
    notes: String
}, {
    timestamps: true
});

// Check if the model already exists to prevent the OverwriteModelError
const Ward = mongoose.models.Ward || mongoose.model('Ward', wardSchema);
export default Ward;