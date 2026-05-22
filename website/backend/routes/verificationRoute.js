import express from 'express';
import { getVerificationPlans, createVerificationOrder, verifyVerificationPayment, getAllVerifiedUsers, checkVerificationStatus } from '../controllers/verificationController.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';

const verificationRouter = express.Router();

// Public routes
verificationRouter.get("/plans", getVerificationPlans);

// User authenticated routes
verificationRouter.post("/create-order", authUser, createVerificationOrder);
verificationRouter.post("/verify-payment", authUser, verifyVerificationPayment);
verificationRouter.get("/status", authUser, checkVerificationStatus);

// Admin authenticated routes
verificationRouter.get("/admin/users", authAdmin, getAllVerifiedUsers);

export default verificationRouter;