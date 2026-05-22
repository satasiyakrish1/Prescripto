import Notification from '../models/notificationModel.js';
import mongoose from 'mongoose';

// Admin Controllers
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, recipientModel, sendToAll } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create notification with recipients array
    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      sender: 'Admin',
      recipients: recipients.map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false
      })),
      recipientModel,
      createdBy: req.admin.id // From auth middleware
    });

    await notification.save();
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
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
    console.error('Error updating notification:', error);
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
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Fixed: Separate admin and doctor notification fetching
export const getAdminNotifications = async (req, res) => {
  try {
    console.log('Admin fetching notifications:', req.admin.id);
    
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .lean();
    
    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

export const getDoctorNotifications = async (req, res) => {
  try {
    // Fixed: Use consistent doctor ID extraction
    const doctorId = req.doctor.id || req.doctor._id;
    console.log('Doctor fetching notifications:', doctorId);
    
    const notifications = await Notification.find({
      'recipients.userId': doctorId
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .lean();
    
    res.status(200).json({
      success: true,
      notifications,
      doctorId: doctorId.toString()
    });
  } catch (error) {
    console.error('Error fetching doctor notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// User notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({
      'recipients.userId': userId
    })
      .sort({ createdAt: -1 })
      .populate({ path: 'createdBy', select: 'name email' })
      .lean();

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

export const userMarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, 'recipients.userId': userId },
      { $set: { 'recipients.$.isRead': true, 'recipients.$.readAt': new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking user notification as read:', error);
    res.status(500).json({ success: false, message: 'Error marking as read', error: error.message });
  }
};

export const userMarkAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const result = await Notification.updateMany(
      { 'recipients.userId': userId, 'recipients.isRead': false },
      { $set: { 'recipients.$[elem].isRead': true, 'recipients.$[elem].readAt': new Date() } },
      { arrayFilters: [{ 'elem.userId': userId, 'elem.isRead': false }] }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all user notifications as read:', error);
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    // Fixed: Use consistent doctor ID extraction
    const doctorId = req.doctor.id || req.doctor._id;
    
    console.log('Marking as read:', { notificationId: id, doctorId });

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        'recipients.userId': doctorId
      },
      {
        $set: {
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or you do not have access to it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    // Fixed: Use consistent doctor ID extraction
    const doctorId = req.doctor.id || req.doctor._id;
    
    console.log('Marking all as read for doctor:', doctorId);

    const result = await Notification.updateMany(
      {
        'recipients.userId': doctorId,
        'recipients.isRead': false
      },
      {
        $set: {
          'recipients.$[elem].isRead': true,
          'recipients.$[elem].readAt': new Date()
        }
      },
      {
        arrayFilters: [{ 
          'elem.userId': doctorId,
          'elem.isRead': false 
        }]
      }
    );

    console.log('Mark all as read result:', result);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Admin mark as read (for admin interface)
export const adminMarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          'recipients.$[].isRead': true,
          'recipients.$[].readAt': new Date()
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
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Admin mark all as read
export const adminMarkAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {},
      {
        $set: {
          'recipients.$[].isRead': true,
          'recipients.$[].readAt': new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
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
    // Fixed: Use consistent doctor ID extraction
    const doctorId = req.doctor.id || req.doctor._id;

    const count = await Notification.countDocuments({
      'recipients.userId': doctorId,
      'recipients.isRead': false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};