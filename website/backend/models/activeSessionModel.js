import mongoose from 'mongoose';

const activeSessionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'admin', required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  ipAddress: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: 'Unknown' },
  deviceInfo: { type: String, default: 'Unknown' },
  lastSeen: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  revokedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('ActiveSession', activeSessionSchema);
