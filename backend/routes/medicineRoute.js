import express from 'express';
import { searchMedicines, getMedicineById } from '../controllers/medicineController.js';

const medicineRouter = express.Router();

medicineRouter.get('/search', searchMedicines);
medicineRouter.get('/:id', getMedicineById);

export default medicineRouter;