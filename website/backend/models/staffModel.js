import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['security', 'operation_management', 'fo', 'cco', 'hospital_staff', 'reception', 'custom'],
        default: 'custom'
    },
    customRole: {
        type: String,
        trim: true,
        required: function() {
            return this.role === 'custom';
        }
    },
    department: {
        type: String,
        trim: true,
        required: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;