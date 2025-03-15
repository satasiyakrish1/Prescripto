import express from 'express';
import { createPost, getPosts, addComment, toggleLike } from '../controllers/communityController.js';
import authUser from '../middleware/authUser.js';

const communityRouter = express.Router();

// Protected routes that require authentication and posting permission
communityRouter.post('/create-post', authUser, createPost);
communityRouter.post('/add-comment', authUser, addComment);
communityRouter.post('/toggle-like', authUser, toggleLike);

// Public route to view posts
communityRouter.get('/posts', getPosts);

export default communityRouter;