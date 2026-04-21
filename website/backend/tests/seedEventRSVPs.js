// backend/seedEventRSVPs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import eventModel from '../models/eventModel.js';
import eventRSVPModel from '../models/eventRSVPModel.js';
import userModel from '../models/userModel.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const DEVICES = ['Mobile', 'Desktop', 'Tablet'];
const REFERRALS = ['Direct', 'Email', 'Social Media', 'Website'];

async function seedRSVPs() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find one or more events to seed RSVPs for
    const events = await eventModel.find({});
    if (!events.length) {
      console.log('No events found. Please create an event first.');
      return;
    }

    // Find users to use for RSVPs
    const users = await userModel.find({});
    if (!users.length) {
      console.log('No users found. Please create users first.');
      return;
    }

    for (const event of events) {
      // Remove existing RSVPs for this event (for demo purposes)
      await eventRSVPModel.deleteMany({ eventId: event._id });

      // Create 20 demo RSVPs per event
      for (let i = 0; i < 20; i++) {
        const user = users[i % users.length];
        const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
        const referralSource = REFERRALS[Math.floor(Math.random() * REFERRALS.length)];
        const status = Math.random() < 0.8 ? 'confirmed' : 'pending';
        const paymentStatus = event.eventType === 'paid' ? (Math.random() < 0.7 ? 'paid' : 'pending') : 'not_applicable';
        const paid = paymentStatus === 'paid';
        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // within last 7 days

        await eventRSVPModel.create({
          eventId: event._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status,
          paymentStatus,
          paymentDetails: paid ? {
            gateway: 'razorpay',
            orderId: `order_${Math.random().toString(36).slice(2)}`,
            paymentId: `pay_${Math.random().toString(36).slice(2)}`,
            amount: event.price,
            currency: 'INR',
            paidAt: createdAt
          } : {},
          additionalInfo: {
            device,
            referralSource
          },
          createdAt,
          updatedAt: createdAt
        });
      }
      console.log(`Seeded RSVPs for event: ${event.title}`);
    }
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding RSVPs:', err);
    process.exit(1);
  }
}

seedRSVPs(); 