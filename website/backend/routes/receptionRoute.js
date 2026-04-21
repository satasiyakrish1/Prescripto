import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import QueueModel from '../models/queueModel.js';
import appointmentModel from '../models/appointmentModel.js';

const router = express.Router();

// Get today's appointments for reception
router.get('/appointments/today', authAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await appointmentModel.find({
            slotDate: {
                $gte: today.toISOString().split('T')[0],
                $lt: tomorrow.toISOString().split('T')[0]
            },
            cancelled: false,
            isCompleted: false
        }).sort({ slotTime: 1 });

        // Ensure content-type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Search appointments
router.get('/search/appointments', authAdmin, async (req, res) => {
    try {
        const { query, date } = req.query;
        
        let dateFilter = {};
        if (date) {
            dateFilter.slotDate = date;
        }

        const appointments = await appointmentModel.find({
            ...dateFilter,
            cancelled: false,
            isCompleted: false,
            $or: [
                { 'userData.name': { $regex: query, $options: 'i' } },
                { 'userData.email': { $regex: query, $options: 'i' } },
                { 'userData.phone': { $regex: query, $options: 'i' } }
            ]
        }).sort({ slotTime: 1 });

        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error searching appointments:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Search queue
router.get('/search/queue', authAdmin, async (req, res) => {
    try {
        const { query } = req.query;

        const queue = await QueueModel.find({
            status: { $ne: 'completed' },
            patientName: { $regex: query, $options: 'i' }
        }).sort({ priority: -1, checkInTime: 1 });

        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, queue });
    } catch (error) {
        console.error('Error searching queue:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get tomorrow's appointments for reception
router.get('/appointments/tomorrow', authAdmin, async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

        const appointments = await appointmentModel.find({
            slotDate: tomorrowDateStr,
            cancelled: false,
            isCompleted: false
        }).sort({ slotTime: 1 });

        // Ensure content-type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error fetching tomorrow\'s appointments:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current queue status
router.get('/queue', authAdmin, async (req, res) => {
    try {
        const queue = await QueueModel.find({
            status: { $ne: 'completed' }
        }).sort({ priority: -1, checkInTime: 1 });

        // Ensure content-type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, queue });
    } catch (error) {
        console.error('Error fetching current queue:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get tomorrow's queue status
router.get('/queue/tomorrow', authAdmin, async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

        // Find appointments for tomorrow
        const tomorrowAppointments = await appointmentModel.find({
            slotDate: tomorrowDateStr,
            cancelled: false,
            isCompleted: false
        });

        // Get appointment IDs for tomorrow
        const tomorrowAppointmentIds = tomorrowAppointments.map(appointment => appointment._id);

        // Find queue entries for tomorrow's appointments
        const queue = await QueueModel.find({
            appointmentId: { $in: tomorrowAppointmentIds },
            status: { $ne: 'completed' }
        }).sort({ priority: -1, checkInTime: 1 });
        
        // Ensure content-type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, queue });
    } catch (error) {
        console.error('Error fetching tomorrow\'s queue:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check-in patient
router.post('/check-in', authAdmin, async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Create queue entry
        const queueEntry = new QueueModel({
            appointmentId,
            patientName: appointment.userData.name,
            doctorId: appointment.docId,
            doctorName: appointment.docData.name,
            department: appointment.docData.department
        });

        await queueEntry.save();
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, queue: queueEntry });
    } catch (error) {
        console.error('Error checking in patient:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update patient status
router.put('/status/:queueId', authAdmin, async (req, res) => {
    try {
        const { queueId } = req.params;
        const { status } = req.body;

        const queueEntry = await QueueModel.findByIdAndUpdate(
            queueId,
            { status },
            { new: true }
        );

        if (!queueEntry) {
            return res.status(404).json({ success: false, message: 'Queue entry not found' });
        }

        // If status is completed, mark appointment as completed
        if (status === 'completed') {
            await appointmentModel.findByIdAndUpdate(
                queueEntry.appointmentId,
                { isCompleted: true }
            );
        }

        res.json({ success: true, queue: queueEntry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update queue priority
router.put('/priority/:queueId', authAdmin, async (req, res) => {
    try {
        const { queueId } = req.params;
        const { priority } = req.body;

        const queueEntry = await QueueModel.findByIdAndUpdate(
            queueId,
            { priority },
            { new: true }
        );

        if (!queueEntry) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(404).json({ success: false, message: 'Queue entry not found' });
        }

        // Ensure content-type is set to application/json
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, queue: queueEntry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;