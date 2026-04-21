import express from 'express';
import {
    submitTestimonial,
    getDoctorTestimonials,
    getAllTestimonials,
    updateTestimonialStatus,
    deleteTestimonial,
    getUserTestimonials
} from '../controllers/testimonialController.js';
import authUser from '../middleware/authUser.js';
import authAdmin from '../middleware/authAdmin.js';

const testimonialRouter = express.Router();

// Patient routes
testimonialRouter.post('/submit', authUser, submitTestimonial);
testimonialRouter.get('/user/my-testimonials', authUser, getUserTestimonials);
testimonialRouter.get('/doctor/:doctorId', getDoctorTestimonials);

// Admin routes
testimonialRouter.get('/all', authAdmin, getAllTestimonials);
testimonialRouter.put('/:testimonialId/status', authAdmin, updateTestimonialStatus);
testimonialRouter.delete('/:testimonialId', authAdmin, deleteTestimonial);

export default testimonialRouter;