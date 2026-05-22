import Sale from '../models/saleModel.js';
import Medicine from '../models/medicineModel.js';
import razorpayInstance, { createPosOrder, verifyPayment as verifyRazorpayPayment } from '../utils/razorpayService.js';
import { createPosCheckoutSession, verifyPayment as verifyStripePayment } from '../utils/stripeService.js';
import { createZohoOrder } from '../utils/zohoAPI.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Create a Razorpay order for POS sale
export const createRazorpayOrder = async (req, res) => {
    try {
        const { saleId } = req.body;
        const pharmacyId = req.pharmacy.id || req.pharmacyId;
        
        // Find the sale
        const sale = await Sale.findOne({
            _id: saleId,
            sold_by: pharmacyId,
            status: 'Pending' // Only pending sales can be processed
        });
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found or already processed'
            });
        }
        
        // Create Razorpay order
        const result = await createPosOrder(sale);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order',
                error: result.error
            });
        }
        
        return res.json({
            success: true,
            order: result.order,
            key_id: process.env.RAZORPAY_KEY_ID
        });
        
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the payment order',
            error: error.message
        });
    }
};

// Verify Razorpay payment
export const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        // Verify payment signature
        const result = await verifyRazorpayPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message || 'Payment verification failed'
            });
        }
        
        // Get order details to find sale ID
        const order = await razorpayInstance.orders.fetch(razorpay_order_id);
        const saleId = order.receipt;
        
        // Update sale status
        await Sale.findByIdAndUpdate(saleId, {
            status: 'Completed',
            payment_details: {
                gateway: 'razorpay',
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            }
        });
        
        return res.json({
            success: true,
            message: 'Payment verified and sale completed',
            saleId
        });
        
    } catch (error) {
        console.error('Verify Razorpay payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the payment',
            error: error.message
        });
    }
};

// Create a Stripe checkout session for POS sale
export const createStripeCheckout = async (req, res) => {
    try {
        const { saleId } = req.body;
        const pharmacyId = req.pharmacy.id || req.pharmacyId;
        const { origin } = req.headers;
        
        // Find the sale
        const sale = await Sale.findOne({
            _id: saleId,
            sold_by: pharmacyId,
            status: 'Pending' // Only pending sales can be processed
        });
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found or already processed'
            });
        }
        
        // Create Stripe checkout session
        const result = await createPosCheckoutSession(sale, origin);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create checkout session',
                error: result.error
            });
        }
        
        return res.json({
            success: true,
            sessionId: result.session.id,
            url: result.session.url
        });
        
    } catch (error) {
        console.error('Create Stripe checkout error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the checkout session',
            error: error.message
        });
    }
};

// Verify Stripe payment
export const verifyStripe = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // Verify payment status
        const result = await verifyStripePayment(sessionId);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message || 'Payment verification failed'
            });
        }
        
        // Update sale status
        await Sale.findByIdAndUpdate(result.saleId, {
            status: 'Completed',
            payment_details: {
                gateway: 'stripe',
                session_id: sessionId
            }
        });
        
        return res.json({
            success: true,
            message: 'Payment verified and sale completed',
            saleId: result.saleId
        });
        
    } catch (error) {
        console.error('Verify Stripe payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the payment',
            error: error.message
        });
    }
};

// Create Zoho payment order
export const createZohoPaymentOrder = async (req, res) => {
    try {
        const { amount, customer_email, description } = req.body || {};

        // Basic validation
        if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        if (customer_email && !/^\S+@\S+\.\S+$/.test(String(customer_email))) {
            return res.status(400).json({ success: false, message: 'Invalid customer_email' });
        }
        if (description && String(description).length > 256) {
            return res.status(400).json({ success: false, message: 'Description too long' });
        }

        const result = await createZohoOrder({ amount: Number(amount), customer_email, description });
        if (!result.success) {
            return res.status(result.status || 500).json({ success: false, message: result.error || 'Failed to create Zoho order' });
        }

        return res.status(200).json({ success: true, orderId: result.orderId, paymentLink: result.paymentLink, data: result.data });
    } catch (error) {
        console.error('Create Zoho order error:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while creating the Zoho order' });
    }
}

// ===== NEW PHARMACY SALES PAGE PAYMENT FUNCTIONS =====

