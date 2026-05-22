import feedbackModel from '../models/feedbackModel.js';
import userModel from '../models/userModel.js';

// Submit feedback
const submitFeedback = async (req, res) => {
    try {
        const { type, subject, message } = req.body;
        const userId = req.body.userId;

        // Validation
        if (!type || !subject || !message) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        if (!['suggestion', 'bug', 'feature', 'other'].includes(type)) {
            return res.json({ success: false, message: 'Invalid feedback type' });
        }

        // Get user details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Create feedback
        const feedbackData = {
            userId,
            type,
            subject,
            message,
            userEmail: user.email,
            userName: user.name,
            status: 'issued'
        };

        const newFeedback = new feedbackModel(feedbackData);
        await newFeedback.save();

        res.json({
            success: true,
            message: 'Feedback submitted successfully. Thank you for your input!',
            feedbackId: newFeedback._id
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all feedback (Admin only)
const getAllFeedback = async (req, res) => {
    try {
        const { status, type, search, page = 1, limit = 50 } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by type
        if (type && type !== 'all') {
            query.type = type;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } }
            ];
        }

        const feedback = await feedbackModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'name email')
            .lean();

        const count = await feedbackModel.countDocuments(query);

        res.json({
            success: true,
            feedback,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
    try {
        // General feedback stats (suggestions, feature requests, other)
        const generalTotal = await feedbackModel.countDocuments({ 
            type: { $in: ['suggestion', 'feature', 'other'] } 
        });
        const generalIssued = await feedbackModel.countDocuments({ 
            type: { $in: ['suggestion', 'feature', 'other'] },
            status: 'issued'
        });
        const generalSolved = await feedbackModel.countDocuments({ 
            type: { $in: ['suggestion', 'feature', 'other'] },
            status: 'solved'
        });

        // Bug reports stats
        const bugTotal = await feedbackModel.countDocuments({ type: 'bug' });
        const bugIssued = await feedbackModel.countDocuments({ type: 'bug', status: 'issued' });
        const bugSolved = await feedbackModel.countDocuments({ type: 'bug', status: 'solved' });

        // Feature requests stats
        const featureTotal = await feedbackModel.countDocuments({ type: 'feature' });
        const featureIssued = await feedbackModel.countDocuments({ type: 'feature', status: 'issued' });
        const featureSolved = await feedbackModel.countDocuments({ type: 'feature', status: 'solved' });

        res.json({
            success: true,
            stats: {
                general: {
                    total: generalTotal,
                    pending: generalIssued,
                    resolved: generalSolved
                },
                bugs: {
                    total: bugTotal,
                    pending: bugIssued,
                    resolved: bugSolved
                },
                features: {
                    total: featureTotal,
                    pending: featureIssued,
                    resolved: featureSolved
                }
            }
        });

    } catch (error) {
        console.error('Error fetching feedback stats:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update feedback status
const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, priority } = req.body;

        if (!['issued', 'in-progress', 'solved', 'cancelled'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status' });
        }

        const updateData = { status };

        if (notes) {
            updateData.notes = notes;
        }

        if (priority) {
            updateData.priority = priority;
        }

        // If solving, add resolved timestamp
        if (status === 'solved') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = req.body.adminId; // From auth middleware
        }

        const feedback = await feedbackModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!feedback) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({
            success: true,
            message: 'Feedback status updated successfully',
            feedback
        });

    } catch (error) {
        console.error('Error updating feedback:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;

        const feedback = await feedbackModel.findByIdAndDelete(id);

        if (!feedback) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get single feedback details
const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;

        const feedback = await feedbackModel.findById(id).populate('userId', 'name email phone');

        if (!feedback) {
            return res.json({ success: false, message: 'Feedback not found' });
        }

        res.json({
            success: true,
            feedback
        });

    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    submitFeedback,
    getAllFeedback,
    getFeedbackStats,
    updateFeedbackStatus,
    deleteFeedback,
    getFeedbackById
};
