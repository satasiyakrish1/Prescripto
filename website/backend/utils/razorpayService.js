import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay order for POS sale
 * @param {Object} saleData - Sale data including amount, receipt, etc.
 * @returns {Promise<Object>} - Razorpay order object
 */
export const createPosOrder = async (saleData) => {
    try {
        // Creating options for razorpay payment
        const options = {
            amount: Math.round(saleData.total_amount * 100), // Razorpay expects amount in paise
            currency: process.env.CURRENCY || 'INR',
            receipt: saleData._id.toString(),
            notes: {
                saleId: saleData._id.toString(),
                customer: saleData.customer?.name || 'Walk-in',
                items: saleData.items.length
            }
        };

        // Create an order
        const order = await razorpayInstance.orders.create(options);
        return { success: true, order };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment data including order_id, payment_id, signature
 * @returns {Promise<Object>} - Verification result
 */
export const verifyPayment = async (paymentData) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return { success: false, message: 'Missing payment verification parameters' };
        }

        // Create signature verification string
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const crypto = await import('crypto');
        const expectedSignature = crypto.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            return { success: true, message: 'Payment verified successfully' };
        } else {
            return { success: false, message: 'Payment verification failed' };
        }
    } catch (error) {
        console.error('Razorpay verification error:', error);
        return { success: false, error: error.message };
    }
};

export default razorpayInstance;