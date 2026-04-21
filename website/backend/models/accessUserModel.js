import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const AccessUserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
  allowedRoutes: { type: [String], default: [] },
  active: { type: Boolean, default: true },
}, { timestamps: true });

AccessUserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('AccessUser', AccessUserSchema);
