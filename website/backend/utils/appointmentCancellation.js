import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';

// Constants
const BATCH_SIZE = 50; // Number of appointments to process in each batch
const MAX_RETRIES = 3; // Maximum number of retry attempts for failed operations
const AUTO_CLOSE_BUFFER_MS = 60 * 60 * 1000; // 1 hour buffer for auto-closing appointments

/**
 * Logs messages with timestamps and log levels
 * @param {string} message - The message to log
 * @param {string} level - Log level (info, warn, error)
 * @param {Error} [error] - Optional error object for error logging
 */
const logger = (message, level = 'info', error = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };

    if (error) {
        logEntry.error = {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }

    console[level](JSON.stringify(logEntry));
};

/**
 * Adds tags to an appointment if they don't already exist
 * @param {string} appointmentId - The ID of the appointment
 * @param {string[]} tagsToAdd - Array of tags to add
 * @returns {Promise<Object>} Updated appointment document
 */
export const addAppointmentTags = async (appointmentId, tagsToAdd) => {
    try {
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            throw new Error(`Appointment ${appointmentId} not found`);
        }

        const existingTags = new Set(appointment.tags || []);
        const initialCount = existingTags.size;

        tagsToAdd.forEach(tag => existingTags.add(tag));

        if (existingTags.size > initialCount) {
            appointment.tags = Array.from(existingTags);
            appointment.metadata.lastModified = new Date();
            await appointment.save();
            logger(`Added ${existingTags.size - initialCount} tags to appointment ${appointmentId}`, 'info');
        }

        return appointment;
    } catch (error) {
        logger(`Failed to add tags to appointment ${appointmentId}`, 'error', error);
        throw error;
    }
};

/**
 * Processes a batch of appointments
 * @param {Array} appointments - Array of appointment documents
 * @param {Function} processFn - Function to process each appointment
 * @returns {Promise<{succeeded: number, failed: number}>} Count of succeeded and failed operations
 */
const processAppointmentsBatch = async (appointments, processFn) => {
    let succeeded = 0;
    let failed = 0;

    for (const appointment of appointments) {
        try {
            await processFn(appointment);
            succeeded++;
        } catch (error) {
            failed++;
            logger(`Failed to process appointment ${appointment._id}`, 'error', error);
        }
    }

    return { succeeded, failed };
};

/**
 * Closes appointments that have passed their scheduled time plus buffer period
 */
export const closeEndOfDayAppointments = async () => {
    const startTime = Date.now();
    logger('Starting end-of-day appointment closure', 'info');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Format dates for query (DD/MM/YYYY)
        const formatDate = (date) => date.toISOString().split('T')[0].split('-').reverse().join('/');

        // Find all appointments for today that are not completed or cancelled
        const query = {
            slotDate: {
                $gte: formatDate(today),
                $lt: formatDate(tomorrow)
            },
            cancelled: false,
            isCompleted: false
        };

        const totalAppointments = await appointmentModel.countDocuments(query);
        logger(`Found ${totalAppointments} appointments to process`, 'info');

        let processed = 0;
        const currentTime = new Date();

        // Process appointments in batches
        while (processed < totalAppointments) {
            const appointments = await appointmentModel
                .find(query)
                .skip(processed)
                .limit(BATCH_SIZE);

            if (appointments.length === 0) break;

            const { succeeded, failed } = await processAppointmentsBatch(
                appointments,
                async (appointment) => {
                    const [day, month, year] = appointment.slotDate.split('/');
                    const [hours, minutes] = appointment.slotTime.split(':');
                    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
                    const bufferTime = new Date(appointmentDateTime.getTime() + AUTO_CLOSE_BUFFER_MS);

                    if (currentTime > bufferTime) {
                        // Mark as auto-cancelled
                        await appointmentModel.findByIdAndUpdate(
                            appointment._id,
                            {
                                status: 'auto_cancelled',
                                cancelled: true, // Mark as cancelled to prevent reprocessing
                                autoCancelled: true,
                                autoCancelReason: 'no-show-end-of-day',
                                autoCancelledAt: new Date(),
                                $set: {
                                    'metadata.closedBy': 'system',
                                    'metadata.closedAt': new Date(),
                                    'metadata.lastModified': new Date()
                                }
                            },
                            { new: true }
                        );

                        // Apply Strike to User
                        try {
                            const user = await userModel.findById(appointment.userId);
                            if (user) {
                                const now = new Date();
                                const lastStrike = user.lastAutoCancelDate ? new Date(user.lastAutoCancelDate) : null;
                                const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

                                let newCount = user.autoCancelCount || 0;

                                // Reset strikes if more than 60 days passed since last strike
                                if (lastStrike && (now.getTime() - lastStrike.getTime() > sixtyDaysMs)) {
                                    newCount = 0;
                                }

                                newCount += 1;
                                let blockedUntil = user.bookingBlockedUntil;

                                // Check for suspension (5 strikes)
                                if (newCount >= 5) {
                                    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                                    blockedUntil = new Date(now.getTime() + thirtyDaysMs);
                                    logger(`User ${user._id} suspended for 30 days due to ${newCount} strikes`, 'warn');
                                }

                                await userModel.findByIdAndUpdate(user._id, {
                                    autoCancelCount: newCount,
                                    lastAutoCancelDate: now,
                                    bookingBlockedUntil: blockedUntil
                                });

                                logger(`Strike added for User ${user._id}. Total: ${newCount}`, 'info');
                            }
                        } catch (err) {
                            logger(`Failed to update strikes for user ${appointment.userId}`, 'error', err);
                        }

                        logger(`Appointment ${appointment._id} auto-cancelled at end of day`, 'info');
                    }
                }
            );

            processed += appointments.length;
            logger(`Processed batch: ${succeeded} succeeded, ${failed} failed`, 'info');
        }

        const duration = (Date.now() - startTime) / 1000;
        logger(`Completed end-of-day appointment closure in ${duration.toFixed(2)}s`, 'info');

        return {
            success: true,
            processed,
            duration: `${duration.toFixed(2)}s`,
            completedAt: new Date()
        };
    } catch (error) {
        logger('Error in closeEndOfDayAppointments', 'error', error);
        throw error;
    }
};

