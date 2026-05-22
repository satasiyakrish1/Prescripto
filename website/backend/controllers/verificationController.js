import verifiedUserModel from '../models/verifiedUserModel.js';
import userModel from '../models/userModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Coupon from '../models/couponModel.js';

// Initialize Razorpay
console.log('=== INITIALIZING RAZORPAY ===');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
console.log('Key Secret length:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0);

let razorpayInstance;

try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay instance created successfully');
} catch (error) {
    console.error('ERROR: Failed to initialize Razorpay:', error);
    console.error('This will cause payment processing to fail!');
}

// Verification plans configuration
const verificationPlans = {
    Free: {
        name: 'Free',
        price: 0,
        durationMonths: null,
        duration: 'Forever',
        description: 'Start building your health profile.',
        tier: 'free',
        popular: false,
        features: [
            'Basic profile on Prescripto',
            'Community access',
            'Standard search visibility',
            'Health tools (BMI, BMR, BAC)',
            'Medical files storage (100 MB)',
        ]
    },
    Starter: {
        name: 'Starter',
        price: 99,
        durationMonths: 1,
        duration: '1 month',
        description: 'Get trusted. Get seen.',
        tier: 'starter',
        popular: false,
        features: [
            'Blue Verification Badge',
            'Priority Search Visibility',
            'Priority Email Support',
            'Virtual Health ID (VHID)',
            'Medical Files Storage (500 MB)',
        ]
    },
    Pro: {
        name: 'Pro',
        price: 599,
        durationMonths: 3,
        duration: '3 months',
        description: 'Full healthcare at your fingertips.',
        tier: 'pro',
        popular: false,
        features: [
            'Everything in Starter',
            'AI Skin Analysis (unlimited)',
            'AI Fitness Analysis (unlimited)',
            'Medical Data Dashboard',
            'Family Account (up to 5 members)',
            'Medical Files Storage (5 GB)',
            'Prescription Templates',
            'Appointment Auto-Reminders',
            'Events — Early Access RSVP',
        ]
    },
    ProAnnual: {
        name: 'Pro Annual',
        price: 1499,
        durationMonths: 12,
        duration: '12 months',
        description: 'Pro features at ₹125/month. Save 38%.',
        tier: 'pro',
        popular: true,
        savingsBadge: 'Save 38%',
        features: [
            'Everything in Pro',
            'Annual billing — ₹125/month effective',
            'Medical Files Storage (5 GB)',
            'Priority Email Support',
        ]
    },
    Elite: {
        name: 'Elite',
        price: 3999,
        durationMonths: 12,
        duration: '12 months',
        description: 'The complete Prescripto experience.',
        tier: 'elite',
        popular: false,
        features: [
            'Everything in Pro Annual',
            'Gold "Elite Member" Badge',
            'API Marketplace Access',
            'Google Wallet Health Pass',
            '5% Wallet Cashback on Appointments',
            'Monthly Exclusive Coupons',
            'Live Chat Priority Support',
            'Medical Files Storage (20 GB)',
        ]
    }
};


