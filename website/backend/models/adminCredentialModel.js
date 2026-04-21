import mongoose from 'mongoose';

const AdminCredentialSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('AdminCredential', AdminCredentialSchema);
