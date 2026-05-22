import express from 'express';
import { createOrder, verifyPayment, getUserPackages } from '../controllers/apiPackageController.js';
import authUser from '../middleware/authUser.js';

const router = express.Router();

router.post('/create-order', authUser, createOrder);
router.post('/verify-payment', authUser, verifyPayment);
router.get('/user-packages', authUser, getUserPackages);

export default router;