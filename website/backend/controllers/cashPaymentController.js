import Sale from '../models/saleModel.js';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Process a cash payment
export const processCashPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Get pharmacy ID from authenticated request
        const pharmacyId = req.pharmacy.id || req.pharmacyId;
        
        // Extract data from request body
        const { items, discount, gst, customer, note, updateInventory } = req.body;
        
        // Validate request body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items provided for sale'
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
                    medicine_id: null, // No medicine ID for custom items
                    medicine_name: customMedicine.medicine_name,
                    quantity: item.quantity,
                    price: customMedicine.price,
                    total: itemTotal,
                    isCustom: true
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
                const availableStock = medicine.stock || 0;
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
                    medicine_name: medicine.name,
                    quantity: item.quantity,
                    price: medicine.price,
                    total: itemTotal,
                    isCustom: false
                });
                
                // Update medicine stock if updateInventory flag is true
                if (updateInventory) {
                    medicine.stock -= item.quantity;
                    await medicine.save({ session });
                }
            }
        }
        
        // Calculate final amounts
        const discountAmount = discount || 0;
        const gstAmount = gst || 0;
        const totalAmount = subtotal - discountAmount + gstAmount;
        
        // Create new sale record with Completed status for cash payments
        const sale = new Sale({
            items: processedItems,
            subtotal,
            discount: discountAmount,
            gst: gstAmount,
            total_amount: totalAmount,
            payment_method: 'cash',
            payment_gateway: null,
            customer: customer || 'Walk-in',
            note: note || '',
            sold_by: pharmacyId,
            status: 'Completed',
            payment_details: {
                method: 'cash',
                transaction_id: uuidv4(), // Generate a unique transaction ID for cash payments
                completed_at: new Date()
            }
        });
        
        await sale.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        return res.status(201).json({
            success: true,
            message: 'Cash payment processed successfully',
            data: sale
        });
        
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        
        console.error('Cash payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the cash payment',
            error: error.message
        });
    }
};