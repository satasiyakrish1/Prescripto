import razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate QR code for payment
const getQRCode = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        // Get payment details from Razorpay
        const order = await razorpayInstance.orders.fetch(orderId);
        
        // Generate QR code for the order
        const qrCode = await razorpayInstance.qrCode.create({
            type: 'upi_qr',
            name: 'Prescripto Donation',
            usage: 'single_use',
            fixed_amount: true,
            payment_amount: order.amount,
            description: 'Support our healthcare mission',
            customer_id: order.receipt,
            close_by: Math.floor(Date.now() / 1000) + 3600, // QR code valid for 1 hour
            notes: order.notes
        });

        res.json({ success: true, qrCode: qrCode.image_url });

    } catch (error) {
        console.error('QR code generation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to generate QR code' });
    }
};

// Create a donation order
const createDonation = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }

        // Creating options for razorpay payment
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: currency || process.env.CURRENCY || 'INR',
            receipt: receipt,
            notes: notes || {}
        };

        // Create an order
        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order });

    } catch (error) {
        console.error('Donation order creation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create donation order' });
    }
};

// Verify donation payment
const verifyDonation = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'All payment details are required' });
        }

        // Create signature verification string
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Here you could save donation details to database if needed
            res.json({ success: true, message: 'Donation successful' });
        } else {
            res.json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Donation verification error:', error);
        res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
    }
};

export { createDonation, verifyDonation, getQRCode };