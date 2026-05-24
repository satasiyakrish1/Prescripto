import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';
import optionalAuth from '../middleware/optionalAuth.js';
import multer from 'multer';
import path from 'path';
import {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    toggleUserPostingPermission,
    incrementViews,
    getBlogStats,
    getCategories,
    toggleLike,
    analyzePost,
    addComment,
    deleteComment
} from '../controllers/blogController.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.env.UPLOADS_DIR || 'uploads', 'blog-images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

const router = express.Router();

// Public routes (with optional auth for admin features)
router.get('/posts', optionalAuth, getAllPosts);
router.get('/posts/:id', optionalAuth, getPostById);
router.post('/posts/:id/views', incrementViews);
router.post('/posts/:id/like', optionalAuth, toggleLike);
router.post('/posts/:id/comments', optionalAuth, addComment);
router.delete('/posts/:id/comments/:commentId', optionalAuth, deleteComment);
router.get('/posts/:id/analyze', optionalAuth, analyzePost);
router.get('/categories', getCategories);

// Protected routes (admin only)
router.get('/stats', authAdminOrViewer, getBlogStats);
router.post('/posts', authAdmin, upload.single('featuredImage'), createPost);
router.put('/posts/:id', authAdmin, upload.single('featuredImage'), updatePost);
router.delete('/posts/:id', authAdmin, deletePost);
router.post('/toggle-posting-permission', authAdmin, toggleUserPostingPermission);

// Error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }
    next(err);
});

export default router;
