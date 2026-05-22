import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import speakeasy from 'speakeasy';
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import LoginHistory from "../models/loginHistoryModel.js";
import UserNotification from "../models/userNotificationModel.js"; // Import UserNotification
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';
import { sendAppointmentConfirmation } from '../utils/emailService.js';
import { createPaymentLink as createZohoPaymentLink, listZohoPaymentAccounts, getPaymentLink as getZohoPaymentLink } from '../utils/zohoPaymentsService.js';
import { getZohoUserInfo } from '../utils/zohoOAuth.js';
import { sendAppointmentCancellation } from '../utils/emailReminderService.js';
import { sendAppointmentConfirmationSMS } from '../utils/smsService.js';
import { sendBookingConfirmation, sendAppointmentCancellation as sendZohoCancellation, sendPaymentCompletion } from '../utils/zohoWebhookService.js';
import { parseAppointmentDateTime } from '../utils/dateHelper.js';

// In-memory SSE clients for notification settings keyed by userId
const notificationSettingsStreams = new Map();

// Helper to push SSE event to a specific user
function pushNotificationSettingsEvent(userId, payload) {
    const clients = notificationSettingsStreams.get(String(userId));
    if (!clients || clients.size === 0) return;
    const data = JSON.stringify(payload);
    for (const res of clients) {
        try {
            res.write(`event: update\n`);
            res.write(`data: ${data}\n\n`);
        } catch (_) {
            // ignore broken pipe
        }
    }
}

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields: name, email, and password' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address" })
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.status(201).json({ success: true, token })

    } catch (error) {
        console.error('Registration error:', error)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Invalid input data' })
        }
        res.status(500).json({ success: false, message: 'Server error during registration' })
    }
}

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            // Check if 2FA is enabled
            if (user.twoFactorAuth && user.twoFactorAuth.enabled) {
                return res.json({
                    success: true,
                    twoFactorRequired: true,
                    userId: user._id,
                    message: "Two-Factor Authentication required"
                });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

            // Record login history
            const loginHistory = new LoginHistory({
                userId: user._id,
                userType: 'user',
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers['user-agent']?.split('(')[1]?.split(')')[0] || 'Unknown Device',
                userAgent: req.headers['user-agent'] || 'Unknown'
            });
            await loginHistory.save();

            // Check login count to determine if it's the first time
            const loginCount = await LoginHistory.countDocuments({ userId: user._id });

            const currentTime = new Date().toLocaleString();

            // Create "Hello" notification (always)
            await UserNotification.create({
                userId: user._id,
                title: 'Hello!',
                message: `Hello ${user.name}, hope you are having a great day!`,
                type: 'info'
            });

            if (loginCount === 1) {
                // First time login
                await UserNotification.create({
                    userId: user._id,
                    title: 'Welcome to Prescripto!',
                    message: 'We are excited to have you on board. Explore our features and book your first appointment.',
                    type: 'welcome'
                });
            } else {
                // Subsequent login
                await UserNotification.create({
                    userId: user._id,
                    title: 'Welcome Back!',
                    message: `Good to see you again. You logged in at ${currentTime}.`,
                    type: 'info'
                });
            }

            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to change password
const changePassword = async (req, res) => {
    try {
        const { userId } = req.body;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
};

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.status(400).json({ success: false, message: "Required fields are missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime, bookingMode, isEmergency, customSlotId } = req.body;
        const docData = await doctorModel.findById(docId).select("-password");
        const userData = await userModel.findById(userId).select("-password");

        // Check for booking suspension
        if (userData.bookingBlockedUntil && new Date(userData.bookingBlockedUntil) > new Date()) {
            return res.json({
                success: false,
                message: `Booking privileges suspended until ${new Date(userData.bookingBlockedUntil).toDateString()} due to repeated no-shows.`
            });
        }

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        let slots_booked = docData.slots_booked;
        let appointmentAmount = docData.fees;
        let finalSlotDate = slotDate;
        let finalSlotTime = slotTime;

        // Handle different booking modes
        if (bookingMode === 'instant') {
            // For instant booking, create a unique slot identifier
            const now = new Date();
            finalSlotDate = now.getDate() + "_" + (now.getMonth() + 1) + "_" + now.getFullYear();
            finalSlotTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Set amount based on emergency status
            if (isEmergency) {
                appointmentAmount = docData.emergencyFee || Math.round(docData.fees * 1.5);
            } else {
                appointmentAmount = docData.fees;
            }

            // Add to slots_booked
            if (!slots_booked[finalSlotDate]) {
                slots_booked[finalSlotDate] = [];
            }
            slots_booked[finalSlotDate].push(finalSlotTime);

        } else if (bookingMode === 'custom') {
            // For custom slots, validate the slot exists and is available
            const customSlot = docData.customSlots?.find(slot => slot.id === customSlotId);
            if (!customSlot) {
                return res.json({ success: false, message: 'Custom slot not found' });
            }

            appointmentAmount = customSlot.price;
            finalSlotDate = 'custom_' + customSlotId;
            finalSlotTime = customSlot.startTime;

            // Add to slots_booked
            if (!slots_booked[finalSlotDate]) {
                slots_booked[finalSlotDate] = [];
            }
            slots_booked[finalSlotDate].push(finalSlotTime);

        } else {
            // Default booking mode - check slot availability
            if (slots_booked[finalSlotDate]) {
                if (slots_booked[finalSlotDate].includes(finalSlotTime)) {
                    return res.json({ success: false, message: 'Slot Not Available' });
                } else {
                    slots_booked[finalSlotDate].push(finalSlotTime);
                }
            } else {
                slots_booked[finalSlotDate] = [];
                slots_booked[finalSlotDate].push(finalSlotTime);
            }
        }

        delete docData.slots_booked;

        // Calculate scheduledAt timestamp for auto-cancellation tracking
        const scheduledAt = parseAppointmentDateTime(finalSlotDate, finalSlotTime);

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: appointmentAmount,
            slotTime: finalSlotTime,
            slotDate: finalSlotDate,
            date: Date.now(),
            scheduledAt, // Add scheduledAt for auto-cancellation tracking
            status: 'booked', // Set initial status
            bookingMode: bookingMode || 'default',
            isEmergency: isEmergency || false,
            customSlotId: customSlotId || null
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Send email and SMS notifications
        try {
            const emailResult = await sendAppointmentConfirmation(
                appointmentData,
                userData.email,
                docData.email
            );

            // Send SMS notification only to the patient
            await sendAppointmentConfirmationSMS(appointmentData);

            // Send booking confirmation to Zoho webhook
            const webhookResult = await sendBookingConfirmation({
                ...appointmentData,
                _id: newAppointment._id
            });

            if (webhookResult.success) {
                console.log('Booking data sent to Zoho webhook successfully');
            } else {
                console.warn('Failed to send booking data to Zoho webhook:', webhookResult.error);
            }

            if (emailResult.success) {
                // Update email sent status
                await appointmentModel.findByIdAndUpdate(newAppointment._id, { emailSent: true });
                res.json({ success: true, message: 'Appointment Booked and notifications sent' });
            } else {
                console.error('Failed to send notifications:', emailResult.error);
                res.json({ success: true, message: 'Appointment Booked but failed to send notifications' });
            }
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            res.json({ success: true, message: 'Appointment Booked but failed to send notifications' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        // Send cancellation emails
        try {
            const userData = await userModel.findById(userId).select("-password");
            const emailResult = await sendAppointmentCancellation({
                userData,
                docData: appointmentData.docData,
                slotDate,
                slotTime
            });

            // Send cancellation to Zoho webhook
            const webhookResult = await sendZohoCancellation(appointmentData);

            if (webhookResult.success) {
                console.log('Cancellation data sent to Zoho webhook successfully');
            } else {
                console.warn('Failed to send cancellation data to Zoho webhook:', webhookResult.error);
            }

            if (emailResult.success) {
                res.json({ success: true, message: 'Appointment Cancelled and notification emails sent' });
            } else {
                console.error('Failed to send cancellation emails:', emailResult.error);
                res.json({ success: true, message: 'Appointment Cancelled but failed to send notification emails' });
            }
        } catch (emailError) {
            console.error('Error sending cancellation emails:', emailError);
            res.json({ success: true, message: 'Appointment Cancelled but failed to send notification emails' });
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor's appointment queue
const getDoctorQueue = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Get current date in the format used by the application
        const now = new Date();
        const currentDate = now.getDate() + "_" + (now.getMonth() + 1) + "_" + now.getFullYear();

        // Find all appointments for this doctor on the current date that are not cancelled
        // Include both completed and pending appointments
        const appointments = await appointmentModel.find({
            docId: doctorId,
            slotDate: currentDate,
            cancelled: false
        }).sort({ date: 1 }); // Sort by booking time (oldest first)

        // Format the queue data
        const queueData = appointments.map((appointment, index) => ({
            position: index + 1,
            patientName: appointment.userData.name,
            bookingTime: appointment.slotTime,
            isEmergency: appointment.isEmergency,
            isCompleted: appointment.isCompleted // Include completion status
        }));

        res.json({
            success: true,
            queue: queueData
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to search users by name, email, or phone (protected)
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
        }
        const regex = new RegExp(q.trim(), 'i');
        const users = await userModel
            .find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] })
            .select('_id name email phone image gender dob');
        res.json({ success: true, users });
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            const appointmentId = orderInfo.receipt;
            const appointment = await appointmentModel.findById(appointmentId);

            if (!appointment) {
                return res.json({ success: false, message: 'Appointment not found' });
            }

            // Update payment status
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

            // Send confirmation emails only after successful payment
            const emailResult = await sendAppointmentConfirmation(
                appointment,
                appointment.userData.email,
                appointment.docData.email
            );

            // Send payment completion to Zoho webhook
            const webhookResult = await sendPaymentCompletion(appointment);
            if (webhookResult.success) {
                console.log('Payment completion sent to Zoho webhook successfully');
            } else {
                console.warn('Failed to send payment completion to Zoho webhook:', webhookResult.error);
            }

            if (emailResult.success) {
                // Update email sent status
                await appointmentModel.findByIdAndUpdate(appointmentId, { emailSent: true });
                res.json({ success: true, message: "Payment Successful and confirmation emails sent" });
            } else {
                console.error('Failed to send confirmation emails:', emailResult.error);
                res.json({ success: true, message: "Payment Successful but failed to send confirmation emails" });
            }
        } else {
            res.json({ success: false, message: 'Payment Failed' });
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

            // Get appointment details for email confirmation
            const appointment = await appointmentModel.findById(appointmentId);

            if (appointment) {
                // Send confirmation emails after successful payment
                const emailResult = await sendAppointmentConfirmation(
                    appointment,
                    appointment.userData.email,
                    appointment.docData.email
                );

                // Send payment completion to Zoho webhook
                const webhookResult = await sendPaymentCompletion(appointment);
                if (webhookResult.success) {
                    console.log('Payment completion sent to Zoho webhook successfully');
                } else {
                    console.warn('Failed to send payment completion to Zoho webhook:', webhookResult.error);
                }

                if (emailResult.success) {
                    // Update email sent status
                    await appointmentModel.findByIdAndUpdate(appointmentId, { emailSent: true });
                    return res.json({ success: true, message: 'Payment Successful and confirmation emails sent' });
                } else {
                    console.error('Failed to send confirmation emails:', emailResult.error);
                }
            }
            return res.json({ success: true, message: 'Payment Successful' });
        }
        res.json({ success: false, message: 'Payment Failed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Zoho Payments
const paymentZoho = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { origin } = req.headers;

        // Test mode is handled in the createZohoPaymentLink service
        // Remove duplicate test mode logic from controller

        // Validate Zoho configuration early to avoid generic 500s
        const missing = [];
        if (!process.env.ZOHO_PAYMENTS_ACCOUNT_ID) missing.push('ZOHO_PAYMENTS_ACCOUNT_ID');
        const hasStatic = !!process.env.ZOHO_PAYMENTS_OAUTH_TOKEN;
        const hasDynamic = !!(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN);
        if (!hasStatic && !hasDynamic) {
            missing.push('ZOHO_PAYMENTS_OAUTH_TOKEN or (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN)');
        }
        if (missing.length) {
            return res.status(500).json({
                success: false,
                message: 'Zoho Payments configuration incomplete',
                missing,
            });
        }

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' });
        }

        const description = `Appointment Fees for ${appointment.docData.name}`;
        // For local development, use a placeholder URL or make it optional
        // For production, use your actual domain
        const return_url = origin && !origin.includes('localhost')
            ? `${origin}/verify?success=true&appointmentId=${appointment._id}`
            : process.env.PRODUCTION_FRONTEND_URL
                ? `${process.env.PRODUCTION_FRONTEND_URL}/verify?success=true&appointmentId=${appointment._id}`
                : undefined;

        const result = await createZohoPaymentLink({
            amount: appointment.amount,
            currency: (process.env.CURRENCY || 'INR'),
            reference_id: appointment._id.toString(),
            description,
            ...(return_url && { return_url }),
            email: appointment?.userData?.email,
            phone: appointment?.userData?.phone
        });

        if (!result.success || !result.url) {
            // If auth error from Zoho, include available accounts to help diagnose account mismatch
            let accounts = null;
            let oauthUser = null;
            try {
                const acc = await listZohoPaymentAccounts();
                accounts = acc.success ? acc.data : { error: acc.error };
            } catch (_) { }
            try {
                const info = await getZohoUserInfo();
                oauthUser = info.success ? info.data : { error: info.error };
            } catch (_) { }
            return res.status(500).json({
                success: false,
                message: result.error || 'Failed to create payment link',
                details: result.raw,
                account_id_used: process.env.ZOHO_PAYMENTS_ACCOUNT_ID,
                accounts,
                oauth_user: oauthUser,
            });
        }

        return res.json({
            success: true,
            payment_link_url: result.url,
            payment_link_id: result.id,
            testMode: result.testMode || false
        });
    } catch (error) {
        console.error('Zoho payment error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status
        });
        return res.status(500).json({
            success: false,
            message: error.message || 'Zoho payment error',
            details: error.response?.data || error.message
        });
    }
};

// API to verify 2FA during login
const verify2FALogin = async (req, res) => {
    try {
        const { userId, token: verificationCode } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        if (!user.twoFactorAuth || !user.twoFactorAuth.enabled) {
            return res.json({ success: false, message: "2FA is not enabled for this user" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorAuth.secret,
            encoding: 'base32',
            token: verificationCode,
            window: 2
        });

        if (verified) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

            // Record login history
            const loginHistory = new LoginHistory({
                userId: user._id,
                userType: 'user',
                ipAddress: req.ip || req.connection.remoteAddress,
                deviceInfo: req.headers['user-agent']?.split('(')[1]?.split(')')[0] || 'Unknown Device',
                userAgent: req.headers['user-agent'] || 'Unknown'
            });
            await loginHistory.save();

            // Notifications
            const loginCount = await LoginHistory.countDocuments({ userId: user._id });
            const currentTime = new Date().toLocaleString();
            await UserNotification.create({
                userId: user._id,
                title: 'Hello!',
                message: `Hello ${user.name}, hope you are having a great day!`,
                type: 'info'
            });

            if (loginCount === 1) {
                await UserNotification.create({
                    userId: user._id,
                    title: 'Welcome to Prescripto!',
                    message: 'We are excited to have you on board. Explore our features and book your first appointment.',
                    type: 'welcome'
                });
            } else {
                await UserNotification.create({
                    userId: user._id,
                    title: 'Welcome Back!',
                    message: `Good to see you again. You logged in at ${currentTime}.`,
                    type: 'info'
                });
            }

            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid verification code" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to verify Zoho payment by fetching link status from Zoho
const verifyZoho = async (req, res) => {
    try {
        const { appointmentId, payment_link_id } = req.body;

        if (!payment_link_id && !appointmentId) {
            return res.status(400).json({ success: false, message: 'payment_link_id or appointmentId required' });
        }

        // Allow test mode
        if (process.env.ZOHO_PAYMENTS_TEST_MODE === 'true') {
            console.log('[ZohoPayments] Test mode - verifying mock payment');
            console.log('[ZohoPayments] Appointment ID:', appointmentId);
            console.log('[ZohoPayments] Payment Link ID:', payment_link_id);

            if (appointmentId) {
                // Update appointment status in test mode
                const appointment = await appointmentModel.findById(appointmentId);
                if (appointment) {
                    console.log('[ZohoPayments] Found appointment, updating payment status');

                    // Update payment status
                    await appointmentModel.findByIdAndUpdate(appointmentId, {
                        payment: true,
                        paymentMethod: 'Zoho Payments (Test Mode)',
                        paymentId: payment_link_id
                    });

                    // Get updated appointment for email
                    const updatedAppointment = await appointmentModel.findById(appointmentId);

                    // Send confirmation email
                    try {
                        console.log('[ZohoPayments] Sending confirmation email');
                        const emailResult = await sendAppointmentConfirmation(
                            updatedAppointment,
                            updatedAppointment.userData.email,
                            updatedAppointment.docData.email
                        );

                        if (emailResult.success) {
                            await appointmentModel.findByIdAndUpdate(appointmentId, { emailSent: true });
                        }
                    } catch (emailError) {
                        console.error('Failed to send confirmation email:', emailError);
                    }

                    // Send webhook notification
                    try {
                        console.log('[ZohoPayments] Sending webhook notification');
                        await sendPaymentCompletion(updatedAppointment);
                    } catch (webhookError) {
                        console.error('Failed to send webhook notification:', webhookError);
                    }
                } else {
                    console.log('[ZohoPayments] Appointment not found with ID:', appointmentId);
                    return res.status(404).json({ success: false, message: 'Appointment not found' });
                }
            }

            return res.json({
                success: true,
                message: 'Payment verified successfully (test mode)',
                paymentStatus: 'paid',
                testMode: true,
                appointmentId: appointmentId,
                paymentLinkId: payment_link_id
            });
        }

        // Allow mapping via appointment reference_id if payment_link_id is missing
        let linkId = payment_link_id;
        if (!linkId) {
            // In a real integration, you may store payment_link_id on appointment when creating
            // Here we expect client to pass it; otherwise return informative error
            return res.status(400).json({ success: false, message: 'payment_link_id is required to verify Zoho payment' });
        }

        const result = await getZohoPaymentLink(linkId);
        if (!result.success) {
            return res.status(502).json({ success: false, message: 'Failed to verify payment with Zoho', details: result.error || result.raw });
        }

        const link = result.link?.payment_link || result.link;
        const status = link?.status || link?.payment_status || link?.state;
        const isPaid = /^paid|completed|success$/i.test(status || '');

        if (!isPaid) {
            return res.json({ success: false, message: `Payment not completed. Current status: ${status || 'unknown'}` });
        }

        if (appointmentId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            const appointment = await appointmentModel.findById(appointmentId);
            if (appointment) {
                const emailResult = await sendAppointmentConfirmation(
                    appointment,
                    appointment.userData.email,
                    appointment.docData.email
                );
                const webhookResult = await sendPaymentCompletion(appointment);
                if (!webhookResult.success) {
                    console.warn('Failed to send payment completion to Zoho webhook:', webhookResult.error);
                }
                if (emailResult.success) {
                    await appointmentModel.findByIdAndUpdate(appointmentId, { emailSent: true });
                }
            }
        }

        return res.json({ success: true, message: 'Payment Successful', status });
    } catch (error) {
        console.error('Zoho verify error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Zoho verify error' });
    }
};

// API to create donation order using Razorpay
const createDonation = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }

        // Creating options for razorpay payment
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: currency || process.env.CURRENCY || 'INR',
            receipt: receipt,
            notes: notes || {}
        };

        // Create an order
        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order });

    } catch (error) {
        console.error('Donation order creation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create donation order' });
    }
};

