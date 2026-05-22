import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percent', 'amount'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: null },
  minAmount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  allowedPlans: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
