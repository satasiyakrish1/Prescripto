import express from 'express';
import { createDonation, verifyDonation, getQRCode } from '../controllers/donationController.js';

const donationRouter = express.Router();

// Donation routes
donationRouter.post('/create-donation', createDonation);
donationRouter.post('/verify-donation', verifyDonation);
donationRouter.post('/get-qr-code', getQRCode);

export default donationRouter;