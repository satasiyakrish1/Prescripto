import express from 'express';
import {
  createNotification,
  updateNotification,
  deleteNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';
import { isAuthenticated, isAdmin, isDoctor } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (protected with isAdmin middleware)
router.post('/create', isAuthenticated, isAdmin, createNotification);
router.put('/update/:id', isAuthenticated, isAdmin, updateNotification);
router.delete('/delete/:id', isAuthenticated, isAdmin, deleteNotification);

// Doctor routes (protected with isDoctor middleware)
router.get('/doctor', isAuthenticated, isDoctor, getNotifications);
router.put('/mark-read/:id', isAuthenticated, isDoctor, markAsRead);
router.put('/mark-all-read', isAuthenticated, isDoctor, markAllAsRead);

// Common routes (protected with general authentication)
router.get('/unread-count', isAuthenticated, getUnreadCount);

export default router; 