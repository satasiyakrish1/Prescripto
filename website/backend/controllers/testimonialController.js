import mongoose from 'mongoose';
import testimonialModel from '../models/testimonialModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';

// Helper function to get user by ID
const getUserById = async (userId) => {
    try {
        // Try userModel first (lowercase 'user')
        let user = await userModel.findById(userId);
        if (user) return user;
        
        // If not found, try with User model (capital 'U') if it exists
        const UserModel = mongoose.models.User || mongoose.models.user;
        if (UserModel) {
            user = await UserModel.findById(userId);
        }
        
        return user;
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
};

// Submit a new testimonial
export const submitTestimonial = async (req, res) => {
    try {
        const { doctorId, content, rating, userId: bodyUserId } = req.body;
        // Get userId from either req.body.userId (set by authUser middleware) or req.userId
        const userId = bodyUserId || req.userId || req.user?._id;

        console.log('Submit testimonial request:', { userId, doctorId, rating });

        // Validate userId exists
        if (!userId) {
            console.error('No userId found in request');
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication failed. Please login again.' 
            });
        }

        // Validate required fields
        if (!doctorId || !content || !rating) {
            return res.status(400).json({ 
                success: false, 
                message: 'Doctor ID, content, and rating are required' 
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating must be between 1 and 5' 
            });
        }

        // Get patient name from user model
        const user = await getUserById(userId);
        if (!user) {
            console.error('User not found with ID:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found. Please ensure you are logged in correctly.' 
            });
        }
        
        // Ensure user has a name
        if (!user.name) {
            return res.status(400).json({ 
                success: false, 
                message: 'User profile incomplete. Please update your profile with your name.' 
            });
        }

        // Verify doctor exists
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Doctor not found' 
            });
        }

        // Check if user has completed appointment with this doctor
        const hasAppointment = await appointmentModel.findOne({
            userId: userId,
            docId: doctorId,
            isCompleted: true
        });

        if (!hasAppointment) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only review doctors you have had appointments with' 
            });
        }

        // Check if user already submitted a testimonial for this doctor
        const existingTestimonial = await testimonialModel.findOne({
            doctor: doctorId,
            patient: userId
        });

        if (existingTestimonial) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already submitted a review for this doctor' 
            });
        }

        const testimonial = new testimonialModel({
            doctor: doctorId,
            patient: userId,
            patientName: user.name,
            content,
            rating
        });

        await testimonial.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Testimonial submitted successfully and is pending approval', 
            testimonial 
        });
    } catch (error) {
        console.error('Error submitting testimonial:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting testimonial', 
            error: error.message 
        });
    }
};

// Get testimonials for a specific doctor
export const getDoctorTestimonials = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const testimonials = await testimonialModel
            .find({ doctor: doctorId, status: 'approved' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('patient', 'name');

        const total = await testimonialModel.countDocuments({ 
            doctor: doctorId, 
            status: 'approved' 
        });

        // Calculate average rating
        const ratingStats = await testimonialModel.aggregate([
            { $match: { doctor: doctorId, status: 'approved' } },
            { 
                $group: { 
                    _id: null, 
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                } 
            }
        ]);

        res.status(200).json({
            success: true,
            results: testimonials.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating.toFixed(1) : 0,
            totalReviews: ratingStats.length > 0 ? ratingStats[0].totalReviews : 0,
            data: testimonials
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching testimonials', 
            error: error.message 
        });
    }
};

// Get user's testimonials
export const getUserTestimonials = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication failed. Please login again.' 
            });
        }
        
        const testimonials = await testimonialModel
            .find({ patient: userId })
            .sort({ createdAt: -1 })
            .populate('doctor', 'name speciality image');

        res.status(200).json({
            success: true,
            results: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        console.error('Error fetching user testimonials:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching testimonials', 
            error: error.message 
        });
    }
};

// Admin: Get all testimonials
export const getAllTestimonials = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status || 'all';

        let query = {};
        if (status !== 'all') {
            query.status = status;
        }

        const testimonials = await testimonialModel
            .find(query)
            .populate('doctor', 'name speciality')
            .populate('patient', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await testimonialModel.countDocuments(query);

        res.status(200).json({
            success: true,
            results: testimonials.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: testimonials
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching testimonials', 
            error: error.message 
        });
    }
};

// Admin: Update testimonial status (approve/reject)
export const updateTestimonialStatus = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Must be approved, rejected, or pending' 
            });
        }

        const testimonial = await testimonialModel.findByIdAndUpdate(
            testimonialId,
            { 
                status,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('doctor', 'name').populate('patient', 'name');

        if (!testimonial) {
            return res.status(404).json({ 
                success: false, 
                message: 'Testimonial not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Testimonial ${status} successfully`, 
            testimonial 
        });
    } catch (error) {
        console.error('Error updating testimonial status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating testimonial status', 
            error: error.message 
        });
    }
};

// Admin: Delete testimonial
export const deleteTestimonial = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const testimonial = await testimonialModel.findByIdAndDelete(testimonialId);

        if (!testimonial) {
            return res.status(404).json({ 
                success: false, 
                message: 'Testimonial not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Testimonial deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting testimonial', 
            error: error.message 
        });
    }
};