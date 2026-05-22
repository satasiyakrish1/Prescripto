import mongoose from 'mongoose';

const eventRSVPSchema = new mongoose.Schema({
    eventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'event',
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    phone: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed', 'not_applicable'],
        default: 'not_applicable'
    },
    paymentDetails: {
        gateway: {
            type: String,
            enum: ['razorpay', 'stripe', ''],
            default: ''
        },
        orderId: {
            type: String,
            default: ''
        },
        paymentId: {
            type: String,
            default: ''
        },
        amount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'INR'
        },
        paidAt: {
            type: Date,
            default: null
        }
    },
    additionalInfo: {
        type: Object,
        default: {}
    },
    addedToCalendar: {
        type: Boolean,
        default: false
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    manuallyAdded: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add timestamps for when the document is created and updated
eventRSVPSchema.set('timestamps', true);

// Create a compound index to ensure a user can only RSVP once per event
eventRSVPSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const eventRSVPModel = mongoose.models.eventRSVP || mongoose.model('eventRSVP', eventRSVPSchema);
export default eventRSVPModel;