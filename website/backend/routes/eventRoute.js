import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authAdmin from '../middleware/authAdmin.js';
import authUser from '../middleware/authUser.js';
import {
    // Admin controllers
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventParticipants,
    addParticipantManually,
    updateParticipant,
    deleteParticipant,
    exportParticipants,
    getEventAnalytics,
    
    // User controllers
    getPublicEvents,
    getPublicEventById,
    rsvpForEvent,
    createEventPaymentOrder,
    verifyEventPayment,
    createStripeCheckout,
    verifyStripePayment,
    cancelRsvp,
    addToCalendar,
    getUserRsvps
} from '../controllers/eventController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'event-banners');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (increased from 5MB)
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Admin routes
router.post('/admin', authAdmin, upload.single('banner'), createEvent);
router.get('/admin', authAdmin, getAllEvents);
router.get('/admin/:id', authAdmin, getEventById);
router.put('/admin/:id', authAdmin, upload.single('banner'), updateEvent);
router.delete('/admin/:id', authAdmin, deleteEvent);

// Participant management routes
router.get('/admin/:id/participants', authAdmin, getEventParticipants);
router.post('/admin/:id/participants', authAdmin, addParticipantManually);
router.put('/admin/:id/participants/:participantId', authAdmin, updateParticipant);
router.delete('/admin/:id/participants/:participantId', authAdmin, deleteParticipant);
router.get('/admin/:id/export', authAdmin, exportParticipants);
router.get('/admin/:id/analytics', authAdmin, getEventAnalytics);

// Public routes
router.get('/', getPublicEvents);
router.get('/:id', getPublicEventById);

// User authenticated routes
router.post('/:id/rsvp', authUser, rsvpForEvent);
router.post('/:id/payment/razorpay', authUser, createEventPaymentOrder);
router.post('/:id/payment/razorpay/verify', authUser, verifyEventPayment);
router.post('/:id/payment/stripe', authUser, createStripeCheckout);
router.post('/:id/payment/stripe/verify', authUser, verifyStripePayment);
router.post('/:id/rsvp/cancel', authUser, cancelRsvp);
router.post('/:id/calendar', authUser, addToCalendar);
router.get('/user/rsvps', authUser, getUserRsvps);

export default router;