/**
 * Cancels expired appointments that haven't been completed or cancelled
 */
export const cancelExpiredAppointments = async () => {
    const startTime = Date.now();
    logger('Starting expired appointment cancellation', 'info');

    try {
        const currentDate = new Date();
        const query = {
            cancelled: false,
            isCompleted: false,
            slotDate: { $exists: true, $ne: null },
            slotTime: { $exists: true, $ne: null }
        };

        const totalAppointments = await appointmentModel.countDocuments(query);
        logger(`Found ${totalAppointments} appointments to check for expiration`, 'info');

        let processed = 0;
        let cancelled = 0;

        // Process appointments in batches
        while (processed < totalAppointments) {
            const appointments = await appointmentModel
                .find(query)
                .sort({ slotDate: 1, slotTime: 1 })
                .skip(processed)
                .limit(BATCH_SIZE);

            if (appointments.length === 0) break;

            const { succeeded, failed } = await processAppointmentsBatch(
                appointments,
                async (appointment) => {
                    try {
                        const [day, month, year] = appointment.slotDate.split('/');
                        const [hours, minutes] = appointment.slotTime.split(':');
                        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

                        if (appointmentDateTime < currentDate) {
                            await addAppointmentTags(appointment._id, ['expired']);

                            await appointmentModel.findByIdAndUpdate(
                                appointment._id,
                                {
                                    cancelled: true,
                                    $set: {
                                        'metadata.cancelledBy': 'system',
                                        'metadata.cancelledAt': new Date(),
                                        'metadata.lastModified': new Date()
                                    }
                                },
                                { new: true }
                            );

                            cancelled++;
                            logger(`Appointment ${appointment._id} auto-cancelled due to expiry`, 'info');
                        }
                    } catch (error) {
                        logger(`Error processing appointment ${appointment._id}`, 'error', error);
                        throw error;
                    }
                }
            );

            processed += appointments.length;
        }

        const duration = (Date.now() - startTime) / 1000;
        logger(`Completed expired appointment cancellation in ${duration.toFixed(2)}s. Cancelled: ${cancelled}`, 'info');

        return {
            success: true,
            processed,
            cancelled,
            duration: `${duration.toFixed(2)}s`,
            completedAt: new Date()
        };
    } catch (error) {
        logger('Error in cancelExpiredAppointments', 'error', error);
        throw error;
    }
};

/**
 * Runs all appointment maintenance tasks with retry logic
 * @param {Object} options - Configuration options
 * @param {number} [options.retryCount=0] - Current retry attempt
 * @param {number} [options.maxRetries=MAX_RETRIES] - Maximum number of retry attempts
 * @returns {Promise<Object>} Results of the maintenance tasks
 */
export const runAppointmentMaintenance = async (options = {}) => {
    const { retryCount = 0, maxRetries = MAX_RETRIES } = options;
    const startTime = Date.now();

    try {
        logger(`Starting appointment maintenance (attempt ${retryCount + 1}/${maxRetries + 1})`, 'info');

        const [expiredResult, eodResult] = await Promise.all([
            cancelExpiredAppointments(),
            closeEndOfDayAppointments()
        ]);

        const duration = (Date.now() - startTime) / 1000;
        const result = {
            success: true,
            duration: `${duration.toFixed(2)}s`,
            completedAt: new Date(),
            tasks: {
                expiredAppointments: expiredResult,
                endOfDayClosure: eodResult
            }
        };

        logger(`Completed appointment maintenance in ${duration.toFixed(2)}s`, 'info', null, result);
        return result;

    } catch (error) {
        logger(`Appointment maintenance failed (attempt ${retryCount + 1}/${maxRetries + 1})`, 'error', error);

        if (retryCount < maxRetries) {
            // Exponential backoff: wait 2^retryCount * 1000ms before retrying
            const delay = Math.pow(2, retryCount) * 1000;
            logger(`Retrying in ${delay}ms...`, 'warn');

            await new Promise(resolve => setTimeout(resolve, delay));
            return runAppointmentMaintenance({
                ...options,
                retryCount: retryCount + 1
            });
        }

        const duration = (Date.now() - startTime) / 1000;
        const result = {
            success: false,
            error: error.message,
            duration: `${duration.toFixed(2)}s`,
            failedAt: new Date(),
            retryCount: retryCount + 1
        };

        logger('Appointment maintenance failed after all retries', 'error', null, result);
        throw new Error(`Appointment maintenance failed after ${retryCount + 1} attempts: ${error.message}`);
    }
};

// Export for testing
export const __test__ = {
    BATCH_SIZE,
    MAX_RETRIES,
    AUTO_CLOSE_BUFFER_MS
};