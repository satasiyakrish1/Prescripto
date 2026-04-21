/**
 * Statistics Routes
 * 
 * This file defines the routes for retrieving application statistics
 */

import express from 'express';
import { getStatistics, getSpecialtyDistribution } from '../controllers/statisticsController.js';

const router = express.Router();

// Get all statistics
router.get('/', getStatistics);

// Get specialty distribution
router.get('/specialty-distribution', getSpecialtyDistribution);

export default router;