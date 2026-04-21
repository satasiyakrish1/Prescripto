import express from 'express';
import crypto from 'crypto';
import Queue from 'bull';
import Stripe from 'stripe';
import Sale from '../models/saleModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { sendAppointmentConfirmation } from '../utils/emailService.js';
import { verifyWebhookSignature } from '../utils/zohoPaymentsService.js';
// duplicate import removed

const router = express.Router();

// Verify GitHub webhook signature
const verifyGithubWebhook = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  if (signature !== digest) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
};

// Create a queue for processing webhook events
const webhookQueue = new Queue('webhook-events', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process webhook events in the background
webhookQueue.process(async (job) => {
  const { event, payload } = job.data;
  
  try {
    switch (event) {
      case 'push':
        console.log('Push event received:', payload);
        // Handle push event
        break;
      case 'pull_request':
        console.log('Pull request event received:', payload);
        // Handle pull request event
        break;
      case 'issues':
        console.log('Issue event received:', payload);
        // Handle issue event
        break;
      default:
        console.log('Unhandled event:', event);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
});

// GitHub webhook endpoint
router.post('/github', verifyGithubWebhook, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // Add the event to the queue for processing
  await webhookQueue.add({
    event,
    payload
  });

  // Respond immediately
  res.status(200).json({ received: true });
});

// Initialize Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Verify Stripe webhook signature
const verifyStripeWebhook = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.rawBody; // Raw request body
  
  try {
    // Verify the event
    stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    next();
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    return res.status(400).json({ error: error.message });
  }
};

// Stripe webhook endpoint
router.post('/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update sale status if payment was successful
        if (session.payment_status === 'paid' && session.metadata?.saleId) {
          await Sale.findByIdAndUpdate(session.metadata.saleId, {
            status: 'Completed',
            payment_details: {
              gateway: 'stripe',
              session_id: session.id,
              payment_intent: session.payment_intent
            }
          });
          console.log(`Sale ${session.metadata.saleId} marked as completed via webhook`);
        }
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    // Respond to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Zoho Payments webhook endpoint
// Ensure raw body is enabled in server for /api/webhooks/zoho
router.post('/zoho', async (req, res) => {
  try {
    const signature = req.headers['x-zoho-signature'] || req.headers['x-zoho-signature-sha256'] || '';
    const webhookIdHeader = req.headers['x-zoho-webhook-id'] || req.headers['x-zoho-event-id'] || '';
    const rawBody = req.body; // express.raw set in server.js

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(403).json({ success: false, message: 'Invalid Zoho signature' });
    }

    // Optional: validate webhook id if provided in env
    const expectedWebhookId = process.env.ZOHO_PAYMENTS_WEBHOOK_ID;
    if (expectedWebhookId && webhookIdHeader && String(webhookIdHeader) !== String(expectedWebhookId)) {
      return res.status(401).json({ success: false, message: 'Webhook ID mismatch' });
    }

    // Parse event
    const payload = JSON.parse(rawBody.toString());
    const eventType = payload?.event || payload?.event_type || payload?.type;
    const pl = payload?.payment_link || payload?.data || payload;

    // If a reference_id or receipt like our appointmentId exists, mark payment
    const referenceId = pl?.reference_id || pl?.referenceId || payload?.data?.reference_id || payload?.payment?.reference_id;
    if (eventType && /payment_link.paid|payment.success|payment\.succeeded|payment_link.completed/i.test(eventType) && referenceId) {
      await appointmentModel.findByIdAndUpdate(referenceId, { payment: true });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Zoho webhook error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;