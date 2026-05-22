import Sale from '../models/saleModel.js';
import mongoose from 'mongoose';

// Get all sales with pagination and filters
export const getSales = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
        
        // Build query
        const query = { sold_by: pharmacyId };
        
        // Add search filter if provided
        if (search) {
            query.$or = [
                { invoice_id: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { customer: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add status filter if provided
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.sold_at = {};
            if (startDate) {
                query.sold_at.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set the end date to the end of the day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.sold_at.$lte = endOfDay;
            }
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute query with pagination
        const sales = await Sale.find(query)
            .sort({ sold_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const totalSales = await Sale.countDocuments(query);
        
        res.json({
            success: true,
            message: 'Sales retrieved successfully',
            data: sales,
            pagination: {
                total: totalSales,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalSales / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales',
            error: error.message
        });
    }
};

// Get a specific sale by ID
export const getSaleById = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { id } = req.params;
        
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID format'
            });
        }
        
        // Find the sale
        const sale = await Sale.findOne({
            _id: id,
            sold_by: pharmacyId
        });
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }
        
        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sale details',
            error: error.message
        });
    }
};

// Update sale status
export const updateSaleStatus = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['completed', 'pending', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: completed, pending, cancelled'
            });
        }
        
        // Find and update the sale
        const sale = await Sale.findOneAndUpdate(
            { _id: id, sold_by: pharmacyId },
            { status },
            { new: true }
        );
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Sale status updated successfully',
            data: sale
        });
    } catch (error) {
        console.error('Error updating sale status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sale status',
            error: error.message
        });
    }
};