import express from 'express';
import { getAllDoctors } from '../controllers/doctorController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (protected with isAdmin middleware)
router.get('/', isAuthenticated, isAdmin, getAllDoctors);

export default router; 