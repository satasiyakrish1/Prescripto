import express from 'express';
import { 
    getOverview, 
    getCategoryStats, 
    getStockStatus, 
    getMonthlyReport, 
    getTopMedicines,
    getSalesByTime,
    getProfitMargins 
} from '../controllers/analysisController.js';
import authPharmacy from '../middleware/authPharmacy.js';

const analysisRouter = express.Router();

// Analytics routes - all protected with pharmacy authentication
analysisRouter.get("/overview", authPharmacy, getOverview);
analysisRouter.get("/category-stats", authPharmacy, getCategoryStats);
analysisRouter.get("/stock-status", authPharmacy, getStockStatus);
analysisRouter.get("/monthly-report", authPharmacy, getMonthlyReport);
analysisRouter.get("/top-medicines", authPharmacy, getTopMedicines);
analysisRouter.get("/sales-by-time", authPharmacy, getSalesByTime);
analysisRouter.get("/profit-margins", authPharmacy, getProfitMargins);

export default analysisRouter;