import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        enum: ['support', 'appointment', 'billing', 'feedback', 'other', 'Technical Support', 'Appointment Issues', 'Billing Inquiries', 'Feedback', 'Other']
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'cancelled'],
        default: 'pending'
    },
    userType: {
        type: String,
        enum: ['patient', 'doctor', 'pharmacy', 'guest'],
        default: 'guest'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        enum: ['user', 'doctor', 'pharmacy']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
    notes: {
        type: String
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    }
}, {
    timestamps: true
});

// Index for faster queries
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

const contactModel = mongoose.models.contact || mongoose.model('contact', contactSchema);

export default contactModel;
