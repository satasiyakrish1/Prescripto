import express from 'express';
import { createPost, getPosts, addComment, toggleLike, deletePost, togglePostingPermission } from '../controllers/communityController.js';
import { authUser, authAdmin } from '../middleware/authMiddleware.js';

const communityRouter = express.Router();

// Protected routes that require authentication and posting permission
communityRouter.post('/create-post', authUser, createPost);
communityRouter.post('/add-comment', authUser, addComment);
communityRouter.post('/toggle-like', authUser, toggleLike);

// Public route to view posts
communityRouter.get('/posts', getPosts);

// Admin-only routes for blog management
communityRouter.delete('/posts/:postId', authAdmin, deletePost);
communityRouter.post('/toggle-posting-permission', authAdmin, togglePostingPermission);

export default communityRouter;