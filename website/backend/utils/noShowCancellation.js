import appointmentModel from '../models/appointmentModel.js';
import { sendAppointmentCancellation } from './emailReminderService.js';

// Grace period in minutes after appointment start time
const GRACE_PERIOD_MINUTES = 15;

/**
 * Check and cancel appointments where patients haven't shown up
 * This runs periodically to check appointments that have started
 * but haven't been marked as completed or cancelled within the grace period
 */
export const handleNoShowAppointments = async () => {
    try {
        const currentDate = new Date();

        // Find all active appointments that haven't been cancelled or completed
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false,
            status: { $ne: 'no-show' } // Don't process if already marked
        });

        for (const appointment of appointments) {
            // Convert appointment date and time to Date object
            const [day, month, year] = appointment.slotDate.split('/');
            const [hours, minutes] = appointment.slotTime.split(':');
            const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

            // Add grace period to appointment time
            const graceEndTime = new Date(appointmentDateTime.getTime() + (GRACE_PERIOD_MINUTES * 60000));

            // If current time is past grace period and appointment hasn't started
            if (currentDate > graceEndTime) {
                // Update appointment status to no-show
                const updatedAppointment = await appointmentModel.findByIdAndUpdate(
                    appointment._id,
                    {
                        status: 'no-show'
                    },
                    { new: true }
                );

                // Send cancellation emails
                if (updatedAppointment) {
                    await sendAppointmentCancellation(updatedAppointment);
                    console.log(`Appointment ${appointment._id} cancelled due to no-show`);
                }
            }
        }
    } catch (error) {
        console.error('Error in handleNoShowAppointments:', error);
    }
};