import express from 'express';
import { addStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, getStaffByRole, exportStaffExcel, exportStaffPDF, getReceptionStaff, getReceptionStaffByDepartment } from '../controllers/staffController.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';
import multer from '../middleware/multer.js';

const router = express.Router();

// Staff management routes (protected by admin auth)
router.post('/add', authAdmin, multer.single('image'), addStaff);
router.get('/all', authAdminOrViewer, getAllStaff);
router.get('/:staffId', authAdminOrViewer, getStaffById);
router.put('/:staffId', authAdmin, multer.single('image'), updateStaff);
router.delete('/:staffId', authAdmin, deleteStaff);
router.get('/role/:role', authAdminOrViewer, getStaffByRole);
router.get('/export/excel', authAdminOrViewer, exportStaffExcel);
router.get('/export/pdf', authAdminOrViewer, exportStaffPDF);

// Reception staff routes
router.get('/reception/all', authAdminOrViewer, getReceptionStaff);
router.get('/reception/department/:department', authAdminOrViewer, getReceptionStaffByDepartment);

export default router;
