import mongoose from 'mongoose';

const bedHistorySchema = new mongoose.Schema(
    {
        wardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ward',
            required: true
        },
        bedId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            default: null
        },
        previousStatus: {
            type: String,
            required: true
        },
        newStatus: {
            type: String,
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        },
        reason: {
            type: String,
            default: ''
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

bedHistorySchema.index({ wardId: 1, bedId: 1, changedAt: -1 });

const BedHistory = mongoose.models.BedHistory || mongoose.model('BedHistory', bedHistorySchema);
export default BedHistory;

