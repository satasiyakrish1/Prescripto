import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    composition: {
        type: String,
        required: true
    },
    dosageForm: {
        type: String,
        required: true
    },
    strength: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    usage: {
        type: String,
        required: true
    },
    sideEffects: [{
        type: String
    }],
    precautions: [{
        type: String
    }]
}, {
    timestamps: true
});

medicineSchema.index({ name: 'text', description: 'text', category: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;