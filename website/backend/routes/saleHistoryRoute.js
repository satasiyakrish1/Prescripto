import express from 'express';
import {
    getSales,
    getSaleById,
    updateSaleStatus
} from '../controllers/saleHistoryController.js';
import authPharmacy from '../middleware/authPharmacy.js';

const saleHistoryRouter = express.Router();

// All routes require pharmacy authentication
saleHistoryRouter.use(authPharmacy);

// Get all sales with pagination and filters
saleHistoryRouter.get('/', getSales);

// Get sale by ID
saleHistoryRouter.get('/:id', getSaleById);

// Update sale status
saleHistoryRouter.put('/:id/status', updateSaleStatus);

export default saleHistoryRouter;