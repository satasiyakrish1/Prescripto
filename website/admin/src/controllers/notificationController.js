import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

// Admin Controllers
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, recipientModel } = req.body;
    
    // Create notification with recipients array
    const notification = new Notification({
      title,
      message,
      type,
      sender: 'Admin',
      recipients: recipients.map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false
      })),
      recipientModel,
      createdBy: req.user._id // Assuming you have user info in req.user from auth middleware
    });

    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update only allowed fields
    notification.title = title || notification.title;
    notification.message = message || notification.message;
    notification.type = type || notification.type;
    notification.updatedAt = new Date();

    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Doctor Controllers
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    
    const notifications = await Notification.find({
      'recipients.userId': userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // From auth middleware

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        'recipients.userId': userId
      },
      {
        $set: {
          'recipients.$.isRead': true
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware

    await Notification.updateMany(
      {
        'recipients.userId': userId,
        'recipients.isRead': false
      },
      {
        $set: {
          'recipients.$[elem].isRead': true
        }
      },
      {
        arrayFilters: [{ 'elem.userId': userId }]
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Common Controllers
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware

    const count = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.isRead': false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
}; 