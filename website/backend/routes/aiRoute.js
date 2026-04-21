import express from 'express';
import { businessChat, clearCache, getStatus } from '../controllers/aiController.js';
import authAdmin from '../middleware/authAdmin.js';

const aiRouter = express.Router();

/**
 * AI Business Chat Routes
 * 
 * POST /api/ai/business-chat - Main AI chat endpoint
 * GET /api/ai/status - Get AI service status
 * POST /api/ai/clear-cache - Clear AI cache (admin only)
 */

// Main business chat endpoint - accessible to authenticated users
// You can add authAdmin, authDoctor, or authPharmacy middleware here if needed
aiRouter.post('/business-chat', businessChat);

// Status endpoint - check if AI service is working
aiRouter.get('/status', getStatus);

// Admin-only endpoint to clear cache
aiRouter.post('/clear-cache', authAdmin, clearCache);

export default aiRouter;