// API to verify donation payment
const verifyDonation = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'All payment details are required' });
        }

        // Fetch order info to verify payment status
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            // Here you could save donation details to database if needed
            res.json({ success: true, message: 'Donation successful' });
        } else {
            res.json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Donation verification error:', error);
        res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
    }
};

// API to update user skills
const updateSkills = async (req, res) => {
    try {
        const { userId } = req.body;
        const { skills } = req.body;

        if (!Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: "Skills must be an array"
            });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { skills },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: 'Skills updated successfully',
            user
        });

    } catch (error) {
        console.error('Error updating skills:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating skills'
        });
    }
};

// API to update social links
const updateSocialLinks = async (req, res) => {
    try {
        const { userId } = req.body;
        const { socialLinks } = req.body;

        if (!socialLinks || typeof socialLinks !== 'object') {
            return res.status(400).json({
                success: false,
                message: "Social links must be an object"
            });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { socialLinks },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: 'Social links updated successfully',
            user
        });

    } catch (error) {
        console.error('Error updating social links:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating social links'
        });
    }
};

// API to get single appointment by ID (for QR code scanning)
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await appointmentModel.findById(id);

        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        res.json({ success: true, appointment });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    getDoctorQueue,
    getAppointmentById,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe,
    paymentZoho,
    verifyZoho,
    createDonation,
    verifyDonation,
    changePassword,
    updateSkills,
    updateSocialLinks,
    // new export
    searchUsers,
    verify2FALogin
}

