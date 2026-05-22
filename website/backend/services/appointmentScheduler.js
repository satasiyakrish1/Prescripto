import cron from 'node-cron';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import { createAutoCancelNotification, createBlockNotification } from '../utils/notificationHelper.js';

/**
 * Auto-cancellation scheduler
 * Runs daily at 23:59 IST to cancel no-show appointments
 */
class AppointmentScheduler {
    constructor() {
        this.job = null;
    }

    /**
     * Convert IST time to UTC for MongoDB queries
     */
    getISTDateRange() {
        // IST is UTC+5:30
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        
        // Get current IST time
        const istNow = new Date(now.getTime() + istOffset);
        
        // Start of day in IST (00:00:00)
        const startOfDayIST = new Date(istNow);
        startOfDayIST.setUTCHours(0, 0, 0, 0);
        
        // End of day in IST (23:59:59)
        const endOfDayIST = new Date(istNow);
        endOfDayIST.setUTCHours(23, 59, 59, 999);
        
        // Convert back to UTC for MongoDB
        const startUTC = new Date(startOfDayIST.getTime() - istOffset);
        const endUTC = new Date(endOfDayIST.getTime() - istOffset);
        
        return { startUTC, endUTC };
    }

    /**
     * Process auto-cancellations for no-show appointments
     */
    async processAutoCancellations() {
        try {
            console.log('[Scheduler] Starting auto-cancellation job at', new Date().toISOString());
            
            const { startUTC, endUTC } = this.getISTDateRange();
            
            console.log('[Scheduler] Processing appointments between:', {
                start: startUTC.toISOString(),
                end: endUTC.toISOString()
            });

            // Find all booked appointments for today that are not completed
            const appointmentsToCancel = await appointmentModel.find({
                scheduledAt: {
                    $gte: startUTC,
                    $lte: endUTC
                },
                status: 'booked',
                isCompleted: false,
                cancelled: false
            });

            console.log(`[Scheduler] Found ${appointmentsToCancel.length} appointments to auto-cancel`);

            if (appointmentsToCancel.length === 0) {
                return { success: true, count: 0, message: 'No appointments to cancel' };
            }

            const currentTimestamp = new Date();
            const results = {
                cancelled: 0,
                blocked: 0,
                errors: []
            };

            // Process each appointment
            for (const appointment of appointmentsToCancel) {
                try {
                    // Update appointment status (idempotent)
                    await appointmentModel.findByIdAndUpdate(
                        appointment._id,
                        {
                            $set: {
                                status: 'auto_cancelled',
                                autoCancelled: true,
                                autoCancelReason: 'no-show-end-of-day',
                                autoCancelledAt: currentTimestamp,
                                'metadata.closedBy': 'system',
                                'metadata.closedAt': currentTimestamp
                            }
                        },
                        { new: true }
                    );

                    results.cancelled++;

                    // Update user's auto-cancel count
                    const user = await userModel.findById(appointment.userId);
                    
                    if (!user) {
                        console.error(`[Scheduler] User not found: ${appointment.userId}`);
                        continue;
                    }

                    // Increment auto-cancel count
                    user.autoCancelCount = (user.autoCancelCount || 0) + 1;
                    user.lastAutoCancelDate = currentTimestamp;

                    // Create notification for auto-cancellation
                    await createAutoCancelNotification(user._id, appointment);

                    // Check if user should be blocked (3+ no-show appointments)
                    if (user.autoCancelCount >= 3 && !user.bookingBlockedUntil) {
                        // Block for 1 month
                        const blockUntil = new Date();
                        blockUntil.setMonth(blockUntil.getMonth() + 1);
                        
                        user.bookingBlockedUntil = blockUntil;
                        
                        // Create block notification
                        await createBlockNotification(user._id, blockUntil);
                        
                        results.blocked++;
                        console.log(`[Scheduler] User ${user._id} blocked until ${blockUntil.toISOString()}`);
                    }

                    await user.save();

                } catch (error) {
                    console.error(`[Scheduler] Error processing appointment ${appointment._id}:`, error);
                    results.errors.push({
                        appointmentId: appointment._id,
                        error: error.message
                    });
                }
            }

            console.log('[Scheduler] Auto-cancellation job completed:', results);
            
            return {
                success: true,
                ...results,
                message: `Cancelled ${results.cancelled} appointments, blocked ${results.blocked} users`
            };

        } catch (error) {
            console.error('[Scheduler] Fatal error in auto-cancellation job:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start the scheduler
     * Runs at 23:59 IST every day
     * Cron expression: '59 18 * * *' (23:59 IST = 18:29 UTC)
     */
    start() {
        if (this.job) {
            console.log('[Scheduler] Job already running');
            return;
        }

        // Run at 23:59 IST (18:29 UTC)
        // Note: Adjust based on your server's timezone
        this.job = cron.schedule('59 18 * * *', async () => {
            console.log('[Scheduler] Triggered at', new Date().toISOString());
            await this.processAutoCancellations();
        }, {
            timezone: 'Asia/Kolkata'
        });

        console.log('[Scheduler] Auto-cancellation job scheduled for 23:59 IST daily');
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            console.log('[Scheduler] Auto-cancellation job stopped');
        }
    }

    /**
     * Run the job manually (for testing)
     */
    async runNow() {
        console.log('[Scheduler] Manual execution triggered');
        return await this.processAutoCancellations();
    }
}

// Export singleton instance
const scheduler = new AppointmentScheduler();
export default scheduler;
