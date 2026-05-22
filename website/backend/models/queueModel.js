import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'appointment',
        required: true 
    },
    patientName: { 
        type: String, 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor',
        required: true 
    },
    doctorName: { 
        type: String, 
        required: true 
    },
    department: { 
        type: String, 
        required: true 
    },
    checkInTime: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['waiting', 'in-progress', 'completed'],
        default: 'waiting'
    },
    priority: {
        type: Number,
        default: 0
    },
    estimatedWaitTime: {
        type: Number,  // in minutes
        default: 15
    },
    notes: {
        type: String
    }
}, { timestamps: true });

const QueueModel = mongoose.models.queue || mongoose.model('queue', queueSchema);
export default QueueModel;