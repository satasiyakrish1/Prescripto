import mongoose from 'mongoose';
import dotenv from 'dotenv';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { parseAppointmentDateTime } from '../utils/dateHelper.js';

dotenv.config();

/**
 * Migration script to add auto-cancellation fields to existing data
 * Run this once after deploying the new schema
 */

const runMigration = async () => {
    try {
        console.log('Starting migration...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update appointments
        console.log('\n=== Updating Appointments ===');
        
        const appointments = await appointmentModel.find({});
        console.log(`Found ${appointments.length} appointments to update`);

        let appointmentUpdates = 0;
        for (const appointment of appointments) {
            const updates = {};

            // Add status if missing
            if (!appointment.status) {
                if (appointment.cancelled) {
                    updates.status = 'cancelled';
                } else if (appointment.isCompleted) {
                    updates.status = 'completed';
                } else {
                    updates.status = 'booked';
                }
            }

            // Add scheduledAt if missing
            if (!appointment.scheduledAt && appointment.slotDate && appointment.slotTime) {
                try {
                    updates.scheduledAt = parseAppointmentDateTime(
                        appointment.slotDate,
                        appointment.slotTime
                    );
                } catch (error) {
                    console.error(`Error parsing date for appointment ${appointment._id}:`, error);
                    // Use current date as fallback
                    updates.scheduledAt = new Date();
                }
            }

            // Add autoCancelled if missing
            if (appointment.autoCancelled === undefined) {
                updates.autoCancelled = false;
            }

            // Update if there are changes
            if (Object.keys(updates).length > 0) {
                await appointmentModel.findByIdAndUpdate(appointment._id, { $set: updates });
                appointmentUpdates++;
            }
        }

        console.log(`Updated ${appointmentUpdates} appointments`);

        // Update users
        console.log('\n=== Updating Users ===');
        
        const users = await userModel.find({});
        console.log(`Found ${users.length} users to update`);

        let userUpdates = 0;
        for (const user of users) {
            const updates = {};

            // Add autoCancelCount if missing
            if (user.autoCancelCount === undefined) {
                updates.autoCancelCount = 0;
            }

            // Add bookingBlockedUntil if missing
            if (user.bookingBlockedUntil === undefined) {
                updates.bookingBlockedUntil = null;
            }

            // Add lastAutoCancelDate if missing
            if (user.lastAutoCancelDate === undefined) {
                updates.lastAutoCancelDate = null;
            }

            // Update if there are changes
            if (Object.keys(updates).length > 0) {
                await userModel.findByIdAndUpdate(user._id, { $set: updates });
                userUpdates++;
            }
        }

        console.log(`Updated ${userUpdates} users`);

        console.log('\n=== Migration Summary ===');
        console.log(`Total appointments updated: ${appointmentUpdates}`);
        console.log(`Total users updated: ${userUpdates}`);
        console.log('Migration completed successfully!');

        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
runMigration();
