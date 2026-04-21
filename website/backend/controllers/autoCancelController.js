import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import scheduler from '../services/appointmentScheduler.js';

/**
 * Get all auto-cancelled appointments (Admin only)
 */
export const getAutoCancelledAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, startDate, endDate } = req.query;

        const query = { autoCancelled: true };

        // Filter by user if provided
        if (userId) {
            query.userId = userId;
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.autoCancelledAt = {};
            if (startDate) {
                query.autoCancelledAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.autoCancelledAt.$lte = new Date(endDate);
            }
        }

        const appointments = await appointmentModel
            .find(query)
            .sort({ autoCancelledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await appointmentModel.countDocuments(query);

        res.json({
            success: true,
            appointments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('[AutoCancel] Error fetching auto-cancelled appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching auto-cancelled appointments',
            error: error.message
        });
    }
};

/**
 * Get users with booking blocks (Admin only)
 */
export const getBlockedUsers = async (req, res) => {
    try {
        const now = new Date();

        const blockedUsers = await userModel
            .find({
                bookingBlockedUntil: { $gt: now }
            })
            .select('name email phone autoCancelCount bookingBlockedUntil lastAutoCancelDate')
            .sort({ bookingBlockedUntil: -1 })
            .lean();

        res.json({
            success: true,
            users: blockedUsers,
            count: blockedUsers.length
        });

    } catch (error) {
        console.error('[AutoCancel] Error fetching blocked users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching blocked users',
            error: error.message
        });
    }
};

/**
 * Manually unblock a user (Admin only)
 */
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.bookingBlockedUntil = null;
        user.autoCancelCount = 0;
        await user.save();

        res.json({
            success: true,
            message: 'User unblocked successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('[AutoCancel] Error unblocking user:', error);
        res.status(500).json({
            success: false,
            message: 'Error unblocking user',
            error: error.message
        });
    }
};

/**
 * Get auto-cancel statistics (Admin only)
 */
export const getAutoCancelStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.autoCancelledAt = {};
            if (startDate) {
                dateFilter.autoCancelledAt.$gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.autoCancelledAt.$lte = new Date(endDate);
            }
        }

        const totalAutoCancelled = await appointmentModel.countDocuments({
            autoCancelled: true,
            ...dateFilter
        });

        const currentlyBlocked = await userModel.countDocuments({
            bookingBlockedUntil: { $gt: new Date() }
        });

        const usersWithAutoCancels = await userModel.countDocuments({
            autoCancelCount: { $gt: 0 }
        });

        // Get auto-cancel distribution by reason
        const reasonDistribution = await appointmentModel.aggregate([
            {
                $match: {
                    autoCancelled: true,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$autoCancelReason',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalAutoCancelled,
                currentlyBlocked,
                usersWithAutoCancels,
                reasonDistribution
            }
        });

    } catch (error) {
        console.error('[AutoCancel] Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

/**
 * Manually trigger auto-cancellation job (Admin only, for testing)
 */
export const triggerAutoCancelJob = async (req, res) => {
    try {
        console.log('[AutoCancel] Manual trigger requested by admin');
        
        const result = await scheduler.runNow();

        res.json({
            success: true,
            message: 'Auto-cancellation job executed',
            result
        });

    } catch (error) {
        console.error('[AutoCancel] Error triggering job:', error);
        res.status(500).json({
            success: false,
            message: 'Error triggering auto-cancellation job',
            error: error.message
        });
    }
};

/**
 * Get user's auto-cancel history
 */
export const getUserAutoCancelHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await userModel
            .findById(userId)
            .select('name email autoCancelCount bookingBlockedUntil lastAutoCancelDate')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const autoCancelledAppointments = await appointmentModel
            .find({
                userId,
                autoCancelled: true
            })
            .sort({ autoCancelledAt: -1 })
            .lean();

        const now = new Date();
        const isBlocked = user.bookingBlockedUntil && new Date(user.bookingBlockedUntil) > now;

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                autoCancelCount: user.autoCancelCount || 0,
                isBlocked,
                bookingBlockedUntil: user.bookingBlockedUntil,
                lastAutoCancelDate: user.lastAutoCancelDate
            },
            appointments: autoCancelledAppointments,
            total: autoCancelledAppointments.length
        });

    } catch (error) {
        console.error('[AutoCancel] Error fetching user history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user auto-cancel history',
            error: error.message
        });
    }
};
