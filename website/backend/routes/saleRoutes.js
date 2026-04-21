import express from 'express';
import { processSale, getSales, getSaleById, cancelSale, getSalesStats, getRecentSales } from '../controllers/saleController.js';
import authPharmacy from '../middleware/authPharmacy.js';

const saleRouter = express.Router();

// All routes are protected with pharmacy authentication
saleRouter.use(authPharmacy);

// Process a new sale/checkout
saleRouter.post('/checkout', processSale);

// Get all sales with optional filters
saleRouter.get('/', getSales);

// Get sales statistics
saleRouter.get('/stats', getSalesStats);

// Get recent sales
saleRouter.get('/recent', getRecentSales);

// Get a specific sale by ID
saleRouter.get('/:id', getSaleById);

// Cancel a sale
saleRouter.post('/:id/cancel', cancelSale);

export default saleRouter;