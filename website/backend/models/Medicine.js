import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Pain Relief', 'Antibiotics', 'Allergy', 'Diabetes', 'Cholesterol',
      'Digestive', 'Respiratory', 'Cardiovascular', 'Vitamins', 'Other'
    ]
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  expiry: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  workAble: {
    type: Boolean,
    default: true
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockHistory: [{
    operation: {
      type: String,
      enum: ['add', 'subtract', 'adjust'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
medicineSchema.index({ pharmacyId: 1, name: 1 });
medicineSchema.index({ pharmacyId: 1, category: 1 });
medicineSchema.index({ pharmacyId: 1, expiry: 1 });
medicineSchema.index({ pharmacyId: 1, stock: 1 });

// Virtual for checking if medicine is low on stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Virtual for checking if medicine is expiring soon (within 30 days)
medicineSchema.virtual('isExpiringSoon').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiry);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
});

// Virtual for checking if medicine is expired
medicineSchema.virtual('isExpired').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiry);
  return expiry < today;
});

// Method to update stock with history tracking
medicineSchema.methods.updateStock = function(quantity, operation, reason = '') {
  const previousStock = this.stock;
  
  if (operation === 'add') {
    this.stock += quantity;
  } else if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'adjust') {
    this.stock = quantity;
  }

  // Add to stock history
  this.stockHistory.push({
    operation,
    quantity,
    previousStock,
    newStock: this.stock,
    reason
  });

  return this.save();
};

// Static method to get inventory statistics
medicineSchema.statics.getInventoryStats = async function(pharmacyId) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  const pipeline = [
    { $match: { pharmacyId: new mongoose.Types.ObjectId(pharmacyId), isActive: true } },
    {
      $group: {
        _id: null,
        totalMedicines: { $sum: 1 },
        totalInventoryValue: { $sum: { $multiply: ['$stock', '$price'] } },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ['$stock', '$minStockLevel'] }, 1, 0]
          }
        },
        expiringCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$expiry', today] },
                  { $lte: ['$expiry', thirtyDaysFromNow] }
                ]
              },
              1,
              0
            ]
          }
        },
        expiredCount: {
          $sum: {
            $cond: [{ $lt: ['$expiry', today] }, 1, 0]
          }
        },
        notWorkableCount: {
          $sum: {
            $cond: [{ $eq: ['$workAble', false] }, 1, 0]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMedicines: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    notWorkableCount: 0
  };
};

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;