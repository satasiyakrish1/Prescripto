import express from 'express';
import { processCashPayment } from '../controllers/cashPaymentController.js';
import authPharmacy from '../middleware/authPharmacy.js';

const router = express.Router();

// Cash payment route with pharmacy authentication
router.post('/cash', authPharmacy, processCashPayment);

export default router;