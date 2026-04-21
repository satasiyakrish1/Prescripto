import express from 'express';
import userRoutes from './userRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import adminRoutes from './adminRoutes.js';
import whatsappWebhooks from './whatsappWebhooks.js';
import loginHistoryRoutes from './loginHistoryRoutes.js';
import settingsRoutes from './settingsRoute.js';

const router = express.Router();

// Main API routes
router.use('/user', userRoutes);
router.use('/doctor', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/login-history', loginHistoryRoutes);
router.use('/settings', settingsRoutes);

// WhatsApp webhook routes
router.use('/whatsapp-webhooks', whatsappWebhooks);

export default router;