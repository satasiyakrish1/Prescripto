import express from 'express';
import { loginPharmacy, pharmacyDashboard, pharmacyProfile, updatePharmacyProfile, completeSale, cancelSale, getInventoryStats, getAnalyticsOverview } from '../controllers/pharmacyController.js';
import { getInventory } from '../controllers/medicineController.js';
import authPharmacy from '../middleware/authPharmacy.js';
import { authRateLimiter } from '../security/security.js';

const pharmacyRouter = express.Router();

// Pharmacy authentication routes
// Throttle pharmacy login attempts
pharmacyRouter.post("/login", authRateLimiter, loginPharmacy);

// Protected pharmacy routes
pharmacyRouter.get("/dashboard", authPharmacy, pharmacyDashboard);
pharmacyRouter.get("/profile", authPharmacy, pharmacyProfile);
pharmacyRouter.post("/update-profile", authPharmacy, updatePharmacyProfile);

// Sales management routes
pharmacyRouter.post("/complete-sale", authPharmacy, completeSale);
pharmacyRouter.post("/cancel-sale", authPharmacy, cancelSale);

// Inventory statistics route
pharmacyRouter.get("/inventory-stats", authPharmacy, getInventoryStats);

// Analytics overview route
pharmacyRouter.get("/analytics-overview", authPharmacy, getAnalyticsOverview);

// Medicine search route for pharmacy
pharmacyRouter.get("/medicines/search", authPharmacy, getInventory);

export default pharmacyRouter;