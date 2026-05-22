import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        default: process.env.ADMIN_EMAIL
    },
    name: {
        type: String,
        default: 'Admin'
    },
    image: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'admin'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    socialMedia: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        portfolioURL: { type: String, default: '' }
    },
    skills: {
        type: [String],
        default: []
    },
    // Google Tasks integration
    googleTasksTokens: {
        type: Object,
        default: null
    },
    googleTasksEmail: {
        type: String,
        default: null
    },
    googleTasksConnectedAt: {
        type: Date,
        default: null
    },
    googleTasksDefaultListId: {
        type: String,
        default: '@default'
    }
});

const adminModel = mongoose.model('Admin', adminSchema);
export default adminModel;
