import Sale from '../models/saleModel.js';
import Medicine from '../models/medicineModel.js';
import mongoose from 'mongoose';

// Create a new sale
export const createSale = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { items, customer, payment_method, discount = 0, note = '' } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items are required and must be a non-empty array'
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        // Validate and process items
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            if (!item.medicine_id || !item.quantity || !item.price) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have medicine_id, quantity, and price'
                });
            }

            // Check if medicine exists and has sufficient stock
            const medicine = await Medicine.findById(item.medicine_id);
            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: `Medicine with ID ${item.medicine_id} not found`
                });
            }

            if (medicine.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${medicine.medicine_name}. Available: ${medicine.quantity}, Requested: ${item.quantity}`
                });
            }

            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;

            processedItems.push({
                medicine_id: item.medicine_id,
                name: medicine.medicine_name,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal
            });
        }

        // Calculate GST (18% for medicines in India)
        const gst = subtotal * 0.18;
        const totalAmount = subtotal + gst - discount;

        // Create the sale
        const sale = new Sale({
            items: processedItems,
            subtotal,
            discount,
            gst,
            total_amount: totalAmount,
            payment_method,
            customer: customer || 'Walk-in',
            note,
            sold_by: pharmacyId,
            status: 'Completed'
        });

        await sale.save();

        // Update medicine quantities
        for (const item of items) {
            await Medicine.findByIdAndUpdate(
                item.medicine_id,
                { $inc: { quantity: -item.quantity } },
                { new: true }
            );
        }

        // Populate medicine details for response
        await sale.populate('items.medicine_id', 'medicine_name category manufacturer');

        res.status(201).json({
            success: true,
            message: 'Sale completed successfully',
            data: sale
        });

    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating sale',
            error: error.message
        });
    }
};

// Get all sales for pharmacy
export const getSales = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        // Build query
        const query = { sold_by: pharmacyId };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.sold_at = {};
            if (startDate) query.sold_at.$gte = new Date(startDate);
            if (endDate) query.sold_at.$lte = new Date(endDate);
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const sales = await Sale.find(query)
            .populate('items.medicine_id', 'medicine_name category')
            .sort({ sold_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalSales = await Sale.countDocuments(query);
        const totalPages = Math.ceil(totalSales / limit);

        res.json({
            success: true,
            data: sales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalSales,
                pages: totalPages
            }
        });

    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
};

// Get recent sales for dashboard
export const getRecentSales = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { limit = 5 } = req.query;

        const sales = await Sale.find({ sold_by: pharmacyId })
            .populate('items.medicine_id', 'medicine_name')
            .sort({ sold_at: -1 })
            .limit(parseInt(limit));

        // Format sales for dashboard display
        const formattedSales = sales.map(sale => ({
            _id: sale._id,
            invoice_id: sale.invoice_id,
            customer: sale.customer,
            items: sale.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total_amount: sale.total_amount,
            payment_method: sale.payment_method,
            status: sale.status,
            sold_at: sale.sold_at
        }));

        res.json({
            success: true,
            data: formattedSales
        });

    } catch (error) {
        console.error('Get recent sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent sales',
            error: error.message
        });
    }
};

// Get sale by ID
export const getSaleById = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { saleId } = req.params;

        const sale = await Sale.findOne({ _id: saleId, sold_by: pharmacyId })
            .populate('items.medicine_id', 'medicine_name category manufacturer batch_no');

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
        console.error('Get sale by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sale',
            error: error.message
        });
    }
};

// Update sale status
export const updateSaleStatus = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { saleId } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Completed, or Cancelled'
            });
        }

        const sale = await Sale.findOne({ _id: saleId, sold_by: pharmacyId });
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        // If cancelling a completed sale, restore medicine quantities
        if (status === 'Cancelled' && sale.status === 'Completed') {
            for (const item of sale.items) {
                await Medicine.findByIdAndUpdate(
                    item.medicine_id,
                    { $inc: { quantity: item.quantity } },
                    { new: true }
                );
            }
        }

        // If completing a pending sale, reduce medicine quantities
        if (status === 'Completed' && sale.status === 'Pending') {
            for (const item of sale.items) {
                const medicine = await Medicine.findById(item.medicine_id);
                if (!medicine || medicine.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${item.name}`
                    });
                }
                await Medicine.findByIdAndUpdate(
                    item.medicine_id,
                    { $inc: { quantity: -item.quantity } },
                    { new: true }
                );
            }
        }

        sale.status = status;
        await sale.save();

        res.json({
            success: true,
            message: `Sale ${status.toLowerCase()} successfully`,
            data: sale
        });

    } catch (error) {
        console.error('Update sale status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating sale status',
            error: error.message
        });
    }
};

// Get sales analytics
export const getSalesAnalytics = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { period = '30' } = req.query; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get sales analytics
        const analytics = await Sale.aggregate([
            {
                $match: {
                    sold_by: new mongoose.Types.ObjectId(pharmacyId),
                    sold_at: { $gte: startDate },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total_amount' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total_amount' },
                    totalItemsSold: { $sum: { $sum: '$items.quantity' } }
                }
            }
        ]);

        // Get daily sales for chart
        const dailySales = await Sale.aggregate([
            {
                $match: {
                    sold_by: new mongoose.Types.ObjectId(pharmacyId),
                    sold_at: { $gte: startDate },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$sold_at' },
                        month: { $month: '$sold_at' },
                        day: { $dayOfMonth: '$sold_at' }
                    },
                    sales: { $sum: '$total_amount' },
                    orders: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Get top selling medicines
        const topMedicines = await Sale.aggregate([
            {
                $match: {
                    sold_by: new mongoose.Types.ObjectId(pharmacyId),
                    sold_at: { $gte: startDate },
                    status: 'Completed'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.medicine_id',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        const result = {
            summary: analytics[0] || {
                totalSales: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                totalItemsSold: 0
            },
            dailySales,
            topMedicines
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get sales analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales analytics',
            error: error.message
        });
    }
};

// Delete sale (admin only)
export const deleteSale = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId;
        const { saleId } = req.params;

        const sale = await Sale.findOne({ _id: saleId, sold_by: pharmacyId });
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        // If sale was completed, restore medicine quantities
        if (sale.status === 'Completed') {
            for (const item of sale.items) {
                await Medicine.findByIdAndUpdate(
                    item.medicine_id,
                    { $inc: { quantity: item.quantity } },
                    { new: true }
                );
            }
        }

        await Sale.findByIdAndDelete(saleId);

        res.json({
            success: true,
            message: 'Sale deleted successfully'
        });

    } catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting sale',
            error: error.message
        });
    }
};
