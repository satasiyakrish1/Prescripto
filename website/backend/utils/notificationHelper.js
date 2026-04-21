import Notification from '../models/notificationModel.js';
import mongoose from 'mongoose';

/**
 * Create a notification for auto-cancelled appointment
 */
export const createAutoCancelNotification = async (userId, appointment) => {
    try {
        const notification = new Notification({
            title: 'Appointment Auto-Cancelled',
            message: `Your appointment with Dr. ${appointment.docData.name} scheduled for ${appointment.slotDate} at ${appointment.slotTime} was automatically cancelled due to no-show. Please ensure you attend your appointments or cancel them in advance.`,
            type: 'warning',
            sender: 'System',
            recipients: [{
                userId: new mongoose.Types.ObjectId(userId),
                isRead: false
            }],
            recipientModel: 'user',
            createdBy: new mongoose.Types.ObjectId('000000000000000000000000') // System user
        });

        await notification.save();
        console.log(`[Notification] Auto-cancel notification created for user ${userId}`);
        return { success: true, notification };
    } catch (error) {
        console.error('[Notification] Error creating auto-cancel notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create a notification for user booking block
 */
export const createBlockNotification = async (userId, blockUntil) => {
    try {
        const blockDate = new Date(blockUntil).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        });

        const notification = new Notification({
            title: 'Booking Temporarily Blocked',
            message: `Due to 5 consecutive no-shows, your booking privileges have been temporarily suspended until ${blockDate}. This is to ensure fair access to appointments for all patients. Please contact support if you believe this is an error.`,
            type: 'error',
            sender: 'System',
            recipients: [{
                userId: new mongoose.Types.ObjectId(userId),
                isRead: false
            }],
            recipientModel: 'user',
            createdBy: new mongoose.Types.ObjectId('000000000000000000000000') // System user
        });

        await notification.save();
        console.log(`[Notification] Block notification created for user ${userId}`);
        return { success: true, notification };
    } catch (error) {
        console.error('[Notification] Error creating block notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create a notification when block is lifted
 */
export const createUnblockNotification = async (userId) => {
    try {
        const notification = new Notification({
            title: 'Booking Privileges Restored',
            message: 'Your booking privileges have been restored. You can now book appointments again. Please remember to attend your scheduled appointments or cancel them in advance to avoid future restrictions.',
            type: 'success',
            sender: 'System',
            recipients: [{
                userId: new mongoose.Types.ObjectId(userId),
                isRead: false
            }],
            recipientModel: 'user',
            createdBy: new mongoose.Types.ObjectId('000000000000000000000000') // System user
        });

        await notification.save();
        console.log(`[Notification] Unblock notification created for user ${userId}`);
        return { success: true, notification };
    } catch (error) {
        console.error('[Notification] Error creating unblock notification:', error);
        return { success: false, error: error.message };
    }
};