// ============ Notification Settings ============
export const getNotificationSettings = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select('notificationSettings');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, notificationSettings: user.notificationSettings || {} });
    } catch (error) {
        console.error('getNotificationSettings error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load notification settings' });
    }
};

export const updateNotificationSettings = async (req, res) => {
    try {
        const { userId } = req.body;
        const partial = req.body.notificationSettings || {};
        // Ensure only known keys are updated
        const allowed = ['email', 'push', 'marketing', 'loginAlerts', 'dnd'];
        const updates = {};
        for (const key of allowed) {
            if (typeof partial[key] !== 'undefined') updates[`notificationSettings.${key}`] = !!partial[key];
        }
        updates['notificationSettings.updatedAt'] = new Date();

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        ).select('notificationSettings');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Broadcast to SSE listeners for this user
        pushNotificationSettingsEvent(userId, { notificationSettings: user.notificationSettings });

        return res.json({ success: true, notificationSettings: user.notificationSettings });
    } catch (error) {
        console.error('updateNotificationSettings error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update notification settings' });
    }
};

// SSE stream for notification settings updates
export const streamNotificationSettings = async (req, res) => {
    try {
        // Accept token in query for EventSource, since custom headers are not supported
        const token = req.query.token;
        if (!token) {
            return res.status(401).end();
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (_) {
            return res.status(401).end();
        }
        const userId = String(decoded.id);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        // Send initial state
        try {
            const user = await userModel.findById(userId).select('notificationSettings');
            if (user) {
                res.write(`event: init\n`);
                res.write(`data: ${JSON.stringify({ notificationSettings: user.notificationSettings || {} })}\n\n`);
            }
        } catch (_) { }

        // Register client
        if (!notificationSettingsStreams.has(userId)) {
            notificationSettingsStreams.set(userId, new Set());
        }
        const setForUser = notificationSettingsStreams.get(userId);
        setForUser.add(res);

        // Keepalive ping
        const ping = setInterval(() => {
            try { res.write(`event: ping\n` + `data: {}\n\n`); } catch (_) { }
        }, 25000);

        req.on('close', () => {
            clearInterval(ping);
            const clients = notificationSettingsStreams.get(userId);
            if (clients) {
                clients.delete(res);
                if (clients.size === 0) notificationSettingsStreams.delete(userId);
            }
        });
    } catch (error) {
        try { res.end(); } catch (_) { }
    }
};