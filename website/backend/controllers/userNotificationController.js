import UserNotification from '../models/userNotificationModel.js';

// Get active notifications (not archived)
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.body.userId; // Extracted from auth middleware
        const notifications = await UserNotification.find({ userId, isArchived: false })
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get archived notifications
export const getArchivedNotifications = async (req, res) => {
    try {
        const userId = req.body.userId;
        const notifications = await UserNotification.find({ userId, isArchived: true })
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching archived notifications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.body.userId;

        await UserNotification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true }
        );

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Archive notification
export const archiveNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.body.userId;

        await UserNotification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isArchived: true }
        );

        res.json({ success: true, message: 'Notification archived' });
    } catch (error) {
        console.error('Error archiving notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.body.userId;

        await UserNotification.findOneAndDelete({ _id: notificationId, userId });

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
