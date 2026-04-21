const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  medicine_name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  batch_no: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  expiry_date: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Expired'],
    default: 'In Stock'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Create text index for search functionality
inventorySchema.index(
  { 
    medicine_name: 'text', 
    manufacturer: 'text', 
    batch_no: 'text',
    category: 'text'
  }
);

// Pre-save middleware to update status based on expiry date and quantity
inventorySchema.pre('save', function(next) {
  // Check if expired
  const currentDate = new Date();
  if (this.expiry_date < currentDate) {
    this.status = 'Expired';
  } 
  // Check if low stock (assuming 10 is the threshold)
  else if (this.quantity <= 10) {
    this.status = 'Low Stock';
  } 
  // Otherwise, it's in stock
  else {
    this.status = 'In Stock';
  }
  
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;