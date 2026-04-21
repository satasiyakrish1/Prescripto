import express from 'express';
import {
    submitFeedback,
    getAllFeedback,
    getFeedbackStats,
    updateFeedbackStatus,
    deleteFeedback,
    getFeedbackById
} from '../controllers/feedbackController.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';

const feedbackRouter = express.Router();

// User routes - require user authentication
feedbackRouter.post('/submit', authUser, submitFeedback);

// Admin routes - require admin or viewer authentication for read-only
feedbackRouter.get('/all', authAdminOrViewer, getAllFeedback);
feedbackRouter.get('/stats', authAdminOrViewer, getFeedbackStats);
feedbackRouter.get('/:id', authAdminOrViewer, getFeedbackById);
feedbackRouter.patch('/:id', authAdmin, updateFeedbackStatus);
feedbackRouter.delete('/:id', authAdmin, deleteFeedback);

export default feedbackRouter;
