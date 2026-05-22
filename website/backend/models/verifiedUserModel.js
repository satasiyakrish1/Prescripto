import mongoose from 'mongoose';

const verifiedUserSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    plan: { 
        type: String, 
        required: true,
        enum: ['Free', 'Starter', 'Pro', 'ProAnnual', 'Elite', 'Monthly', 'Quarterly', 'Yearly']
    },
    paymentId: { 
        type: String, 
        required: true 
    },
    verifiedAt: { 
        type: Date, 
        default: Date.now 
    }
});

const verifiedUserModel = mongoose.models.verifiedUser || mongoose.model("verifiedUser", verifiedUserSchema);
export default verifiedUserModel;