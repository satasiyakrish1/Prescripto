import LoginHistory from "../models/loginHistoryModel.js";

// Store login history
export const storeLoginHistory = async (req, res) => {
    try {
        const { userId, userType, ipAddress, deviceInfo, userAgent } = req.body;

        if (!userId || !ipAddress || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const loginRecord = new LoginHistory({
            userId,
            userType,
            ipAddress,
            deviceInfo: deviceInfo || 'Unknown device',
            userAgent: userAgent || 'Unknown user agent'
        });

        await loginRecord.save();

        res.status(201).json({
            success: true,
            message: 'Login history recorded successfully',
            data: loginRecord
        });
    } catch (error) {
        console.error('Error storing login history:', error);
        res.status(500).json({
            success: false,
            message: 'Error storing login history',
            error: error.message
        });
    }
};

// Get user's login history
export const getLoginHistory = async (req, res) => {
    try {
        // Get userId from the auth middleware
        const userId = req.body.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found. Please login again.'
            });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Optional date filters (ISO strings or yyyy-mm-dd)
        const { from, to } = req.query;
        const timeFilter = {};
        if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate)) {
                timeFilter.$gte = fromDate;
            }
        }
        if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate)) {
                // include end-of-day if date without time
                const end = to.length <= 10 ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999) : toDate;
                timeFilter.$lte = end;
            }
        }

        const findFilter = { userId };
        if (Object.keys(timeFilter).length) {
            findFilter.loginTime = timeFilter;
        }

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters'
            });
        }

        // Get total count for pagination
        const totalRecords = await LoginHistory.countDocuments(findFilter);
        const totalPages = Math.ceil(totalRecords / limit);

        // Fetch login history with pagination
        const loginHistory = await LoginHistory.find(findFilter)
            .sort({ loginTime: -1 })
            .skip(skip)
            .limit(limit)
            .select('loginTime ipAddress deviceInfo userAgent location')
            .lean();

        // Format the response
        const formattedHistory = loginHistory.map(record => ({
            _id: record._id,
            loginTime: record.loginTime,
            ipAddress: record.ipAddress || 'Unknown',
            deviceInfo: record.deviceInfo || 'Unknown Device',
            location: record.location || 'Unknown Location',
            userAgent: record.userAgent || 'Unknown'
        }));

        res.json({
            success: true,
            data: formattedHistory,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            }
        });

    } catch (error) {
        console.error('Error in getLoginHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};