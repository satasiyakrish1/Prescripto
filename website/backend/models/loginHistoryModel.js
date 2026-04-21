import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userType: {
        type: String,
        enum: ['user', 'admin', 'doctor'],
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    deviceInfo: {
        type: String,
        default: 'Unknown Device'
    },
    userAgent: {
        type: String,
        default: 'Unknown'
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        default: ''
    }
});

// Index for faster querying of login history by userId and loginTime
loginHistorySchema.index({ userId: 1, loginTime: -1 });

const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;