// API to get verification plans
export const getVerificationPlans = async (req, res) => {
    try {
        res.json({ success: true, plans: verificationPlans });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to create Razorpay order for verification
export const createVerificationOrder = async (req, res) => {
    try {
        console.log('=== CREATE VERIFICATION ORDER ===');
        console.log('Request received at:', new Date().toISOString());
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        console.log('Razorpay instance exists:', !!razorpayInstance);
        
        if (!razorpayInstance) {
            console.error('ERROR: Razorpay instance is not initialized');
            return res.json({ success: false, message: 'Payment gateway not initialized', error: 'RAZORPAY_NOT_INITIALIZED' });
        }
        
        const { userId, planType, couponCode } = req.body;
        
        // Check if plan exists
        if (!verificationPlans[planType]) {
            console.log('ERROR: Invalid plan selected:', planType);
            console.log('Available plans:', Object.keys(verificationPlans));
            return res.json({ success: false, message: 'Invalid plan selected' });
        }
        
        // Check if user is already verified
        console.log('Looking up user with ID:', userId);
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('ERROR: User not found with ID:', userId);
            return res.json({ success: false, message: 'User not found' });
        }
        
        console.log('User found:', { name: user.name, email: user.email, isVerified: user.isVerified });
        
        if (user.isVerified) {
            console.log('ERROR: User is already verified:', userId);
            return res.json({ success: false, message: 'User is already verified' });
        }
        
        // Create Razorpay order
        // Generate a shorter receipt ID (max 40 chars)
        // Use last 8 chars of userId + timestamp to keep it unique but shorter
        const shortUserId = userId.toString().slice(-8);
        const timestamp = Date.now().toString().slice(-10);
        const receipt = `v_${shortUserId}_${timestamp}`;
        
        console.log('Generated receipt ID:', receipt, '(length:', receipt.length, ')');
        
        let finalAmount = verificationPlans[planType].price;
        let appliedCoupon = null;
        if (couponCode) {
            try {
                const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), active: true });
                if (coupon) {
                    if (!coupon.expiresAt || coupon.expiresAt >= new Date()) {
                        if (!coupon.allowedPlans?.length || coupon.allowedPlans.includes(planType)) {
                            const base = verificationPlans[planType].price;
                            let discount = 0;
                            if (coupon.discountType === 'percent') {
                                discount = (base * coupon.discountValue) / 100;
                                if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
                            } else {
                                discount = coupon.discountValue;
                            }
                            discount = Math.min(discount, base);
                            finalAmount = Math.max(0, Math.round((base - discount) * 100) / 100);
                            appliedCoupon = coupon.code;
                        }
                    }
                }
            } catch {}
        }

        const smallestUnitAmount = Math.max(1, Math.round(finalAmount * 100));
        // If final amount is zero or less, complete verification without payment
        if (finalAmount <= 0) {
            console.log('Final amount is zero after coupon. Completing verification without gateway.');
            
            user.isVerified = true;
            user.verifiedPlan = planType;
            user.verifiedAt = new Date();
            await user.save();
            
            try {
                const verifiedUser = new verifiedUserModel({
                    userId: userId,
                    name: user.name,
                    email: user.email,
                    plan: planType,
                    paymentId: 'FREE_COUPON',
                    verifiedAt: user.verifiedAt
                });
                await verifiedUser.save();
            } catch (e) {
                console.error('Failed to write verified user record for free verification:', e.message);
            }
            
            if (appliedCoupon) {
                try {
                    const coupon = await Coupon.findOne({ code: appliedCoupon.toUpperCase().trim() });
                    if (coupon) {
                        coupon.usageCount += 1;
                        await coupon.save();
                    }
                } catch (e) {
                    console.error('Failed to increment coupon usage for free verification:', e.message);
                }
            }
            
            return res.json({
                success: true,
                free: true,
                message: 'Verification completed with 100% discount',
                user: {
                    isVerified: user.isVerified,
                    verifiedPlan: user.verifiedPlan,
                    verifiedAt: user.verifiedAt
                }
            });
        }

        const options = {
            amount: smallestUnitAmount,
            currency: process.env.CURRENCY || 'INR',
            receipt: receipt, // Shorter receipt ID (should be under 40 chars)
            notes: {
                userId: userId.toString(), // Ensure userId is a string
                planType: planType,
                couponCode: appliedCoupon || ''
            }
        };
        
        console.log('Creating Razorpay order with options:', JSON.stringify(options, null, 2));
        console.log('Using Razorpay credentials:');
        console.log('- Key ID:', process.env.RAZORPAY_KEY_ID);
        console.log('- Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
        console.log('- Key Secret length:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0);
        
        // Create order
        try {
            console.log('Calling Razorpay API to create order...');
            const order = await razorpayInstance.orders.create(options);
            console.log('Razorpay order created successfully:', order);
            
            res.json({
                success: true,
                order,
                planDetails: verificationPlans[planType]
            });
            console.log('Response sent to client with order details');
        } catch (razorpayError) {
            console.error('ERROR: Razorpay order creation failed:', razorpayError);
            return res.json({ 
                success: false, 
                message: 'Failed to create payment order', 
                error: razorpayError.message 
            });
        }
        
    } catch (error) {
        console.error('Error creating verification order:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify Razorpay payment for verification
export const verifyVerificationPayment = async (req, res) => {
    try {
        console.log('=== VERIFY VERIFICATION PAYMENT ===');
        console.log('Request received at:', new Date().toISOString());
        console.log('Request body:', req.body);
        console.log('Razorpay instance exists:', !!razorpayInstance);
        
        if (!razorpayInstance) {
            console.error('ERROR: Razorpay instance is not initialized');
            return res.json({ success: false, message: 'Payment gateway not initialized', error: 'RAZORPAY_NOT_INITIALIZED' });
        }
        
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        console.log('Payment verification parameters:');
        console.log('- Order ID:', razorpay_order_id);
        console.log('- Payment ID:', razorpay_payment_id);
        console.log('- Signature:', razorpay_signature ? 'Provided' : 'Missing');
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('ERROR: Missing required payment parameters');
            return res.json({ 
                success: false, 
                message: 'Missing required payment parameters',
                received: { 
                    order_id: !!razorpay_order_id, 
                    payment_id: !!razorpay_payment_id, 
                    signature: !!razorpay_signature 
                }
            });
        }
        
        console.log('Verifying payment signature...');
        console.log('Using key secret:', process.env.RAZORPAY_KEY_SECRET ? 'Available (length: ' + process.env.RAZORPAY_KEY_SECRET.length + ')' : 'Missing');
        
        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        
        console.log('Generated signature:', generatedSignature);
        console.log('Received signature:', razorpay_signature);
        console.log('Signatures match:', generatedSignature === razorpay_signature);
            
        if (generatedSignature !== razorpay_signature) {
            console.error('ERROR: Invalid payment signature');
            return res.json({ success: false, message: 'Invalid payment signature' });
        }
        
        console.log('Signature verified successfully');
        console.log('Fetching order details from Razorpay...');
        
        // Fetch order details
        let orderInfo;
        try {
            orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
            console.log('Order details retrieved:', JSON.stringify(orderInfo, null, 2));
        } catch (error) {
            console.error('ERROR: Failed to fetch order details:', error);
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            return res.json({ 
                success: false, 
                message: 'Failed to fetch order details', 
                error: error.message 
            });
        }
        
        // Check if payment is successful
        console.log('Order status:', orderInfo.status);
        if (orderInfo.status !== 'paid') {
            console.error('ERROR: Payment not completed, status:', orderInfo.status);
            return res.json({ success: false, message: 'Payment not completed' });
        }
        
        console.log('Order notes:', orderInfo.notes);
        const { userId, planType } = orderInfo.notes;
        const appliedCoupon = orderInfo.notes?.couponCode;
        
        console.log('Order notes extracted:');
        console.log('- User ID:', userId);
        console.log('- Plan Type:', planType);
        
        if (!userId || !planType) {
            console.error('ERROR: Missing userId or planType in order notes');
            return res.json({ 
                success: false, 
                message: 'Missing user information in order', 
                notes: orderInfo.notes 
            });
        }
        
        // Update user as verified
        console.log('Looking up user with ID:', userId);
        const user = await userModel.findById(userId);
        if (!user) {
            console.error('ERROR: User not found with ID:', userId);
            return res.json({ success: false, message: 'User not found' });
        }
        
        console.log('User found:', { name: user.name, email: user.email });
        
        // Update user verification status
        console.log('Updating user verification status...');
        user.isVerified = true;
        user.verifiedPlan = planType;
        user.verifiedAt = new Date();
        
        try {
            await user.save();
            console.log('User verification status updated successfully');
        } catch (error) {
            console.error('ERROR: Failed to update user verification status:', error);
            return res.json({ 
                success: false, 
                message: 'Failed to update user verification status', 
                error: error.message 
            });
        }
        
        // Create entry in verified users collection
        console.log('Creating verified user record...');
        const verifiedUser = new verifiedUserModel({
            userId: userId,
            name: user.name,
            email: user.email,
            plan: planType,
            paymentId: razorpay_payment_id,
            verifiedAt: new Date()
        });
        
        try {
            await verifiedUser.save();
            console.log('Verified user record created successfully');
        } catch (error) {
            console.error('ERROR: Failed to create verified user record:', error);
            // Don't return error here, as user is already verified
            // Just log the error and continue
        }
        
        console.log('Verification process completed successfully');
        if (appliedCoupon) {
            try {
                const coupon = await Coupon.findOne({ code: appliedCoupon.toUpperCase().trim() });
                if (coupon) {
                    coupon.usageCount += 1;
                    await coupon.save();
                }
            } catch {}
        }
        res.json({
            success: true,
            message: 'Verification successful',
            user: {
                isVerified: user.isVerified,
                verifiedPlan: user.verifiedPlan,
                verifiedAt: user.verifiedAt
            }
        });
        console.log('Response sent to client');
        
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all verified users (for admin)
export const getAllVerifiedUsers = async (req, res) => {
    try {
        const verifiedUsers = await verifiedUserModel.find().sort({ verifiedAt: -1 });
        res.json({ success: true, verifiedUsers });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Helper function to check if verification is expired
const isVerificationExpired = (verifiedAt, planType) => {
    if (!verifiedAt) return true;
    
    const verificationDate = new Date(verifiedAt);
    const now = new Date();
    
    // Calculate expiration based on plan type
    switch(planType) {
        case 'Free':
            return false; // Free plan never expires
        case 'Starter':
            break;
        case 'Pro':
            verificationDate.setMonth(verificationDate.getMonth() + 3);
            break;
        case 'ProAnnual':
        case 'Elite':
            verificationDate.setFullYear(verificationDate.getFullYear() + 1);
            break;
        // Legacy plan support
        case 'Monthly':
            verificationDate.setMonth(verificationDate.getMonth() + 1);
            break;
        case 'Quarterly':
            verificationDate.setMonth(verificationDate.getMonth() + 3);
            break;
        case 'Yearly':
            verificationDate.setFullYear(verificationDate.getFullYear() + 1);
            break;
        default:
            return true;
    }
    
    return now > verificationDate;
};

// API to check user verification status
export const checkVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Check if verification is expired
        const isExpired = user.isVerified && user.verifiedAt && user.verifiedPlan
            ? isVerificationExpired(user.verifiedAt, user.verifiedPlan)
            : true;
            
        // Update user verification status if expired
        if (isExpired && user.isVerified) {
            user.isVerified = false;
            user.verifiedPlan = undefined;
            user.verifiedAt = undefined;
            await user.save();
        }
        
        res.json({
            success: true,
            isVerified: !isExpired && user.isVerified,
            verifiedPlan: user.verifiedPlan,
            verifiedAt: user.verifiedAt,
            isExpired: isExpired
        });
        
    } catch (error) {
        console.error('Error checking verification status:', error);
        res.json({ success: false, message: error.message });
    }
};
