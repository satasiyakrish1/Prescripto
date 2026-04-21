import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import authUser from '../middleware/authUser.js';
import { createCoupon, listCoupons, toggleCouponActive, validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

router.post('/', authAdmin, createCoupon);
router.get('/', authAdmin, listCoupons);
router.post('/:id/toggle', authAdmin, toggleCouponActive);
router.post('/validate', authUser, validateCoupon);

export default router;
