import mongoose from 'mongoose';

const medicalFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    googleDriveFileId: {
        type: String,
        required: true
    },
    webViewLink: {
        type: String,
        required: true
    },
    webContentLink: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        default: 'image' // PDFs are stored as 'image' type in Cloudinary for inline viewing
    },
    aiAnalysis: {
        type: String,
        default: ''
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    sharedWith: [{
        email: { type: String, required: true },
        sharedAt: { type: Date, default: Date.now },
        accessType: { type: String, enum: ['view'], default: 'view' }
    }],
    isPublic: {
        type: Boolean,
        default: false
    }
});

const MedicalFile = mongoose.model('MedicalFile', medicalFileSchema);

export default MedicalFile;
