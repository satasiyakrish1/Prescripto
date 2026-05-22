import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  medicine_name: {
    type: String,
    required: [true, 'Medicine name is required']
  },
  batch_no: {
    type: String,
    required: [true, 'Batch number is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  expiry_date: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Painkiller', 'Antibiotic', 'Antiviral', 'Antihistamine', 'Vitamin', 'Supplement', 'Other']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Expired'],
    default: function() {
      const today = new Date();
      if (this.expiry_date < today) {
        return 'Expired';
      } else if (this.quantity <= 10) {
        return 'Low Stock';
      } else {
        return 'In Stock';
      }
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update status before saving
inventorySchema.pre('save', function(next) {
  const today = new Date();
  if (this.expiry_date < today) {
    this.status = 'Expired';
  } else if (this.quantity <= 10) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.updated_at = Date.now();
  next();
});

// Create text index for search functionality
inventorySchema.index({ medicine_name: 'text', manufacturer: 'text', category: 'text' });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;