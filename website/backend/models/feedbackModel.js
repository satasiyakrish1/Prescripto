import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    type: {
        type: String,
        enum: ['suggestion', 'bug', 'feature', 'other'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['issued', 'in-progress', 'solved', 'cancelled'],
        default: 'issued'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    userEmail: {
        type: String
    },
    userName: {
        type: String
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
feedbackSchema.index({ status: 1, type: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1 });

const feedbackModel = mongoose.models.feedback || mongoose.model('feedback', feedbackSchema);

export default feedbackModel;
