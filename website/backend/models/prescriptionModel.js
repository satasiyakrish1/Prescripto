import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'appointment', 
        required: true 
    },
    doctorId: { 
        type: String, 
        required: true 
    },
    patientId: { 
        type: String, 
        required: true 
    },
    patientName: { 
        type: String, 
        required: true 
    },
    doctorName: { 
        type: String, 
        required: true 
    },
    diagnosis: { 
        type: String, 
        required: true 
    },
    medications: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],
    notes: { 
        type: String 
    },
    followUpDate: { 
        type: Date 
    },
    // Google Drive integration fields
    googleDrive: {
        fileId: { type: String },
        fileUrl: { type: String },
        folderId: { type: String },
        uploadedAt: { type: Date },
        uploadedBy: { type: String }
    },
    // Local file storage
    localFile: {
        filename: { type: String },
        path: { type: String },
        mimetype: { type: String }
    }
}, {
    timestamps: true
});

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
