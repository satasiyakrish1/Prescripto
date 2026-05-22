import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    // New fields for booking modes
    bookingMode: { type: String, enum: ['instant', 'custom', 'default'], default: 'default' },
    isEmergency: { type: Boolean, default: false },
    customSlotId: { type: String, default: null },
    // Auto-cancellation fields
    status: {
        type: String,
        enum: ['booked', 'completed', 'cancelled', 'auto_cancelled', 'no-show'],
        default: 'booked'
    },
    autoCancelled: { type: Boolean, default: false },
    autoCancelReason: {
        type: String,
        enum: ['no-show-end-of-day', 'doctor-unavailable', 'system-error', null],
        default: null
    },
    autoCancelledAt: { type: Date, default: null },
    scheduledAt: { type: Date, required: true }, // IST timestamp for the appointment
    // Tags for advanced filtering and categorization
    tags: {
        type: [{
            type: String,
            enum: [
                'auto_closed',      // Automatically closed by system
                'follow_up',        // Follow-up appointment
                'first_visit',      // First visit
                'emergency',        // Emergency case
                'procedure',        // Special procedure
                'consultation',     // General consultation
                'review',           // Review appointment
                'video_call',       // Video consultation
                'in_person',       // In-person visit
                'insurance'         // Insurance-covered appointment
            ]
        }],
        default: []
    },
    // Metadata for tracking and analytics
    metadata: {
        closedBy: { type: String, enum: ['system', 'doctor', 'patient', 'admin'], default: null },
        closedAt: { type: Date, default: null },
        lastModified: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel