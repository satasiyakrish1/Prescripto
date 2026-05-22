import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    duration: { 
        type: Number, // in minutes
        required: true 
    },
    location: { 
        type: String,
        required: true
    },
    locationType: {
        type: String,
        enum: ['online', 'offline'],
        required: true
    },
    description: { 
        type: String, 
        required: true 
    },
    banner: { 
        type: String, 
        default: '' 
    },
    rsvpLimit: { 
        type: Number, 
        default: 0 // 0 means unlimited
    },
    eventType: { 
        type: String, 
        enum: ['free', 'paid'],
        required: true
    },
    price: {
        type: Number,
        default: 0 // Price in INR
    },
    paymentIntegration: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    meetingLink: {
        type: String,
        default: ''
    },
    additionalInfo: {
        type: Object,
        default: {}
    }
});

// Virtual for getting RSVP count
eventSchema.virtual('rsvpCount', {
    ref: 'eventRSVP',
    localField: '_id',
    foreignField: 'eventId',
    count: true
});

// Add timestamps for when the document is created and updated
eventSchema.set('timestamps', true);

// Add toJSON option to include virtuals
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const eventModel = mongoose.models.event || mongoose.model('event', eventSchema);
export default eventModel;