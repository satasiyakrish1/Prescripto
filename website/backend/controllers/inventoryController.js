import Inventory from '../models/inventoryModel.js';
import mongoose from 'mongoose';

// Get all inventory items with filtering, sorting, and pagination
export const getInventory = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'medicine_name', 
      sortOrder = 'asc' 
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { medicine_name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batch_no: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Inventory.countDocuments(filter);
    
    // Get inventory items
    const inventory = await Inventory.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Return response
    return res.status(200).json({
      success: true,
      count: inventory.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Search inventory items
export const searchInventory = async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('Search query received:', query);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search for medicines in inventory
    const results = await Inventory.find({
      $or: [
        { medicine_name: { $regex: query, $options: 'i' } },
        { batch_no: { $regex: query, $options: 'i' } },
        { manufacturer: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ],
      quantity: { $gt: 0 }, // Only return items with quantity > 0
      status: { $ne: 'Expired' } // Only return non-expired items
    }).limit(20);

    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching inventory',
      error: error.message
    });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get total count
    const totalItems = await Inventory.countDocuments();
    
    // Get low stock count
    const lowStockCount = await Inventory.countDocuments({ status: 'Low Stock' });
    
    // Get expired count
    const expiredCount = await Inventory.countDocuments({ status: 'Expired' });
    
    // Get expiring soon count (within 30 days)
    const expiringSoonCount = await Inventory.countDocuments({
      expiry_date: { $gt: today, $lt: thirtyDaysFromNow },
      status: { $ne: 'Expired' }
    });
    
    // Get total inventory value
    const inventoryValue = await Inventory.aggregate([
      {
        $match: { status: { $ne: 'Expired' } }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        lowStockCount,
        expiredCount,
        expiringSoonCount,
        totalValue: inventoryValue.length > 0 ? inventoryValue[0].totalValue : 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Add new inventory item
export const addInventoryItem = async (req, res) => {
  try {
    const {
      medicine_name,
      batch_no,
      quantity,
      expiry_date,
      manufacturer,
      category,
      price
    } = req.body;

    // Create new inventory item
    const newItem = new Inventory({
      medicine_name,
      batch_no,
      quantity: parseInt(quantity),
      expiry_date,
      manufacturer,
      category,
      price: parseFloat(price)
    });

    // Save to database
    const savedItem = await newItem.save();

    return res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Check if item exists
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update item
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Check if item exists
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Delete item
    await Inventory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export default {
  getInventory,
  getInventoryStats,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  searchInventory
};