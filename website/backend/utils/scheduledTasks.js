import cron from 'node-cron';
import { cancelExpiredAppointments, closeEndOfDayAppointments } from './appointmentCancellation.js';
import { handleNoShowAppointments } from './noShowCancellation.js';
import { sendEventReminders, updateEventStatuses } from '../controllers/eventController.js';

// Schedule tasks for appointment management
export const scheduleAppointmentChecks = () => {
    // Run expired appointment check every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running appointment expiry check...');
        await cancelExpiredAppointments();
    });

    // Run end-of-day appointment closure at 11:59 PM daily
    cron.schedule('59 23 * * *', async () => {
        console.log('Running end-of-day appointment closure...');
        await closeEndOfDayAppointments();
    });

    // Run no-show check every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('Running no-show appointment check...');
        await handleNoShowAppointments();
    });

    // Run event reminder check every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('Sending event reminders...');
        await sendEventReminders();
    });

    // Update event statuses every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Updating event statuses...');
        await updateEventStatuses();
    });

    console.log('Appointment and event management schedulers initialized');
};