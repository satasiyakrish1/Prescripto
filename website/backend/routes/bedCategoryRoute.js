import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import {
    createBedCategory,
    getBedCategories,
    updateBedCategory,
    deleteBedCategory
} from '../controllers/bedCategoryController.js';

const router = express.Router();

router.get('/', authAdmin, getBedCategories);
router.post('/', authAdmin, createBedCategory);
router.put('/:id', authAdmin, updateBedCategory);
router.delete('/:id', authAdmin, deleteBedCategory);

export default router;

