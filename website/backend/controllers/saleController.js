import Sale from '../models/saleModel.js';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';
import mongoose from 'mongoose';

// Process a new sale/checkout
export const processSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { items, discount, gst, payment_method, customer, note, payment_gateway } = req.body;
        const pharmacyId = req.pharmacy.id;
        
        // Validate request body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided for sale'
            });
        }
        
        if (!payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }
        
        // Process each item and verify stock availability
        const processedItems = [];
        let subtotal = 0;
        
        for (const item of items) {
            // Check if it's a custom medicine or regular medicine
            if (item.custom_medicine) {
                // Process custom medicine (no stock check needed)
                const customMedicine = item.custom_medicine;
                
                // Calculate item total
                const itemTotal = customMedicine.price * item.quantity;
                subtotal += itemTotal;
                
                // Add to processed items
                processedItems.push({
                    medicine_id: new mongoose.Types.ObjectId(), // Generate a temporary ID
                    name: customMedicine.medicine_name,
                    quantity: item.quantity,
                    price: customMedicine.price,
                    total: itemTotal
                });
            } else {
                // Process regular medicine from inventory
                // First check in Medicine collection
                let medicine = await Medicine.findOne({ 
                    _id: item.medicine_id,
                    pharmacyId
                }).session(session);
                
                // If not found in Medicine collection, check in Inventory collection
                if (!medicine) {
                    medicine = await Inventory.findOne({
                        _id: item.medicine_id,
                        pharmacyId
                    }).session(session);
                }
                
                if (!medicine) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({
                        success: false,
                        message: `Medicine with ID ${item.medicine_id} not found`
                    });
                }
                
                // Check if enough stock is available
                const availableStock = medicine.stock || medicine.quantity || 0;
                if (availableStock < item.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${medicine.name}. Available: ${availableStock}, Requested: ${item.quantity}`
                    });
                }
                
                // Calculate item total
                const itemTotal = medicine.price * item.quantity;
                subtotal += itemTotal;
                
                // Add to processed items
                processedItems.push({
                    medicine_id: medicine._id,
                    name: medicine.name,
                    quantity: item.quantity,
                    price: medicine.price,
                    total: itemTotal
                });
                
                // Update medicine stock
                if (medicine.stock !== undefined) {
                    medicine.stock -= item.quantity;
                } else if (medicine.quantity !== undefined) {
                    medicine.quantity -= item.quantity;
                }
                await medicine.save({ session });
            }
        }
        
        // Calculate final amounts
        const discountAmount = discount || 0;
        const gstAmount = gst || 0;
        const totalAmount = subtotal - discountAmount + gstAmount;
        
        // Determine sale status based on payment method and gateway
        let saleStatus = 'Completed';
        
        // If using online payment gateway, set status to pending until payment is confirmed
        if (payment_method === 'card' && (payment_gateway === 'razorpay' || payment_gateway === 'stripe')) {
            saleStatus = 'Pending';
        }
        
        // Create new sale record
        const sale = new Sale({
            items: processedItems,
            subtotal,
            discount: discountAmount,
            gst: gstAmount,
            total_amount: totalAmount,
            payment_method,
            payment_gateway: payment_gateway || null,
            customer: customer || 'Walk-in',
            note: note || '',
            sold_by: pharmacyId,
            status: saleStatus
        });
        
        await sale.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        return res.status(201).json({
            success: true,
            message: 'Sale processed successfully',
            data: sale
        });
        
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        
        console.error('Process sale error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the sale',
            error: error.message
        });
    }
};

// Get all sales for a pharmacy
export const getSales = async (req, res) => {
    try {
        const pharmacyId = req.pharmacy.id;
        const { startDate, endDate, status, payment_method, limit = 50, page = 1 } = req.query;
        
        // Build filter object
        const filter = { sold_by: pharmacyId };
        
        // Add date range filter if provided
        if (startDate && endDate) {
            filter.sold_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Add status filter if provided
        if (status && ['Completed', 'Cancelled'].includes(status)) {
            filter.status = status;
        }
        
        // Add payment method filter if provided
        if (payment_method) {
            filter.payment_method = payment_method;
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get sales from database
        const sales = await Sale.find(filter)
            .sort({ sold_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        // Get total count for pagination
        const totalCount = await Sale.countDocuments(filter);
        
        return res.json({
            success: true,
            data: sales,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                pages: Math.ceil(totalCount / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Get sales error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching sales',
            error: error.message
        });
    }
};

// Get a specific sale by ID
export const getSaleById = async (req, res) => {
    try {
        const pharmacyId = req.pharmacy.id;
        const saleId = req.params.id;
        
        const sale = await Sale.findOne({
            _id: saleId,
            sold_by: pharmacyId
        });
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }
        
        return res.json({
            success: true,
            data: sale
        });
        
    } catch (error) {
        console.error('Get sale by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the sale',
            error: error.message
        });
    }
};

// Cancel a sale
export const cancelSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const pharmacyId = req.pharmacy.id;
        const saleId = req.params.id;
        
        // Find the sale
        const sale = await Sale.findOne({
            _id: saleId,
            sold_by: pharmacyId,
            status: 'Completed' // Only completed sales can be cancelled
        }).session(session);
        
        if (!sale) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Sale not found or already cancelled'
            });
        }
        
        // Update sale status
        sale.status = 'Cancelled';
        await sale.save({ session });
        
        // Restore stock for each item
        for (const item of sale.items) {
            // Check if the medicine_id is a valid ObjectId (not a custom medicine)
            if (mongoose.Types.ObjectId.isValid(item.medicine_id)) {
                // Check if the medicine exists in the Medicine collection
                const medicine = await Medicine.findById(item.medicine_id).session(session);
                
                if (medicine) {
                    // If medicine exists in Medicine collection, update stock
                    await Medicine.updateOne(
                        { _id: item.medicine_id },
                        { $inc: { stock: item.quantity } }
                    ).session(session);
                } else {
                    // Check if it exists in the Inventory collection
                    const inventoryItem = await Inventory.findById(item.medicine_id).session(session);
                    
                    if (inventoryItem) {
                        // If it exists in Inventory, update quantity
                        await Inventory.updateOne(
                            { _id: item.medicine_id },
                            { $inc: { quantity: item.quantity } }
                        ).session(session);
                    }
                }
            }
            // Custom medicines don't need stock restoration
        }
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        return res.json({
            success: true,
            message: 'Sale cancelled successfully',
            data: sale
        });
        
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        
        console.error('Cancel sale error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the sale',
            error: error.message
        });
    }
};

// Get recent sales for a pharmacy (for POS page)
export const getRecentSales = async (req, res) => {
    try {
        const pharmacyId = req.pharmacy.id;
        const { limit = 10 } = req.query;
        
        // Get recent sales from database
        const recentSales = await Sale.find({ 
            sold_by: pharmacyId,
            status: 'Completed'
        })
        .sort({ sold_at: -1 })
        .limit(parseInt(limit));
        
        return res.json({
            success: true,
            data: recentSales
        });
        
    } catch (error) {
        console.error('Get recent sales error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching recent sales',
            error: error.message
        });
    }
};

// Get sales statistics
export const getSalesStats = async (req, res) => {
    try {
        const pharmacyId = req.pharmacy.id;
        const { period } = req.query;
        
        // Define date ranges based on period
        const today = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'today':
                startDate = new Date(today.setHours(0, 0, 0, 0));
                endDate = new Date(today.setHours(23, 59, 59, 999));
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                endDate = new Date(today);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                // Default to last 30 days
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                endDate = new Date(today);
        }
        
        // Aggregate sales data
        const stats = await Sale.aggregate([
            {
                $match: {
                    sold_by: new mongoose.Types.ObjectId(pharmacyId),
                    status: 'Completed',
                    sold_at: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$total_amount' },
                    averageSaleValue: { $avg: '$total_amount' }
                }
            }
        ]);
        
        // Get payment method breakdown
        const paymentMethodStats = await Sale.aggregate([
            {
                $match: {
                    sold_by: new mongoose.Types.ObjectId(pharmacyId),
                    status: 'Completed',
                    sold_at: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$payment_method',
                    count: { $sum: 1 },
                    total: { $sum: '$total_amount' }
                }
            }
        ]);
        
        // Format the response
        const result = {
            period,
            totalSales: stats[0]?.totalSales || 0,
            totalRevenue: stats[0]?.totalRevenue || 0,
            averageSaleValue: stats[0]?.averageSaleValue || 0,
            paymentMethods: paymentMethodStats.map(method => ({
                method: method._id,
                count: method.count,
                total: method.total
            }))
        };
        
        return res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Get sales stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching sales statistics',
            error: error.message
        });
    }
};