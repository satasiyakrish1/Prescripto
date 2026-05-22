const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Get all inventory items with filtering, sorting, and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, 
      sortBy = 'medicine_name', 
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { medicine_name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batch_no: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const total = await Inventory.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    const items = await Inventory.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: items,
      total,
      totalPages,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory items' });
  }
});

// Get inventory statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get current date
    const currentDate = new Date();
    
    // Set date for items expiring soon (within 30 days)
    const expiringSoonDate = new Date();
    expiringSoonDate.setDate(currentDate.getDate() + 30);
    
    // Get total items count
    const totalItems = await Inventory.countDocuments();
    
    // Get low stock count
    const lowStockCount = await Inventory.countDocuments({ status: 'Low Stock' });
    
    // Get expired count
    const expiredCount = await Inventory.countDocuments({
      expiry_date: { $lt: currentDate }
    });
    
    // Get expiring soon count
    const expiringSoonCount = await Inventory.countDocuments({
      expiry_date: { $gt: currentDate, $lt: expiringSoonDate }
    });
    
    // Calculate total inventory value
    const inventoryItems = await Inventory.find({}, 'price quantity');
    const totalValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    res.json({
      success: true,
      data: {
        totalItems,
        lowStockCount,
        expiredCount,
        expiringSoonCount,
        totalValue
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory statistics' });
  }
});

// Add new inventory item
router.post('/', authenticateToken, async (req, res) => {
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
    
    // Validate required fields
    if (!medicine_name || !batch_no || !quantity || !expiry_date || !manufacturer || !category || !price) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Determine status based on quantity and expiry date
    let status = 'In Stock';
    
    // Check if expired
    const currentDate = new Date();
    const expiryDate = new Date(expiry_date);
    
    if (expiryDate < currentDate) {
      status = 'Expired';
    } else if (quantity <= 10) { // Assuming 10 is the low stock threshold
      status = 'Low Stock';
    }
    
    // Create new inventory item
    const newItem = new Inventory({
      medicine_name,
      batch_no,
      quantity: parseInt(quantity),
      expiry_date,
      manufacturer,
      category,
      price: parseFloat(price),
      status
    });
    
    await newItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to add inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      medicine_name, 
      batch_no, 
      quantity, 
      expiry_date, 
      manufacturer, 
      category, 
      price 
    } = req.body;
    
    // Validate required fields
    if (!medicine_name || !batch_no || !quantity || !expiry_date || !manufacturer || !category || !price) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Determine status based on quantity and expiry date
    let status = 'In Stock';
    
    // Check if expired
    const currentDate = new Date();
    const expiryDate = new Date(expiry_date);
    
    if (expiryDate < currentDate) {
      status = 'Expired';
    } else if (parseInt(quantity) <= 10) { // Assuming 10 is the low stock threshold
      status = 'Low Stock';
    }
    
    // Find and update the inventory item
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      {
        medicine_name,
        batch_no,
        quantity: parseInt(quantity),
        expiry_date,
        manufacturer,
        category,
        price: parseFloat(price),
        status
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await Inventory.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inventory item' });
  }
});

module.exports = router;