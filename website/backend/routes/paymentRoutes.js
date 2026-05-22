import express from 'express';
import { createRazorpayOrder, verifyRazorpay, createStripeCheckout, verifyStripe, createZohoPaymentOrder, createPharmacyRazorpayOrder, verifyPharmacyRazorpayPayment, createPharmacyStripeSession } from '../controllers/paymentController.js';
import { verifyPharmacyToken } from '../middleware/authMiddleware.js';
import authPharmacy from '../middleware/authPharmacy.js';

const router = express.Router();

// Razorpay routes (legacy)
router.post('/razorpay/create', verifyPharmacyToken, createRazorpayOrder);
router.post('/razorpay/verify', verifyPharmacyToken, verifyRazorpay);

// Razorpay routes for pharmacy sales
router.post('/razorpay/create-order', authPharmacy, createPharmacyRazorpayOrder);
router.post('/razorpay/verify', authPharmacy, verifyPharmacyRazorpayPayment);

// Stripe routes (legacy)
router.post('/stripe/create', verifyPharmacyToken, createStripeCheckout);
router.post('/stripe/verify', verifyPharmacyToken, verifyStripe);

// Stripe routes for pharmacy sales
router.post('/stripe/create-session', authPharmacy, createPharmacyStripeSession);
router.post('/stripe/verify', authPharmacy, verifyStripe);

// Zoho Payments
router.post('/create', createZohoPaymentOrder);

export default router;