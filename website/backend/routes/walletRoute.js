/**
 * Wallet Routes
 * 
 * This file defines the routes for wallet pass generation and management.
 */

import express from 'express';
import {
    downloadGoogleWalletPass,
    downloadWalletPass,
    getUserGoogleWalletPasses,
    cancelGoogleWalletPass,
    getPassStatistics
} from '../controllers/walletController.js';

const walletRouter = express.Router();

// Apple Wallet .pkpass download
walletRouter.get('/appointments/:id/pass', downloadWalletPass);

// Google Wallet pass generation and download
walletRouter.get('/appointments/:id/google-pass', downloadGoogleWalletPass);

// Get all Google Wallet passes for a user
walletRouter.get('/users/:userId/passes', getUserGoogleWalletPasses);

// Cancel a Google Wallet pass
walletRouter.delete('/appointments/:appointmentId/cancel', cancelGoogleWalletPass);

// Get pass statistics (admin only - you can add auth middleware here)
walletRouter.get('/statistics', getPassStatistics);

export default walletRouter;