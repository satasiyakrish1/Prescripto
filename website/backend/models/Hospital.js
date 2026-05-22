import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        floors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Floor'
            }
        ]
    },
    {
        timestamps: true
    }
);

hospitalSchema.index({ name: 1 }, { unique: true });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
export default Hospital;