// Create Razorpay order for pharmacy sales page
export const createPharmacyRazorpayOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const pharmacyId = req.pharmacy.id || req.pharmacyId;
        const { items, discount, discountType, gst, customer, customer_details, note, totalAmount, pharmacyId: reqPharmacyId } = req.body;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items are required'
            });
        }
        
        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid total amount'
            });
        }
        
        // Process items and calculate subtotal
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of items) {
            let medicine = null;
            let itemTotal = 0;
            
            if (item.isCustom && item.custom_medicine) {
                // Handle custom medicine
                itemTotal = item.custom_medicine.price * item.quantity;
                processedItems.push({
                    medicine_id: null,
                    medicine_name: item.custom_medicine.name,
                    quantity: item.quantity,
                    price: item.custom_medicine.price,
                    total: itemTotal,
                    isCustom: true
                });
            } else if (item.medicine_id) {
                // Handle regular medicine
                medicine = await Medicine.findOne({
                    _id: item.medicine_id,
                    pharmacyId: pharmacyId
                });
                
                if (!medicine) {
                    return res.status(404).json({
                        success: false,
                        message: `Medicine with ID ${item.medicine_id} not found`
                    });
                }
                
                if (medicine.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`
                    });
                }
                
                itemTotal = medicine.price * item.quantity;
                processedItems.push({
                    medicine_id: item.medicine_id,
                    medicine_name: medicine.name,
                    quantity: item.quantity,
                    price: medicine.price,
                    total: itemTotal,
                    isCustom: false
                });
            }
            
            subtotal += itemTotal;
        }
        
        // Calculate discount
        let discountAmount = 0;
        if (discountType === "amount") {
            discountAmount = parseFloat(discount) || 0;
        } else {
            const percentage = parseFloat(discount) || 0;
            discountAmount = (subtotal * percentage) / 100;
        }
        
        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);
        
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = gst || (afterDiscount * 0.05); // 5% GST if not provided
        const finalTotal = afterDiscount + gstAmount;
        
        // Create sale record
        const sale = new Sale({
            items: processedItems,
            subtotal,
            discount: discountAmount,
            gst: gstAmount,
            total_amount: finalTotal,
            payment_method: 'razorpay',
            payment_gateway: 'razorpay',
            customer: customer || 'Walk-in',
            customer_details: customer_details || {},
            note: note || '',
            sold_by: pharmacyId,
            status: 'Pending',
            invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        
        await sale.save({ session });
        
        // Create Razorpay order
        // Generate a shorter receipt ID (max 40 chars)
        const shortSaleId = sale._id.toString().slice(-8);
        const timestamp = Date.now().toString().slice(-10);
        const receipt = `s_${shortSaleId}_${timestamp}`;
        
        const razorpayOptions = {
            amount: Math.round(finalTotal * 100), // Convert to paise
            currency: process.env.CURRENCY || 'INR',
            receipt: receipt,
            notes: {
                saleId: sale._id.toString(),
                pharmacyId: pharmacyId.toString(),
                customer: customer || 'Walk-in'
            }
        };
        
        console.log('Creating Razorpay order with options:', JSON.stringify(razorpayOptions, null, 2));
        console.log('Using Razorpay credentials:');
        console.log('- Key ID:', process.env.RAZORPAY_KEY_ID);
        console.log('- Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
        console.log('- Razorpay instance exists:', !!razorpayInstance);
        
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay credentials missing:');
            console.error('- RAZORPAY_KEY_ID:', !!process.env.RAZORPAY_KEY_ID);
            console.error('- RAZORPAY_KEY_SECRET:', !!process.env.RAZORPAY_KEY_SECRET);
            throw new Error('Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        
        if (!razorpayInstance) {
            throw new Error('Razorpay instance is not initialized');
        }
        
        const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);
        
        // Update sale with Razorpay order ID
        sale.payment_details = {
            gateway: 'razorpay',
            order_id: razorpayOrder.id,
            amount: finalTotal,
            currency: razorpayOptions.currency
        };
        await sale.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return res.json({
            success: true,
            data: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt
            }
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Create pharmacy Razorpay order error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the payment order',
            error: error.message
        });
    }
};

// Verify Razorpay payment for pharmacy sales page
export const verifyPharmacyRazorpayPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment parameters'
            });
        }
        
        // Verify signature
        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        
        // Find the sale by Razorpay order ID
        const sale = await Sale.findOne({
            'payment_details.order_id': razorpay_order_id,
            status: 'Pending'
        });
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found or already processed'
            });
        }
        
        // Update medicine stock
        for (const item of sale.items) {
            if (!item.isCustom && item.medicine_id) {
                const medicine = await Medicine.findById(item.medicine_id);
                if (medicine) {
                    medicine.stock -= item.quantity;
                    await medicine.save({ session });
                }
            }
        }
        
        // Update sale status
        sale.status = 'Completed';
        sale.payment_details.payment_id = razorpay_payment_id;
        sale.payment_details.completed_at = new Date();
        sale.sold_at = new Date();
        await sale.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return res.json({
            success: true,
            data: sale
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Verify pharmacy Razorpay payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the payment',
            error: error.message
        });
    }
};

// Create Stripe checkout session for pharmacy sales page
export const createPharmacyStripeSession = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const pharmacyId = req.pharmacy.id || req.pharmacyId;
        const { items, discount, discountType, gst, customer, customer_details, note, totalAmount, success_url, cancel_url } = req.body;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items are required'
            });
        }
        
        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid total amount'
            });
        }
        
        // Process items and calculate subtotal (similar to Razorpay function)
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of items) {
            let medicine = null;
            let itemTotal = 0;
            
            if (item.isCustom && item.custom_medicine) {
                itemTotal = item.custom_medicine.price * item.quantity;
                processedItems.push({
                    medicine_id: null,
                    medicine_name: item.custom_medicine.name,
                    quantity: item.quantity,
                    price: item.custom_medicine.price,
                    total: itemTotal,
                    isCustom: true
                });
            } else if (item.medicine_id) {
                medicine = await Medicine.findOne({
                    _id: item.medicine_id,
                    pharmacyId: pharmacyId
                });
                
                if (!medicine) {
                    return res.status(404).json({
                        success: false,
                        message: `Medicine with ID ${item.medicine_id} not found`
                    });
                }
                
                if (medicine.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${item.quantity}`
                    });
                }
                
                itemTotal = medicine.price * item.quantity;
                processedItems.push({
                    medicine_id: item.medicine_id,
                    medicine_name: medicine.name,
                    quantity: item.quantity,
                    price: medicine.price,
                    total: itemTotal,
                    isCustom: false
                });
            }
            
            subtotal += itemTotal;
        }
        
        // Calculate discount and totals
        let discountAmount = 0;
        if (discountType === "amount") {
            discountAmount = parseFloat(discount) || 0;
        } else {
            const percentage = parseFloat(discount) || 0;
            discountAmount = (subtotal * percentage) / 100;
        }
        
        discountAmount = Math.min(discountAmount, subtotal);
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = gst || (afterDiscount * 0.05);
        const finalTotal = afterDiscount + gstAmount;
        
        // Create sale record
        const sale = new Sale({
            items: processedItems,
            subtotal,
            discount: discountAmount,
            gst: gstAmount,
            total_amount: finalTotal,
            payment_method: 'stripe',
            payment_gateway: 'stripe',
            customer: customer || 'Walk-in',
            customer_details: customer_details || {},
            note: note || '',
            sold_by: pharmacyId,
            status: 'Pending',
            invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        
        await sale.save({ session });
        
        // Create Stripe checkout session
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Stripe secret key missing');
            throw new Error('Stripe secret key is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: process.env.CURRENCY?.toLowerCase() || 'inr',
                    product_data: {
                        name: 'Medicine Purchase',
                        description: `Invoice #${sale.invoice_id}`,
                    },
                    unit_amount: Math.round(finalTotal * 100), // Convert to cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: success_url || `${process.env.FRONTEND_URL}/pharmacy/sales/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url || `${process.env.FRONTEND_URL}/pharmacy/sales/cancel`,
            metadata: {
                saleId: sale._id.toString(),
                pharmacyId: pharmacyId.toString(),
                customer: customer || 'Walk-in'
            }
        });
        
        // Update sale with Stripe session ID
        sale.payment_details = {
            gateway: 'stripe',
            session_id: stripeSession.id,
            amount: finalTotal,
            currency: stripeSession.currency
        };
        await sale.save({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        return res.json({
            success: true,
            data: {
                url: stripeSession.url,
                session_id: stripeSession.id
            }
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Create pharmacy Stripe session error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the checkout session',
            error: error.message
        });
    }
};