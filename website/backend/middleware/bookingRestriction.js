import userModel from '../models/userModel.js';

/**
 * Middleware to check if user is blocked from booking appointments
 */
export const checkBookingRestriction = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Fetch user data
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has a booking block
        if (user.bookingBlockedUntil) {
            const now = new Date();
            const blockUntil = new Date(user.bookingBlockedUntil);

            // If block is still active
            if (blockUntil > now) {
                const daysRemaining = Math.ceil((blockUntil - now) / (1000 * 60 * 60 * 24));
                const blockDate = blockUntil.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata'
                });

                return res.status(403).json({
                    success: false,
                    blocked: true,
                    message: `Your booking privileges are temporarily suspended due to multiple no-shows. You can book again after ${blockDate}.`,
                    blockUntil: blockUntil.toISOString(),
                    daysRemaining,
                    autoCancelCount: user.autoCancelCount
                });
            } else {
                // Block has expired, clear it
                user.bookingBlockedUntil = null;
                user.autoCancelCount = 0; // Reset counter
                await user.save();
                
                console.log(`[Booking] Block expired for user ${userId}, privileges restored`);
            }
        }

        // User is not blocked, proceed
        next();

    } catch (error) {
        console.error('[Booking] Error checking booking restriction:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking booking restrictions',
            error: error.message
        });
    }
};

/**
 * Get user's booking status (for frontend display)
 */
export const getBookingStatus = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const user = await userModel.findById(userId).select('autoCancelCount bookingBlockedUntil lastAutoCancelDate');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const now = new Date();
        const isBlocked = user.bookingBlockedUntil && new Date(user.bookingBlockedUntil) > now;

        let response = {
            success: true,
            autoCancelCount: user.autoCancelCount || 0,
            isBlocked,
            canBook: !isBlocked
        };

        if (isBlocked) {
            const blockUntil = new Date(user.bookingBlockedUntil);
            const daysRemaining = Math.ceil((blockUntil - now) / (1000 * 60 * 60 * 24));
            
            response.blockUntil = blockUntil.toISOString();
            response.daysRemaining = daysRemaining;
            response.blockDate = blockUntil.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Asia/Kolkata'
            });
        }

        if (user.lastAutoCancelDate) {
            response.lastAutoCancelDate = user.lastAutoCancelDate.toISOString();
        }

        return res.json(response);

    } catch (error) {
        console.error('[Booking] Error getting booking status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting booking status',
            error: error.message
        });
    }
};
