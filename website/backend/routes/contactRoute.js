import express from 'express';
import {
    submitContact,
    getAllContacts,
    getContactStats,
    updateContactStatus,
    deleteContact,
    getContactById
} from '../controllers/contactController.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrViewer from '../middleware/authAdminOrViewer.js';

const contactRouter = express.Router();

// Public route - submit contact form
contactRouter.post('/submit', submitContact);

// Admin routes - require authentication (admin or viewer for read-only)
contactRouter.get('/all', authAdminOrViewer, getAllContacts);
contactRouter.get('/stats', authAdminOrViewer, getContactStats);
contactRouter.get('/:id', authAdminOrViewer, getContactById);
contactRouter.patch('/:id', authAdmin, updateContactStatus);
contactRouter.delete('/:id', authAdmin, deleteContact);

export default contactRouter;
