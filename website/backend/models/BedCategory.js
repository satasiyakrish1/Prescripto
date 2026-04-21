import mongoose from 'mongoose';

const bedCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

bedCategorySchema.index({ name: 1 }, { unique: true });

const BedCategory = mongoose.models.BedCategory || mongoose.model('BedCategory', bedCategorySchema);
export default BedCategory;

