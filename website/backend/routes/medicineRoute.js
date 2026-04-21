import express from 'express';
import { searchMedicines, getMedicineById, getInventory, getInventoryStats, addMedicine, updateMedicine, updateStock, deleteMedicine, checkInteractions, getMedicineCategories, generateMedicineBrief } from '../controllers/medicineController.js';
import authPharmacy from '../middleware/authPharmacy.js';
import authAdminOrPharmacy from '../middleware/authAdminOrPharmacy.js';

const medicineRouter = express.Router();

// Public medicine search routes
medicineRouter.get('/search', searchMedicines);
medicineRouter.get('/:id', getMedicineById);
medicineRouter.post('/check-interactions', checkInteractions);
medicineRouter.post('/generate-brief', generateMedicineBrief);

// Protected pharmacy/admin inventory routes
medicineRouter.get('/inventory', authAdminOrPharmacy, getInventory);
medicineRouter.get('/stats/overview', authAdminOrPharmacy, getInventoryStats);
medicineRouter.get('/categories', authPharmacy, getMedicineCategories);
medicineRouter.post('/add', authAdminOrPharmacy, addMedicine);
medicineRouter.put('/:id', authAdminOrPharmacy, updateMedicine);
medicineRouter.patch('/:id/stock', authAdminOrPharmacy, updateStock);
medicineRouter.delete('/:id', authAdminOrPharmacy, deleteMedicine);

export default medicineRouter;