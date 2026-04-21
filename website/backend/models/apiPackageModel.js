import mongoose from 'mongoose';

const apiPackageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageType: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  monthlyCallLimit: {
    type: Number,
    required: true
  },
  callsUsed: {
    type: Number,
    default: 0
  },
  validUntil: {
    type: Date,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ApiPackage', apiPackageSchema);