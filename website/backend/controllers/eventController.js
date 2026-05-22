import eventModel from '../models/eventModel.js';
import eventRSVPModel from '../models/eventRSVPModel.js';
import userModel from '../models/userModel.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { generatePDF } from '../utils/pdfGenerator.js';
import { sendEmail } from '../utils/emailService.js';

// Initialize Razorpay
let razorpayInstance;

try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay instance created successfully for events');
} catch (error) {
    console.error('ERROR: Failed to initialize Razorpay for events:', error);
}

// Initialize Stripe
let stripeInstance;
try {
    const Stripe = (await import('stripe')).default;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe instance created successfully for events');
} catch (error) {
    console.error('ERROR: Failed to initialize Stripe for events:', error);
}

// ADMIN CONTROLLERS

// Create a new event
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            date,
            duration,
            location,
            locationType,
            description,
            rsvpLimit,
            eventType,
            price,
            paymentIntegration,
            meetingLink,
            additionalInfo
        } = req.body;

        // Get banner image if uploaded
        let banner = '';
        if (req.file) {
            banner = `/uploads/event-banners/${req.file.filename}`;
        }

        // Ensure admin ID is available
        if (!req.admin || (!req.admin._id && !req.admin.id)) {
            console.error('Admin ID missing in request:', req.admin);
            return res.status(400).json({
                success: false,
                message: 'Admin authentication required'
            });
        }
        
        const adminId = req.admin._id || req.admin.id;
        console.log('Admin ID used for createdBy:', adminId);
        
        // Create new event
        const newEvent = new eventModel({
            title,
            date,
            duration,
            location,
            locationType,
            description,
            banner,
            rsvpLimit: rsvpLimit || 0,
            eventType,
            price: eventType === 'paid' ? price : 0,
            paymentIntegration: eventType === 'paid' ? paymentIntegration : false,
            createdBy: adminId,
            meetingLink: locationType === 'online' ? meetingLink : '',
            additionalInfo: additionalInfo || {}
        });
        
        // Log the admin ID for debugging
        console.log('Admin ID used for createdBy:', req.admin._id || req.admin.id);

        await newEvent.save();

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (error) {
        console.error('Error creating event:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
            adminInfo: req.admin ? { id: req.admin.id || req.admin._id, email: req.admin.email } : 'No admin info'
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all events (admin)
export const getAllEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Get events with pagination
        const events = await eventModel
            .find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'rsvpCount'
            });

        // Get total count
        const totalEvents = await eventModel.countDocuments(query);

        res.json({
            success: true,
            events,
            pagination: {
                total: totalEvents,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalEvents / limit)
            }
        });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get event by ID
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Get RSVP count
        const rsvpCount = await eventRSVPModel.countDocuments({ eventId: id });

        res.json({
            success: true,
            event: {
                ...event.toObject(),
                rsvpCount
            }
        });
    } catch (error) {
        console.error('Error getting event:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Remove keepExistingBanner from updateData as it's just a flag
        const keepExistingBanner = updateData.keepExistingBanner === 'true';
        delete updateData.keepExistingBanner;

        // Handle banner upload if present
        const event = await eventModel.findById(id);
        if (req.file) {
            updateData.banner = `/uploads/event-banners/${req.file.filename}`;
        } else if (keepExistingBanner && event.banner) {
            updateData.banner = event.banner;
        } else {
            updateData.banner = '';
        }

        // Update timestamp
        updateData.updatedAt = new Date();

        // If event type is free, ensure price is 0 and payment integration is false
        if (updateData.eventType === 'free') {
            updateData.price = 0;
            updateData.paymentIntegration = false;
        }

        const updatedEvent = await eventModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if there are any RSVPs
        const rsvpCount = await eventRSVPModel.countDocuments({ eventId: id });
        if (rsvpCount > 0) {
            // Instead of deleting, mark as cancelled
            event.status = 'cancelled';
            await event.save();

            return res.json({
                success: true,
                message: 'Event has RSVPs and has been marked as cancelled instead of deleted'
            });
        }

        // If no RSVPs, delete the event
        await eventModel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get event participants (RSVPs)
export const getEventParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = { eventId: id };
        if (status) {
            query.status = status;
        }

        // Get participants with pagination
        const participants = await eventRSVPModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalParticipants = await eventRSVPModel.countDocuments(query);

        res.json({
            success: true,
            participants,
            pagination: {
                total: totalParticipants,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalParticipants / limit)
            }
        });
    } catch (error) {
        console.error('Error getting event participants:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add participant manually
export const addParticipantManually = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, additionalInfo } = req.body;

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event has reached RSVP limit
        if (event.rsvpLimit > 0) {
            const rsvpCount = await eventRSVPModel.countDocuments({ eventId: id });
            if (rsvpCount >= event.rsvpLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'Event has reached RSVP limit'
                });
            }
        }

        // Check if user exists by email
        let userId = null;
        const user = await userModel.findOne({ email });
        if (user) {
            userId = user._id;
        }

        // Create new participant
        const newParticipant = new eventRSVPModel({
            eventId: id,
            userId: userId || 'manual',
            name,
            email,
            phone,
            status: 'confirmed',
            paymentStatus: event.eventType === 'paid' ? 'paid' : 'not_applicable',
            additionalInfo: additionalInfo || {},
            manuallyAdded: true
        });

        await newParticipant.save();

        res.status(201).json({
            success: true,
            message: 'Participant added successfully',
            participant: newParticipant
        });
    } catch (error) {
        console.error('Error adding participant:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update participant
export const updateParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        const updateData = { ...req.body };

        // Update timestamp
        updateData.updatedAt = new Date();

        const updatedParticipant = await eventRSVPModel.findOneAndUpdate(
            { _id: participantId, eventId: id },
            updateData,
            { new: true }
        );

        if (!updatedParticipant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.json({
            success: true,
            message: 'Participant updated successfully',
            participant: updatedParticipant
        });
    } catch (error) {
        console.error('Error updating participant:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete participant
export const deleteParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;

        const result = await eventRSVPModel.findOneAndDelete({
            _id: participantId,
            eventId: id
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.json({
            success: true,
            message: 'Participant deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting participant:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Export participants as CSV
export const exportParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'csv' } = req.query;

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Get all participants
        const participants = await eventRSVPModel.find({ eventId: id });

        if (format === 'pdf') {
            // Generate PDF
            const pdfBuffer = await generatePDF('eventParticipants', {
                event,
                participants,
                date: new Date().toLocaleDateString()
            });

            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${event.title}-participants.pdf"`);
            return res.send(pdfBuffer);
        } else {
            // Generate CSV
            const csvData = [
                ['Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Registration Date']
            ];

            participants.forEach(participant => {
                csvData.push([
                    participant.name,
                    participant.email,
                    participant.phone || 'N/A',
                    participant.status,
                    participant.paymentStatus,
                    new Date(participant.createdAt).toLocaleDateString()
                ]);
            });

            // Convert to CSV string
            const csvString = csvData.map(row => row.join(',')).join('\n');

            // Set headers for CSV download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${event.title}-participants.csv"`);
            return res.send(csvString);
        }
    } catch (error) {
        console.error('Error exporting participants:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get event analytics
export const getEventAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Get all participants
        const participants = await eventRSVPModel.find({ eventId: id });

        // Calculate analytics
        const totalRSVPs = participants.length;
        const confirmedRSVPs = participants.filter(p => p.status === 'confirmed').length;
        const pendingRSVPs = participants.filter(p => p.status === 'pending').length;
        const cancelledRSVPs = participants.filter(p => p.status === 'cancelled').length;

        // Payment analytics (for paid events)
        const totalPayments = participants.filter(p => p.paymentStatus === 'paid').length;
        const pendingPayments = participants.filter(p => p.paymentStatus === 'pending').length;
        const failedPayments = participants.filter(p => p.paymentStatus === 'failed').length;

        // Calculate total revenue
        const totalRevenue = participants
            .filter(p => p.paymentStatus === 'paid')
            .reduce((sum, p) => sum + (p.paymentDetails.amount || event.price), 0);

        // Calculate remaining spots
        const remainingSpots = event.rsvpLimit > 0 ? event.rsvpLimit - totalRSVPs : 'Unlimited';

        // RSVP trends by day
        const rsvpByDayMap = {};
        participants.forEach(p => {
            const date = p.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
            rsvpByDayMap[date] = (rsvpByDayMap[date] || 0) + 1;
        });
        const rsvpByDay = Object.entries(rsvpByDayMap).map(([date, count]) => ({ date, count }));
        rsvpByDay.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Device stats (from additionalInfo.device)
        const deviceStatsMap = {};
        participants.forEach(p => {
            const device = p.additionalInfo?.device || 'Unknown';
            deviceStatsMap[device] = (deviceStatsMap[device] || 0) + 1;
        });
        const deviceStats = Object.entries(deviceStatsMap).map(([name, value]) => ({ name, value }));

        // Referral sources (from additionalInfo.referralSource)
        const referralSourcesMap = {};
        participants.forEach(p => {
            const source = p.additionalInfo?.referralSource || 'Unknown';
            referralSourcesMap[source] = (referralSourcesMap[source] || 0) + 1;
        });
        const referralSources = Object.entries(referralSourcesMap).map(([name, value]) => ({ name, value }));

        // Attendance rate (confirmed/total)
        const attendanceRate = totalRSVPs > 0 ? (confirmedRSVPs / totalRSVPs) * 100 : 0;

        res.json({
            success: true,
            analytics: {
                totalRSVPs,
                confirmedRSVPs,
                pendingRSVPs,
                cancelledRSVPs,
                totalPayments,
                pendingPayments,
                failedPayments,
                totalRevenue,
                remainingSpots,
                rsvpByDay,
                deviceStats,
                referralSources,
                attendanceRate
            }
        });
    } catch (error) {
        console.error('Error getting event analytics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// USER CONTROLLERS

// Get all public events (user)
export const getPublicEvents = async (req, res) => {
    try {
        const { status = 'upcoming', page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query - only show upcoming and ongoing events by default
        const query = {};
        if (status) {
            query.status = status;
        }

        // Get events with pagination
        const events = await eventModel
            .find(query)
            .sort({ date: status === 'upcoming' ? 1 : -1 }) // Ascending for upcoming, descending for past
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalEvents = await eventModel.countDocuments(query);

        // For each event, check if RSVP limit is reached
        const eventsWithAvailability = await Promise.all(events.map(async (event) => {
            const rsvpCount = await eventRSVPModel.countDocuments({ eventId: event._id });
            const isRsvpAvailable = event.rsvpLimit === 0 || rsvpCount < event.rsvpLimit;
            
            return {
                ...event.toObject(),
                rsvpCount,
                isRsvpAvailable
            };
        }));

        res.json({
            success: true,
            events: eventsWithAvailability,
            pagination: {
                total: totalEvents,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalEvents / limit)
            }
        });
    } catch (error) {
        console.error('Error getting public events:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get public event by ID
export const getPublicEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : null;

        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Get RSVP count
        const rsvpCount = await eventRSVPModel.countDocuments({ eventId: id });
        const isRsvpAvailable = event.rsvpLimit === 0 || rsvpCount < event.rsvpLimit;

        // Check if user has already RSVP'd
        let userRsvp = null;
        if (userId) {
            userRsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        }

        res.json({
            success: true,
            event: {
                ...event.toObject(),
                rsvpCount,
                isRsvpAvailable,
                userRsvp: userRsvp ? userRsvp : null
            }
        });
    } catch (error) {
        console.error('Error getting public event:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// RSVP for an event
export const rsvpForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        // Accept device and referralSource from the request body
        const { additionalInfo = {}, device, referralSource } = req.body;

        // Merge device and referralSource into additionalInfo if provided
        if (device) additionalInfo.device = device;
        if (referralSource) additionalInfo.referralSource = referralSource;

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is upcoming or ongoing
        if (event.status === 'completed' || event.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot RSVP for ${event.status} event`
            });
        }

        // Check if user has already RSVP'd
        const existingRsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        if (existingRsvp) {
            return res.status(400).json({
                success: false,
                message: 'You have already RSVP\'d for this event'
            });
        }

        // Check if event has reached RSVP limit
        if (event.rsvpLimit > 0) {
            const rsvpCount = await eventRSVPModel.countDocuments({ eventId: id });
            if (rsvpCount >= event.rsvpLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'Event has reached RSVP limit'
                });
            }
        }

        // Get user details
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // For free events, create confirmed RSVP
        if (event.eventType === 'free') {
            const newRsvp = new eventRSVPModel({
                eventId: id,
                userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: 'confirmed',
                additionalInfo: additionalInfo
            });

            await newRsvp.save();

            // Send confirmation email
            try {
                await sendEmail({
                    to: user.email,
                    subject: `RSVP Confirmation: ${event.title}`,
                    template: 'eventRsvpConfirmation',
                    data: {
                        name: user.name,
                        eventTitle: event.title,
                        eventDate: new Date(event.date).toLocaleDateString(),
                        eventTime: new Date(event.date).toLocaleTimeString(),
                        eventLocation: event.location,
                        eventDescription: event.description,
                        meetingLink: event.locationType === 'online' ? event.meetingLink : ''
                    }
                });
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Don't fail the request if email fails
            }

            return res.status(201).json({
                success: true,
                message: 'RSVP confirmed successfully',
                rsvp: newRsvp
            });
        }

        // For paid events, create pending RSVP and return payment info
        if (event.eventType === 'paid') {
            const newRsvp = new eventRSVPModel({
                eventId: id,
                userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                status: 'pending',
                paymentStatus: 'pending',
                additionalInfo: additionalInfo
            });

            await newRsvp.save();

            // Return payment information based on integration
            if (event.paymentIntegration) {
                // Return both Razorpay and Stripe options
                return res.status(201).json({
                    success: true,
                    message: 'RSVP created, payment required',
                    event: {
                        title: event.title,
                        price: event.price
                    },
                    paymentOptions: {
                        razorpay: {
                            enabled: !!razorpayInstance,
                            keyId: process.env.RAZORPAY_KEY_ID
                        },
                        stripe: {
                            enabled: !!stripeInstance,
                            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
                        }
                    }
                });
            } else {
                // No payment integration, mark as pending for manual payment
                return res.status(201).json({
                    success: true,
                    message: 'RSVP created, manual payment required',
                    rsvp: newRsvp
                });
            }
        }
    } catch (error) {
        console.error('Error creating RSVP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create Razorpay order for event payment
export const createEventPaymentOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Check if Razorpay is initialized
        if (!razorpayInstance) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not initialized',
                error: 'RAZORPAY_NOT_INITIALIZED'
            });
        }

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is paid
        if (event.eventType !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'This is a free event, no payment required'
            });
        }

        // Check if user has an RSVP
        const rsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Check if payment is already completed
        if (rsvp.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed'
            });
        }

        // Generate a shorter receipt ID (max 40 chars)
        const shortRsvpId = rsvp._id.toString().slice(-8);
        const timestamp = Date.now().toString().slice(-10);
        const receipt = `e_${shortRsvpId}_${timestamp}`;

        // Create Razorpay order
        const options = {
            amount: event.price * 100, // amount in smallest currency unit (paise)
            currency: process.env.CURRENCY || 'INR',
            receipt: receipt,
            notes: {
                eventId: event._id.toString(),
                rsvpId: rsvp._id.toString(),
                userId: userId.toString()
            }
        };

        // Create order
        const order = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            order,
            eventDetails: {
                title: event.title,
                price: event.price
            }
        });
    } catch (error) {
        console.error('Error creating event payment order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify Razorpay payment for event
export const verifyEventPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        // Check if Razorpay is initialized
        if (!razorpayInstance) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not initialized',
                error: 'RAZORPAY_NOT_INITIALIZED'
            });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Fetch order details
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        // Check if payment is successful
        if (orderInfo.status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        // Get RSVP ID from order notes
        const { rsvpId } = orderInfo.notes;

        // Update RSVP status
        const rsvp = await eventRSVPModel.findById(rsvpId);
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Update RSVP with payment details
        rsvp.status = 'confirmed';
        rsvp.paymentStatus = 'paid';
        rsvp.paymentDetails = {
            gateway: 'razorpay',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: orderInfo.amount / 100, // Convert from paise to rupees
            currency: orderInfo.currency,
            paidAt: new Date()
        };

        await rsvp.save();

        // Get event details
        const event = await eventModel.findById(id);

        // Send confirmation email
        try {
            const user = await userModel.findById(userId);
            await sendEmail({
                to: user.email,
                subject: `Payment Confirmation: ${event.title}`,
                template: 'eventPaymentConfirmation',
                data: {
                    name: user.name,
                    eventTitle: event.title,
                    eventDate: new Date(event.date).toLocaleDateString(),
                    eventTime: new Date(event.date).toLocaleTimeString(),
                    eventLocation: event.location,
                    amount: orderInfo.amount / 100,
                    currency: orderInfo.currency,
                    paymentId: razorpay_payment_id,
                    meetingLink: event.locationType === 'online' ? event.meetingLink : ''
                }
            });
        } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Payment verified and RSVP confirmed',
            rsvp: {
                status: rsvp.status,
                paymentStatus: rsvp.paymentStatus,
                paymentDetails: rsvp.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error verifying event payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create Stripe checkout session for event payment
export const createStripeCheckout = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { successUrl, cancelUrl } = req.body;

        // Check if Stripe is initialized
        if (!stripeInstance) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not initialized',
                error: 'STRIPE_NOT_INITIALIZED'
            });
        }

        // Check if event exists
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is paid
        if (event.eventType !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'This is a free event, no payment required'
            });
        }

        // Check if user has an RSVP
        const rsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Check if payment is already completed
        if (rsvp.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed'
            });
        }

        // Create Stripe checkout session
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: process.env.CURRENCY?.toLowerCase() || 'inr',
                        product_data: {
                            name: event.title,
                            description: `Registration for ${event.title}`
                        },
                        unit_amount: Math.round(event.price * 100) // Convert to cents/paise
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: successUrl || `${process.env.FRONTEND_URL}/events/${id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/events/${id}`,
            metadata: {
                eventId: event._id.toString(),
                rsvpId: rsvp._id.toString(),
                userId: userId.toString()
            }
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify Stripe payment for event
export const verifyStripePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionId } = req.body;
        const userId = req.user._id;

        // Check if Stripe is initialized
        if (!stripeInstance) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not initialized',
                error: 'STRIPE_NOT_INITIALIZED'
            });
        }

        // Retrieve checkout session
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

        // Check if payment is successful
        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: `Payment not completed. Status: ${session.payment_status}`
            });
        }

        // Get RSVP ID from session metadata
        const { rsvpId } = session.metadata;

        // Update RSVP status
        const rsvp = await eventRSVPModel.findById(rsvpId);
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Update RSVP with payment details
        rsvp.status = 'confirmed';
        rsvp.paymentStatus = 'paid';
        rsvp.paymentDetails = {
            gateway: 'stripe',
            orderId: session.id,
            paymentId: session.payment_intent,
            amount: session.amount_total / 100, // Convert from cents to dollars/rupees
            currency: session.currency,
            paidAt: new Date()
        };

        await rsvp.save();

        // Get event details
        const event = await eventModel.findById(id);

        // Send confirmation email
        try {
            const user = await userModel.findById(userId);
            await sendEmail({
                to: user.email,
                subject: `Payment Confirmation: ${event.title}`,
                template: 'eventPaymentConfirmation',
                data: {
                    name: user.name,
                    eventTitle: event.title,
                    eventDate: new Date(event.date).toLocaleDateString(),
                    eventTime: new Date(event.date).toLocaleTimeString(),
                    eventLocation: event.location,
                    amount: session.amount_total / 100,
                    currency: session.currency,
                    paymentId: session.payment_intent,
                    meetingLink: event.locationType === 'online' ? event.meetingLink : ''
                }
            });
        } catch (emailError) {
            console.error('Error sending payment confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Payment verified and RSVP confirmed',
            rsvp: {
                status: rsvp.status,
                paymentStatus: rsvp.paymentStatus,
                paymentDetails: rsvp.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error verifying Stripe payment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cancel RSVP
export const cancelRsvp = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find the RSVP
        const rsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Update RSVP status
        rsvp.status = 'cancelled';
        await rsvp.save();

        // Get event details
        const event = await eventModel.findById(id);

        // Send cancellation email
        try {
            const user = await userModel.findById(userId);
            await sendEmail({
                to: user.email,
                subject: `RSVP Cancellation: ${event.title}`,
                template: 'eventRsvpCancellation',
                data: {
                    name: user.name,
                    eventTitle: event.title,
                    eventDate: new Date(event.date).toLocaleDateString(),
                    eventTime: new Date(event.date).toLocaleTimeString()
                }
            });
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'RSVP cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add event to Google Calendar
export const addToCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find the RSVP
        const rsvp = await eventRSVPModel.findOne({ eventId: id, userId });
        if (!rsvp) {
            return res.status(404).json({
                success: false,
                message: 'RSVP not found'
            });
        }

        // Get event details
        const event = await eventModel.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Generate Google Calendar event URL
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + event.duration * 60000); // Add duration in minutes

        const startDateStr = startDate.toISOString().replace(/-|:|\.\d+/g, '');
        const endDateStr = endDate.toISOString().replace(/-|:|\.\d+/g, '');

        const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDateStr}/${endDateStr}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;

        // Update RSVP
        rsvp.addedToCalendar = true;
        await rsvp.save();

        res.json({
            success: true,
            calendarUrl
        });
    } catch (error) {
        console.error('Error adding to calendar:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's RSVPs
export const getUserRsvps = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = { userId };
        if (status) {
            query.status = status;
        }

        // Get RSVPs with pagination
        const rsvps = await eventRSVPModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalRsvps = await eventRSVPModel.countDocuments(query);

        // Get event details for each RSVP
        const rsvpsWithEvents = await Promise.all(rsvps.map(async (rsvp) => {
            const event = await eventModel.findById(rsvp.eventId);
            return {
                ...rsvp.toObject(),
                event: event ? event.toObject() : null
            };
        }));

        res.json({
            success: true,
            rsvps: rsvpsWithEvents,
            pagination: {
                total: totalRsvps,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalRsvps / limit)
            }
        });
    } catch (error) {
        console.error('Error getting user RSVPs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Send event reminders (to be called by a scheduled job)
export const sendEventReminders = async () => {
    try {
        // Find events happening in the next 24 hours
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingEvents = await eventModel.find({
            date: { $gte: now, $lte: tomorrow },
            status: 'upcoming'
        });

        for (const event of upcomingEvents) {
            // Find confirmed RSVPs that haven't received a reminder
            const rsvps = await eventRSVPModel.find({
                eventId: event._id,
                status: 'confirmed',
                reminderSent: false
            });

            for (const rsvp of rsvps) {
                try {
                    // Send reminder email
                    await sendEmail({
                        to: rsvp.email,
                        subject: `Reminder: ${event.title} is happening soon!`,
                        template: 'eventReminder',
                        data: {
                            name: rsvp.name,
                            eventTitle: event.title,
                            eventDate: new Date(event.date).toLocaleDateString(),
                            eventTime: new Date(event.date).toLocaleTimeString(),
                            eventLocation: event.location,
                            meetingLink: event.locationType === 'online' ? event.meetingLink : ''
                        }
                    });

                    // Update RSVP
                    rsvp.reminderSent = true;
                    await rsvp.save();

                    console.log(`Reminder sent to ${rsvp.email} for event ${event.title}`);
                } catch (emailError) {
                    console.error(`Error sending reminder to ${rsvp.email}:`, emailError);
                }
            }
        }

        return {
            success: true,
            message: `Reminders sent for ${upcomingEvents.length} upcoming events`
        };
    } catch (error) {
        console.error('Error sending event reminders:', error);
        return {
            success: false,
            message: error.message
        };
    }
};

// Update event status based on date (to be called by a scheduled job)
export const updateEventStatuses = async () => {
    try {
        const now = new Date();

        // Update upcoming events to ongoing if they've started
        await eventModel.updateMany(
            {
                date: { $lte: now },
                status: 'upcoming'
            },
            {
                status: 'ongoing'
            }
        );

        // Update ongoing events to completed if they've ended
        // (date + duration minutes)
        const ongoingEvents = await eventModel.find({ status: 'ongoing' });

        for (const event of ongoingEvents) {
            const endTime = new Date(event.date.getTime() + event.duration * 60000);
            if (now >= endTime) {
                event.status = 'completed';
                await event.save();
            }
        }

        return {
            success: true,
            message: 'Event statuses updated successfully'
        };
    } catch (error) {
        console.error('Error updating event statuses:', error);
        return {
            success: false,
            message: error.message
        };
    }
};