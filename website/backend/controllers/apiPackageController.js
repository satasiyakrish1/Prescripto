import Razorpay from 'razorpay';
import crypto from 'crypto';
import ApiPackage from '../models/apiPackageModel.js';
import { generateApiKey } from '../utils/apiKeyGenerator.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const packageDetails = {
  starter: {
    price: 9900, // in paise (INR 99)
    callLimit: 1000
  },
  professional: {
    price: 29900, // in paise (INR 299)
    callLimit: 10000
  },
  enterprise: {
    price: 99900, // in paise (INR 999)
    callLimit: 100000
  }
};

export const createOrder = async (req, res) => {
  try {
    const { packageType } = req.body;
    const { price } = packageDetails[packageType];

    const options = {
      amount: price,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageType } = req.body;
    
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const apiKey = generateApiKey();
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);

      const apiPackage = new ApiPackage({
        userId: req.user._id,
        packageType,
        apiKey,
        monthlyCallLimit: packageDetails[packageType].callLimit,
        validUntil,
        transactionId: razorpay_payment_id,
        paymentStatus: 'completed'
      });

      await apiPackage.save();

      res.json({
        success: true,
        apiKey,
        message: 'Payment verified and API package activated'
      });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

export const getUserPackages = async (req, res) => {
  try {
    const packages = await ApiPackage.find({ userId: req.user._id });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
};