import express from 'express';
import {
    createSale,
    getSales,
    getRecentSales,
    getSaleById,
    updateSaleStatus,
    getSalesAnalytics,
    deleteSale
} from '../controllers/salesController.js';
import authPharmacy from '../middleware/authPharmacy.js';

const salesRouter = express.Router();

// All routes require pharmacy authentication
salesRouter.use(authPharmacy);

// Create a new sale
salesRouter.post('/create', createSale);

// Get all sales with pagination and filters
salesRouter.get('/list', getSales);

// Get recent sales for dashboard
salesRouter.get('/recent', getRecentSales);

// Get sales analytics
salesRouter.get('/analytics', getSalesAnalytics);

// Get sale by ID
salesRouter.get('/:saleId', getSaleById);

// Update sale status
salesRouter.put('/:saleId/status', updateSaleStatus);

// Delete sale (admin only)
salesRouter.delete('/:saleId', deleteSale);

export default salesRouter;
