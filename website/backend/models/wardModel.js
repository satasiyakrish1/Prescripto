import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            enum: ['ICU', 'operation_theater', 'general_ward'],
            default: 'general_ward'
        },
        hospitalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            default: null
        },
        totalBeds: {
            type: Number,
            required: true,
            min: 1
        },
        beds: [
            {
                bedNumber: {
                    type: String,
                    required: true
                },
                status: {
                    type: String,
                    enum: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'],
                    default: 'available'
                },
                patient: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Patient',
                    default: null
                },
                categoryId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'BedCategory',
                    default: null
                },
                admissionDate: Date,
                expectedDischargeDate: Date,
                isEmergency: {
                    type: Boolean,
                    default: false
                },
                notes: String,
                lastUpdated: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        occupancyStatus: {
            type: Number,
            default: 0
        },
        floor: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        staff: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Staff'
            }
        ],
        emergencyCapacity: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

wardSchema.pre('save', function (next) {
    const occupiedBeds = this.beds.filter(bed => bed.status === 'occupied').length;
    this.occupancyStatus = this.totalBeds > 0 ? (occupiedBeds / this.totalBeds) * 100 : 0;
    this.lastUpdated = new Date();
    next();
});

wardSchema.index({ floor: 1, department: 1 });

// Check if the model already exists to prevent the OverwriteModelError
const Ward = mongoose.models.Ward || mongoose.model('Ward', wardSchema);
export default Ward;
