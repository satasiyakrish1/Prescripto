import express from 'express';
import {
  createNotification,
  updateNotification,
  deleteNotification,
  getAdminNotifications,
  getDoctorNotifications,
  markAsRead,
  markAllAsRead,
  adminMarkAsRead,
  adminMarkAllAsRead,
  getUnreadCount,
  getUserNotifications,
  userMarkAsRead,
  userMarkAllAsRead
} from '../controllers/notificationController.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';

const router = express.Router();

// Admin routes (protected with authAdmin middleware)
router.get('/', authAdminOrViewer, getAdminNotifications);
router.post('/create', authAdmin, createNotification);
router.put('/update/:id', authAdmin, updateNotification);
router.delete('/delete/:id', authAdmin, deleteNotification);
router.put('/mark-read/:id', authAdmin, adminMarkAsRead);
router.put('/mark-all-read', authAdmin, adminMarkAllAsRead);

// Doctor routes (protected with authDoctor middleware)
router.get('/doctor', authDoctor, getDoctorNotifications);
router.put('/doctor/mark-read/:id', authDoctor, markAsRead);
router.put('/doctor/mark-all-read', authDoctor, markAllAsRead);
router.get('/doctor/unread-count', authDoctor, getUnreadCount);

// User routes (protected with authUser middleware)
router.get('/user', authUser, getUserNotifications);
router.put('/user/mark-read/:id', authUser, userMarkAsRead);
router.put('/user/mark-all-read', authUser, userMarkAllAsRead);

export default router;
