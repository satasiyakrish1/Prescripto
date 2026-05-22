import mongoose from 'mongoose';

/**
 * Google Wallet Pass Model
 * Stores information about generated Google Wallet passes for appointments
 */
const googleWalletPassSchema = new mongoose.Schema({
    // Reference to the appointment
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true,
        index: true
    },

    // User who owns this pass
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Google Wallet specific IDs
    objectId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    classId: {
        type: String,
        required: true
    },

    // Pass save URL (the link users click to add to Google Wallet)
    saveUrl: {
        type: String,
        required: true
    },

    // JWT token used to generate the save URL
    jwtToken: {
        type: String,
        required: true
    },

    // Pass status
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'updated'],
        default: 'active'
    },

    // Metadata about the pass
    metadata: {
        doctorName: String,
        patientName: String,
        appointmentDate: String,
        appointmentTime: String,
        speciality: String,
        location: String
    },

    // Track when the pass was created in Google Wallet
    googleCreatedAt: {
        type: Date,
        default: Date.now
    },

    // Track when the pass was last updated in Google Wallet
    googleUpdatedAt: {
        type: Date,
        default: Date.now
    },

    // Track if the user has saved the pass to their wallet
    savedToWallet: {
        type: Boolean,
        default: false
    },

    // Expiration date for the pass
    expiresAt: {
        type: Date,
        index: true
    },

    // Error logs if any issues occurred
    errorLogs: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        error: String,
        action: String
    }]
}, {
    timestamps: true
});

// Index for efficient querying
googleWalletPassSchema.index({ appointmentId: 1, userId: 1 });
googleWalletPassSchema.index({ status: 1, expiresAt: 1 });

// Method to mark pass as expired
googleWalletPassSchema.methods.markAsExpired = function () {
    this.status = 'expired';
    return this.save();
};

// Method to mark pass as cancelled
googleWalletPassSchema.methods.markAsCancelled = function () {
    this.status = 'cancelled';
    return this.save();
};

// Method to update pass
googleWalletPassSchema.methods.markAsUpdated = function (newSaveUrl, newJwtToken) {
    this.status = 'updated';
    this.saveUrl = newSaveUrl;
    this.jwtToken = newJwtToken;
    this.googleUpdatedAt = new Date();
    return this.save();
};

// Method to log errors
googleWalletPassSchema.methods.logError = function (error, action) {
    this.errorLogs.push({
        timestamp: new Date(),
        error: error.toString(),
        action
    });
    return this.save();
};

// Static method to find active passes for a user
googleWalletPassSchema.statics.findActivePassesForUser = function (userId) {
    return this.find({
        userId,
        status: 'active',
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    }).populate('appointmentId');
};

// Static method to find pass by appointment
googleWalletPassSchema.statics.findByAppointment = function (appointmentId) {
    return this.findOne({ appointmentId, status: 'active' });
};

const GoogleWalletPass = mongoose.models.GoogleWalletPass || mongoose.model('GoogleWalletPass', googleWalletPassSchema);

export default GoogleWalletPass;
