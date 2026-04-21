import express from 'express';
import { getAuthUrl, handleCallback, getStatus, disconnect } from '../controllers/googleTasksController.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

router.get('/auth-url', authAdmin, getAuthUrl);
router.get('/callback', handleCallback); // Google redirects here
router.get('/status', authAdmin, getStatus);
router.post('/disconnect', authAdmin, disconnect);

export default router;
