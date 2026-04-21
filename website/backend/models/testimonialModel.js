import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
    doctor: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true 
    },
    patient: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true 
    },
    patientName: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true,
        maxLength: 1000 
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const testimonialModel = mongoose.models.testimonial || mongoose.model("testimonial", testimonialSchema);
export default testimonialModel;