import mongoose from "mongoose";

const verificationLogSchema = new mongoose.Schema({
    actorType: { type: String, enum: ['admin', 'system'], default: 'admin' },
    actorId: { type: mongoose.Schema.Types.ObjectId, refPath: 'actorType' },
    ipAddress: { type: String },
    userAgent: { type: String },
    request: { type: Object },
    result: { type: Object },
    status: { type: String, enum: ['success', 'failure', 'captcha_required'], default: 'success' },
    error: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { minimize: false });

const verificationLogModel = mongoose.models.verificationLog || mongoose.model("verificationLog", verificationLogSchema);
export default verificationLogModel;


