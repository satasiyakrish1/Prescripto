import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
    {
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true
        },
        floorNumber: {
            type: Number,
            required: true
        },
        rooms: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Room'
            }
        ]
    },
    {
        timestamps: true
    }
);

floorSchema.index({ hospitalId: 1, floorNumber: 1 }, { unique: true });

const Floor = mongoose.models.Floor || mongoose.model('Floor', floorSchema);
export default Floor;

