import express from 'express';
import {
    loginAdmin,
    getAllSubscribers,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    downloadAppointmentsCSV,
    removeDoctor,
    downloadServerLogs,
    getAdminLoginHistory, // Added getAdminLoginHistory
    getAllUsers,
    sendUserNotification
} from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import { getWardOccupancyStats, getStaffStats, getMedicineInventoryStats } from '../controllers/statisticsController.js';
import { getAllPosts, getPostById, createPost, updatePost, deletePost, toggleUserPostingPermission } from '../controllers/blogController.js';
import staffRouter from './staffRoute.js';
import receptionRouter from './receptionRoute.js';
import vehicleRouter from './vehicleRoute.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';
import { authRateLimiter, csrfProtection } from '../security/security.js';
import adminModel from '../models/adminModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { appointmentDetailsAdmin } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Ensure upload directories exist
const uploadsDir = 'uploads';
const blogImagesDir = path.join(uploadsDir, 'blog-images');
const doctorImagesDir = path.join(uploadsDir, 'doctor-images');

[uploadsDir, blogImagesDir, doctorImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for different types of uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine the destination based on the route
        const dest = req.path.includes('/blog') ? blogImagesDir : doctorImagesDir;
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Protect admin login with stricter rate limit
adminRouter.post("/login", authRateLimiter, loginAdmin)

// get all subscribers
adminRouter.get("/subscribers", authAdminOrViewer, getAllSubscribers)

// Configure multer for profile images
const profileUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = 'uploads/profile-images';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Admin profile routes
adminRouter.get('/profile', authAdmin, getAdminProfile)
adminRouter.put('/profile', authAdmin, updateAdminProfile)
adminRouter.put('/change-password', authAdmin, changeAdminPassword)
adminRouter.post('/upload-profile-image', authAdmin, profileUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const adminEmail = process.env.ADMIN_EMAIL.trim();
        const imageUrl = `/uploads/profile-images/${req.file.filename}`;

        // Update admin profile with new image URL
        await adminModel.findOneAndUpdate(
            { email: adminEmail },
            { $set: { image: imageUrl } },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image'
        });
    }
});

// Staff management routes
adminRouter.use('/staff', staffRouter)
// Reception desk routes
adminRouter.use('/reception', receptionRouter)
// Vehicle management routes
adminRouter.use('/vehicle', vehicleRouter)

adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdminOrViewer, appointmentsAdmin)
adminRouter.get("/appointments/:id", authAdminOrViewer, appointmentDetailsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdminOrViewer, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdminOrViewer, adminDashboard)
adminRouter.get("/download-appointments", authAdmin, downloadAppointmentsCSV)
adminRouter.post('/remove-doctor', authAdmin, removeDoctor)

// Enhanced dashboard statistics routes
adminRouter.get('/statistics/ward-occupancy', authAdminOrViewer, getWardOccupancyStats)
adminRouter.get('/statistics/staff', authAdminOrViewer, getStaffStats)
adminRouter.get('/statistics/inventory', authAdminOrViewer, getMedicineInventoryStats)

// Blog management routes
// Blog management routes - MOVED TO blogRoute.js
// adminRouter.get('/blog', authAdmin, getAllPosts);
// adminRouter.get('/blog/:id', authAdmin, getPostById);
// adminRouter.post('/blog', authAdmin, upload.single('featuredImage'), createPost);
// adminRouter.put('/blog/:id', authAdmin, upload.single('featuredImage'), updatePost);
// adminRouter.delete('/blog/:id', authAdmin, deletePost);
// adminRouter.post('/blog/toggle-posting-permission', authAdmin, toggleUserPostingPermission);

// Server logs download route
adminRouter.get('/logs', authAdmin, downloadServerLogs);

// Admin login history route
adminRouter.get('/login-history', authAdmin, getAdminLoginHistory);

// User management and notification routes
adminRouter.get('/users', authAdmin, getAllUsers);
adminRouter.post('/send-user-notification', authAdmin, sendUserNotification);

export default adminRouter;
