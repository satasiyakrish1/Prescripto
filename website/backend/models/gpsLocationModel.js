import mongoose from 'mongoose';

const gpsLocationSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    speed: {
        type: Number,
        default: 0
    },
    heading: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        default: 0
    },
    // For geofencing support
    isWithinZone: {
        type: Boolean,
        default: true
    },
    zoneName: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Index for faster queries
gpsLocationSchema.index({ vehicleId: 1, timestamp: -1 });
gpsLocationSchema.index({ vehicleId: 1, isWithinZone: 1 });

// Method to get latest location
gpsLocationSchema.statics.getLatestLocation = function(vehicleId) {
    return this.findOne({ vehicleId }).sort({ timestamp: -1 });
};

const GPSLocation = mongoose.model('GPSLocation', gpsLocationSchema);

export default GPSLocation;