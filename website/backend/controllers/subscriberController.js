import mongoose from 'mongoose';
import Subscriber from '../models/subscriberModel.js';

// Add new subscriber
export const addSubscriber = async (req, res) => {
    try {
        // Check MongoDB connection status
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database connection is not ready. Please try again later.'
            });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your email address'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check if email already exists
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({
                success: false,
                message: 'Email already subscribed'
            });
        }

        // Create new subscriber
        const subscriber = await Subscriber.create({
            email
        });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: subscriber
        });

    } catch (error) {
        // Handle specific database errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        } else if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed'
            });
        }

        console.error('Subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to process your subscription. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Unsubscribe
export const unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;

        const subscriber = await Subscriber.findOne({ email });
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }

        subscriber.status = 'unsubscribed';
        await subscriber.save();

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unsubscribing',
            error: error.message
        });
    }
};