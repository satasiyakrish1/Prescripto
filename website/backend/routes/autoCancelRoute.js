import express from 'express';
import {
    getAutoCancelledAppointments,
    getBlockedUsers,
    unblockUser,
    getAutoCancelStats,
    triggerAutoCancelJob,
    getUserAutoCancelHistory
} from '../controllers/autoCancelController.js';
import { getBookingStatus } from '../middleware/bookingRestriction.js';

const autoCancelRouter = express.Router();

// Admin routes (add your admin auth middleware)
autoCancelRouter.get('/appointments', getAutoCancelledAppointments);
autoCancelRouter.get('/blocked-users', getBlockedUsers);
autoCancelRouter.post('/unblock/:userId', unblockUser);
autoCancelRouter.get('/stats', getAutoCancelStats);
autoCancelRouter.post('/trigger-job', triggerAutoCancelJob);

// User routes (add your user auth middleware)
autoCancelRouter.post('/booking-status', getBookingStatus);
autoCancelRouter.get('/user-history/:userId', getUserAutoCancelHistory);

export default autoCancelRouter;
