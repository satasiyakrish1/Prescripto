// routes/loginHistoryRoutes.js

import express from 'express';
import { getLoginHistory, storeLoginHistory } from '../controllers/loginHistoryController.js';
import authUser from '../middleware/authUser.js';

const router = express.Router();

// Store login history
router.post('/store', authUser, storeLoginHistory);

// Get user's login history
router.get('/history', authUser, getLoginHistory);

export default router;