import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
    {
        floorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            required: true
        },
        roomNumber: {
            type: String,
            required: true,
            trim: true
        },
        wardType: {
            type: String,
            enum: ['General', 'Semi-Private', 'Private', 'ICU', 'NICU', 'Emergency'],
            required: true
        },
        totalBeds: {
            type: Number,
            required: true,
            min: 1
        },
        wardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ward',
            default: null
        }
    },
    {
        timestamps: true
    }
);

roomSchema.index({ floorId: 1, roomNumber: 1 }, { unique: true });

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export default Room;

