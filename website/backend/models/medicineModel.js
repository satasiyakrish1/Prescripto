import Medicine from './Medicine.js';
export default Medicine;

import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    manufacturer: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    minStockLevel: {
        type: Number,
        default: 10
    },
    inStock: {
        type: Boolean,
        default: function() {
            return this.stock > 0;
        }
    },
    expiry: {
        type: Date
    },
    batchNumber: {
        type: String
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy'
    },
    composition: {
        type: String,
        required: true
    },
    dosageForm: {
        type: String,
        required: true
    },
    strength: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    usage: {
        type: String,
        required: true
    },
    sideEffects: [{
        type: String
    }],
    precautions: [{
        type: String
    }]
}, {
    timestamps: true
});

medicineSchema.index({ name: 'text', description: 'text', category: 'text' });

// Static method to get inventory statistics
medicineSchema.statics.getInventoryStats = async function(pharmacyId) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  // Calculate total sales (mock data for now)
  const totalSales = 12500;

  // Calculate inventory statistics
  const pipeline = [
    { $match: { pharmacyId: new mongoose.Types.ObjectId(pharmacyId) } },
    {
      $facet: {
        // Total medicines and inventory value
        totals: [
          {
            $group: {
              _id: null,
              totalMedicines: { $sum: 1 },
              totalInventoryValue: { $sum: { $multiply: ["$price", "$stock"] } }
            }
          }
        ],
        // Low stock items
        lowStock: [
          {
            $match: {
              $expr: { $lt: ["$stock", "$minStockLevel"] }
            }
          },
          { $count: "count" }
        ],
        // Expiring items (within 30 days)
        expiring: [
          {
            $match: {
              expiry: { $gte: today, $lte: thirtyDaysFromNow }
            }
          },
          { $count: "count" }
        ],
        // Expired items
        expired: [
          {
            $match: {
              expiry: { $lt: today }
            }
          },
          { $count: "count" }
        ]
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  // Extract results from facets
  const totals = result[0].totals[0] || { totalMedicines: 0, totalInventoryValue: 0 };
  const lowStockCount = result[0].lowStock[0]?.count || 0;
  const expiringCount = result[0].expiring[0]?.count || 0;
  const expiredCount = result[0].expired[0]?.count || 0;

  return {
    totalMedicines: totals.totalMedicines,
    totalInventoryValue: totals.totalInventoryValue,
    lowStockCount,
    expiringCount,
    expiredCount,
    totalSales
  };
};