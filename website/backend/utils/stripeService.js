import Stripe from 'stripe';

// Initialize Stripe instance
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a new Stripe checkout session for POS sale
 * @param {Object} saleData - Sale data including amount, items, etc.
 * @param {string} origin - Origin URL for success/cancel redirects
 * @returns {Promise<Object>} - Stripe checkout session
 */
export const createPosCheckoutSession = async (saleData, origin) => {
    try {
        const currency = (process.env.CURRENCY || 'INR').toLowerCase();
        
        // Create line items for Stripe checkout
        const line_items = saleData.items.map(item => ({
            price_data: {
                currency,
                product_data: {
                    name: item.name,
                    description: `Quantity: ${item.quantity}`
                },
                unit_amount: Math.round(item.price * 100) // Stripe expects amount in cents
            },
            quantity: item.quantity
        }));
        
        // Add tax and discount if applicable
        if (saleData.gst > 0) {
            line_items.push({
                price_data: {
                    currency,
                    product_data: {
                        name: "GST",
                    },
                    unit_amount: Math.round(saleData.gst * 100)
                },
                quantity: 1
            });
        }
        
        if (saleData.discount > 0) {
            line_items.push({
                price_data: {
                    currency,
                    product_data: {
                        name: "Discount",
                    },
                    unit_amount: -Math.round(saleData.discount * 100) // Negative amount for discount
                },
                quantity: 1
            });
        }
        
        // Create checkout session
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/pos/verify?success=true&saleId=${saleData._id}`,
            cancel_url: `${origin}/pos/verify?success=false&saleId=${saleData._id}`,
            metadata: {
                saleId: saleData._id.toString(),
                customer: saleData.customer?.name || 'Walk-in'
            }
        });
        
        return { success: true, session };
    } catch (error) {
        console.error('Stripe session creation error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify Stripe payment status
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<Object>} - Payment verification result
 */
export const verifyPayment = async (sessionId) => {
    try {
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
            return { 
                success: true, 
                message: 'Payment successful',
                saleId: session.metadata?.saleId
            };
        } else {
            return { 
                success: false, 
                message: `Payment not completed. Status: ${session.payment_status}`,
                saleId: session.metadata?.saleId
            };
        }
    } catch (error) {
        console.error('Stripe verification error:', error);
        return { success: false, error: error.message };
    }
};

export default stripeInstance;