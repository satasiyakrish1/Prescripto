// routes/medicineRoutes.js
const express = require('express');
const Medicine = require('../models/medicineModel');
const { authenticatePharmacy } = require('../middleware/auth');
const router = express.Router();

// Get all medicines for a pharmacy
router.get('/inventory', authenticatePharmacy, async (req, res) => {
  try {
    const { search, category, sortBy, order, workAble } = req.query;
    const pharmacyId = req.pharmacy.id;
    
    // Build query
    let query = { pharmacyId, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by workAble status if provided
    if (workAble !== undefined) {
      query.workAble = workAble === 'true';
    }
    
    // Build sort object
    let sortObj = {};
    if (sortBy) {
      sortObj[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.name = 1; // Default sort by name ascending
    }
    
    const medicines = await Medicine.find(query)
      .sort(sortObj)
      .populate('pharmacyId', 'name');
      
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// Get medicine by ID
router.get('/:id', authenticatePharmacy, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      pharmacyId: req.pharmacy.id,
      isActive: true
    });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine',
      error: error.message
    });
  }
});

// Add new medicine
router.post('/add', authenticatePharmacy, async (req, res) => {
  try {
    const {
      name,
      category,
      stock,
      price,
      expiry,
      description,
      manufacturer,
      batchNumber,
      minStockLevel,
      workAble
    } = req.body;
    
    // Check if medicine already exists
    const existingMedicine = await Medicine.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      pharmacyId: req.pharmacy.id,
      isActive: true
    });
    
    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message: 'Medicine with this name already exists'
      });
    }
    
    const medicine = new Medicine({
      name,
      category,
      stock: parseInt(stock),
      price: parseFloat(price),
      expiry: new Date(expiry),
      pharmacyId: req.pharmacy.id,
      description,
      manufacturer,
      batchNumber,
      minStockLevel: minStockLevel || 10,
      workAble: workAble !== undefined ? workAble : true
    });
    
    await medicine.save();
    
    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding medicine',
      error: error.message
    });
  }
});

// Update medicine
router.put('/:id', authenticatePharmacy, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      {
        _id: req.params.id,
        pharmacyId: req.pharmacy.id,
        isActive: true
      },
      { ...req.body, expiry: new Date(req.body.expiry) },
      { new: true, runValidators: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating medicine',
      error: error.message
    });
  }
});

// Update stock quantity
router.patch('/:id/stock', authenticatePharmacy, async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      pharmacyId: req.pharmacy.id,
      isActive: true
    });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    let newStock;
    if (operation === 'add') {
      newStock = medicine.stock + parseInt(quantity);
    } else if (operation === 'subtract') {
      newStock = medicine.stock - parseInt(quantity);
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock cannot be negative'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }
    
    medicine.stock = newStock;
    await medicine.save();
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: medicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
});

// Delete medicine (soft delete)
router.delete('/:id', authenticatePharmacy, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      {
        _id: req.params.id,
        pharmacyId: req.pharmacy.id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting medicine',
      error: error.message
    });
  }
});

// Get low stock medicines
router.get('/alerts/low-stock', authenticatePharmacy, async (req, res) => {
  try {
    const medicines = await Medicine.find({
      pharmacyId: req.pharmacy.id,
      isActive: true,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    }).sort({ stock: 1 });
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock medicines',
      error: error.message
    });
  }
});

// Get expiring medicines
router.get('/alerts/expiring', authenticatePharmacy, async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const medicines = await Medicine.find({
      pharmacyId: req.pharmacy.id,
      isActive: true,
      expiry: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    }).sort({ expiry: 1 });
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring medicines',
      error: error.message
    });
  }
});

// Get expired medicines
router.get('/alerts/expired', authenticatePharmacy, async (req, res) => {
  try {
    const medicines = await Medicine.find({
      pharmacyId: req.pharmacy.id,
      isActive: true,
      expiry: { $lt: new Date() }
    }).sort({ expiry: -1 });
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expired medicines',
      error: error.message
    });
  }
});

// Get not workable medicines
router.get('/alerts/not-workable', authenticatePharmacy, async (req, res) => {
  try {
    const medicines = await Medicine.find({
      pharmacyId: req.pharmacy.id,
      isActive: true,
      workAble: false
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: medicines,
      count: medicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching not workable medicines',
      error: error.message
    });
  }
});

// Get inventory statistics
router.get('/stats/overview', authenticatePharmacy, async (req, res) => {
  try {
    const pharmacyId = req.pharmacy.id;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const [
      totalMedicines,
      lowStockCount,
      expiringCount,
      expiredCount,
      notWorkableCount,
      totalValue
    ] = await Promise.all([
      Medicine.countDocuments({ pharmacyId, isActive: true }),
      Medicine.countDocuments({
        pharmacyId,
        isActive: true,
        $expr: { $lte: ['$stock', '$minStockLevel'] }
      }),
      Medicine.countDocuments({
        pharmacyId,
        isActive: true,
        expiry: { $gte: new Date(), $lte: thirtyDaysFromNow }
      }),
      Medicine.countDocuments({
        pharmacyId,
        isActive: true,
        expiry: { $lt: new Date() }
      }),
      Medicine.countDocuments({
        pharmacyId,
        isActive: true,
        workAble: false
      }),
      Medicine.aggregate([
        { $match: { pharmacyId: req.pharmacy.id, isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalMedicines,
        lowStockCount,
        expiringCount,
        expiredCount,
        notWorkableCount,
        totalInventoryValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics',
      error: error.message
    });
  }
});

module.exports = router;