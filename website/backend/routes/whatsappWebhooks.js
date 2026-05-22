import express from 'express';
import { Vonage } from '@vonage/server-sdk';

const router = express.Router();

// Initialize Vonage client
const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY
});

// Webhook endpoint for inbound messages
router.post('/inbound', async (req, res) => {
    try {
        const { from, text, message_uuid } = req.body;
        
        console.log('Inbound WhatsApp message:', {
            from,
            text,
            message_uuid
        });

        // Process the inbound message here
        // You can add logic to handle different types of messages
        // and integrate with your appointment system

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing inbound message:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Webhook endpoint for message status updates
router.post('/status', async (req, res) => {
    try {
        const { status, message_uuid } = req.body;

        console.log('Message status update:', {
            status,
            message_uuid
        });

        // Process the status update here
        // You can update your database or trigger notifications
        // based on message delivery status

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing status update:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;