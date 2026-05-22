import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import adminModel from "../models/adminModel.js";
import AdminCredential from "../models/adminCredentialModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import Subscriber from "../models/subscriberModel.js";
import LoginHistoryModel from "../models/loginHistoryModel.js"; // Added LoginHistoryModel import
import { generateAppointmentsCSV } from "../utils/csvGenerator.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';
import { cloudinary } from "../config/cloudinary.js";
import prescriptionModel from "../models/prescriptionModel.js";
import Sale from "../models/saleModel.js";
import ActiveSession from "../models/activeSessionModel.js";
import { v4 as uuidv4 } from 'uuid';

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Log the received credentials for debugging (remove in production)
        console.log(`Login attempt with email: ${email}`);
        console.log(`Admin email from env: ${process.env.ADMIN_EMAIL}`);

        // Trim whitespace from inputs and env variables for consistent comparison
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
        const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

        // 1) Prefer DB-backed credential if present
        const cred = adminEmail ? await AdminCredential.findOne({ email: adminEmail.toLowerCase() }) : null;
        const matchesDb = cred && trimmedEmail.toLowerCase() === adminEmail.toLowerCase()
            ? await bcrypt.compare(trimmedPassword, cred.passwordHash)
            : false;

        // 2) Fallback to .env if DB is not set up yet
        const matchesEnv = trimmedEmail === adminEmail && trimmedPassword === adminPassword;

        if (matchesDb || matchesEnv) {
            // Get or create admin profile
            let adminProfile = await adminModel.findOne({ email: trimmedEmail });
            if (!adminProfile) {
                adminProfile = await adminModel.create({
                    email: trimmedEmail,
                    lastLogin: new Date()
                });
            } else {
                adminProfile.lastLogin = new Date();
                await adminProfile.save();
            }

            // Bootstrap DB credential from .env if DB missing but env matched
            if (!matchesDb && matchesEnv && adminEmail && adminPassword) {
                try {
                    const hash = await bcrypt.hash(adminPassword, 12);
                    await AdminCredential.findOneAndUpdate(
                        { email: adminEmail.toLowerCase() },
                        { $set: { passwordHash: hash } },
                        { upsert: true, new: true }
                    );
                } catch (e) {
                    console.error('Failed to bootstrap admin credential:', e.message);
                }
            }

            // Create a payload with admin information
            const adminPayload = {
                id: adminProfile._id,
                email: trimmedEmail,
                name: 'Admin',
                role: 'admin',
                isAdmin: true,
                timestamp: Date.now()
            };
            // Generate a session and include sessionId in token
            const sessionId = uuidv4();
            const now = new Date();
            const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const token = jwt.sign({ ...adminPayload, sessionId }, process.env.JWT_SECRET, { expiresIn: '7d' });
            
            // Persist active session
            try {
                await ActiveSession.create({
                    adminId: adminProfile._id,
                    sessionId,
                    issuedAt: now,
                    expiresAt: expires,
                    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
                    userAgent: req.headers['user-agent'] || 'Unknown User Agent',
                    deviceInfo: req.headers['user-agent']?.split('(')[1]?.split(')')[0] || 'Unknown Device'
                });
            } catch (e) {
                console.error('Failed to create active session:', e.message);
            }

            // Record login history
            if (adminProfile && adminProfile._id) {
                try {
                    const loginHistory = new LoginHistoryModel({
                        userId: adminProfile._id,
                        userType: 'Admin',
                        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
                        deviceInfo: req.headers['user-agent']?.split('(')[1]?.split(')')[0] || 'Unknown Device',
                        userAgent: req.headers['user-agent'] || 'Unknown User Agent',
                        // location: can be added here if IP to location service is integrated
                    });
                    await loginHistory.save();
                } catch (historyError) {
                    console.error('Failed to record login history for admin ID ' + adminProfile._id + ':', historyError);
                    // Decide if this error should prevent login or just be logged
                }
            } else {
                console.error('Admin profile or adminProfile._id is missing. Cannot record login history.');
            }

            // Set token in response
            res.json({ success: true, token });
        } else {
            console.log('Invalid credentials provided');
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get admin profile
const getAdminProfile = async (req, res) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL.trim();
        const profile = await adminModel.findOne({ email: adminEmail });
        if (!profile) {
            return res.json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to change admin password
const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

        if (!adminEmail) {
            return res.status(500).json({ success: false, message: 'ADMIN_EMAIL not configured' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        // Accept either DB-backed current password or .env ADMIN_PASSWORD as current
        const cred = await AdminCredential.findOne({ email: adminEmail });
        let validCurrent = false;
        if (cred) {
            validCurrent = await bcrypt.compare(currentPassword, cred.passwordHash);
        } else if (process.env.ADMIN_PASSWORD) {
            validCurrent = currentPassword === process.env.ADMIN_PASSWORD;
        }
        if (!validCurrent) {
            return res.status(403).json({ success: false, message: 'Current password is incorrect' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await AdminCredential.findOneAndUpdate(
            { email: adminEmail },
            { $set: { passwordHash } },
            { upsert: true, new: true }
        );

        // Also maintain admin profile record
        await adminModel.findOneAndUpdate(
            { email: adminEmail },
            { $set: { lastLogin: new Date() } },
            { upsert: true }
        );

        res.json({ success: true, message: 'Password updated successfully (DB)' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
};

// API to update admin profile
const updateAdminProfile = async (req, res) => {
    try {
        const { name, phone, address, image, verifyPassword, dateOfBirth, gender, bio, socialMedia, skills } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL.trim();

        // Verify master password
        if (verifyPassword !== process.env.ADMIN_MASTER_PASSWORD) {
            return res.status(403).json({ success: false, message: 'Invalid master password' });
        }

        const profile = await adminModel.findOne({ email: adminEmail });
        if (!profile) {
            return res.json({ success: false, message: 'Profile not found' });
        }

        // Update profile fields
        if (name !== undefined) profile.name = name;
        if (phone !== undefined) profile.phone = phone;
        if (address !== undefined) profile.address = address;
        if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
        if (gender !== undefined) profile.gender = gender;
        if (bio !== undefined) profile.bio = bio;
        if (socialMedia !== undefined) profile.socialMedia = { ...profile.socialMedia, ...socialMedia };
        if (skills !== undefined) profile.skills = skills;

        // Handle image upload if provided
        if (image && image.startsWith('data:image')) {
            const uploadResponse = await cloudinary.uploader.upload(image, {
                resource_type: 'image',
                folder: 'admin_profiles'
            });
            profile.image = uploadResponse.secure_url;
        }

        await profile.save();
        res.json({ success: true, message: 'Profile updated successfully', profile });
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.json({ success: false, message: error.message });
    }
};




// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address, verification } = req.body;
        const imageFile = req.file;

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.status(400).json({ success: false, message: "Missing Details" });
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        // Check if email already exists
        const existingDoctor = await doctorModel.findOne({ email });
        if (existingDoctor) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        // validating strong password
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password" });
        }

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Doctor image is required" });
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        try {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                resource_type: "image",
                folder: "doctors"
            });

            const parsedVerification = (() => {
                try { return verification ? JSON.parse(verification) : undefined } catch { return undefined }
            })()

            const doctorData = {
                name: name.trim(),
                email: email.toLowerCase(),
                image: imageUpload.secure_url,
                password: hashedPassword,
                speciality,
                degree,
                experience,
                about,
                fees: Number(fees),
                address: JSON.parse(address),
                date: Date.now(),
                // Flatten some verification for convenience & filters
                registrationNumber: parsedVerification?.registration_number || parsedVerification?.portal_registration_number,
                portalRegistrationNumber: parsedVerification?.portal_registration_number,
                stateCouncil: parsedVerification?.state_council,
                registrationYear: parsedVerification?.registered_year,
                qualificationFromPortal: parsedVerification?.qualification,
                verificationStatus: parsedVerification?.verified ? 'active' : 'unknown',
                verification: parsedVerification
            };

            const newDoctor = new doctorModel(doctorData);
            await newDoctor.save();

            res.status(201).json({ success: true, message: 'Doctor Added Successfully' });
        } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return res.status(500).json({ success: false, message: "Failed to upload doctor image" });
        }

    } catch (error) {
        console.error('Add doctor error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to add doctor",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all subscribers
const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.find({}).sort({ subscriptionDate: -1 });
        res.json({ success: true, subscribers });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        // Calculate patient demographics based on age groups
        const calculatePatientDemographics = (users) => {
            const ageGroups = {
                '0-18': { count: 0, ageGroup: '0-18' },
                '19-30': { count: 0, ageGroup: '19-30' },
                '31-50': { count: 0, ageGroup: '31-50' },
                '51-70': { count: 0, ageGroup: '51-70' },
                '70+': { count: 0, ageGroup: '70+' }
            };

            users.forEach(user => {
                if (user.dob && user.dob !== 'Not Selected') {
                    const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
                    if (age <= 18) ageGroups['0-18'].count++;
                    else if (age <= 30) ageGroups['19-30'].count++;
                    else if (age <= 50) ageGroups['31-50'].count++;
                    else if (age <= 70) ageGroups['51-70'].count++;
                    else ageGroups['70+'].count++;
                }
            });

            return Object.values(ageGroups);
        };

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse(),
            patientDemographics: calculatePatientDemographics(users)
        }

        // Get best doctor of the month
        const getBestDoctor = async () => {
            const currentDate = new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

            const doctors = await doctorModel.find({});
            const appointments = await appointmentModel.find({
                slotDate: { $gte: firstDayOfMonth },
                isCompleted: true
            });

            const doctorStats = {};

            appointments.forEach(appointment => {
                const docId = appointment.docId;
                if (!doctorStats[docId]) {
                    doctorStats[docId] = {
                        completedAppointments: 0,
                        totalRevenue: 0
                    };
                }
                doctorStats[docId].completedAppointments++;
                doctorStats[docId].totalRevenue += appointment.amount;
            });

            let bestDoctor = null;
            let maxScore = -1;

            doctors.forEach(doctor => {
                const stats = doctorStats[doctor._id] || { completedAppointments: 0, totalRevenue: 0 };
                const score = stats.completedAppointments * 0.7 + (stats.totalRevenue / 1000) * 0.3;
                if (score > maxScore) {
                    maxScore = score;
                    bestDoctor = {
                        ...doctor.toObject(),
                        stats: stats
                    };
                }
            });

            return bestDoctor;
        };

        // Add best doctor to dashboard data
        const bestDoctor = await getBestDoctor();
        dashData.bestDoctor = bestDoctor;

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to download all appointments as CSV
const downloadAppointmentsCSV = async (req, res) => {
    try {
        // Fetch all appointments from database
        const appointments = await appointmentModel.find({})

        // Generate CSV content using the utility function
        const csvContent = generateAppointmentsCSV(appointments)

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv')

        // Send CSV content as response
        res.send(csvContent)

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to remove doctor and related appointments
const removeDoctor = async (req, res) => {
    try {
        const { doctorId } = req.body

        // Remove all appointments related to this doctor
        await appointmentModel.deleteMany({ docId: doctorId })

        // Remove the doctor
        await doctorModel.findByIdAndDelete(doctorId)

        res.json({ success: true, message: 'Doctor and related appointments removed successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to download server logs
const downloadServerLogs = async (req, res) => {
    try {
        const { date, types } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required' });
        }

        // Parse the requested log types
        const requestedTypes = types ? types.split(',') : ['system', 'access', 'error', 'security'];

        // Get the current file's directory path
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);

        // Define logs directory (adjust this path to your actual logs location)
        const logsDir = path.join(__dirname, '..', 'logs');

        // Create logs directory if it doesn't exist (for testing purposes)
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Format date for filename matching
        const formattedDate = date.replace(/-/g, '');

        // Check if any log files exist before creating the archive
        let logFilesExist = false;
        const logFilePaths = [];

        // Check for log files and prepare paths
        for (const type of requestedTypes) {
            const logFilename = `${type}_${formattedDate}.log`;
            const logPath = path.join(logsDir, logFilename);

            if (fs.existsSync(logPath)) {
                logFilesExist = true;
                logFilePaths.push({ path: logPath, name: logFilename });
            } else {
                // For testing/development, create a sample log file if it doesn't exist
                const sampleContent = `Sample ${type} log for ${date}\nThis is a placeholder log file.\n`;
                fs.writeFileSync(logPath, sampleContent);
                logFilesExist = true;
                logFilePaths.push({ path: logPath, name: logFilename });
            }
        }

        if (!logFilesExist) {
            // If no log files were found, return an error
            return res.status(404).json({
                success: false,
                message: `No log files found for date: ${date}`
            });
        }

        // Create a zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set the response headers for file download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=server-logs-${date}.zip`);

        // Set up proper error handling for the archive
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            // Don't try to send headers if they've already been sent
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: `Error creating archive: ${err.message}`
                });
            }
        });

        // Listen for archive warnings
        archive.on('warning', (err) => {
            console.warn('Archive warning:', err);
        });

        // Pipe the archive to the response
        archive.pipe(res);

        // Add log files to the archive
        for (const logFile of logFilePaths) {
            archive.file(logFile.path, { name: logFile.name });
        }

        // Finalize the archive and handle completion
        await archive.finalize();

    } catch (error) {
        console.error('Error downloading logs:', error);
        // Don't try to send headers if they've already been sent
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: `Error downloading logs: ${error.message}`
            });
        }
    }
};

// API to get admin login history
const getAdminLoginHistory = async (req, res) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL.trim();
        const admin = await adminModel.findOne({ email: adminEmail });

        if (!admin) {
            console.log(`Admin profile not found for email: ${adminEmail} in getAdminLoginHistory.`);
            return res.status(404).json({ success: false, message: 'Admin profile not found' });
        }

        console.log(`Fetching login history for admin ID: ${admin._id} (email: ${admin.email})`);
        const loginHistory = await LoginHistoryModel.find({ userId: admin._id }).sort({ loginTime: -1 });
        console.log(`Found ${loginHistory.length} login history records for admin ID: ${admin._id}`);

        res.json({ success: true, loginHistory });
    } catch (error) {
        console.error('Get admin login history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import UserNotification from "../models/userNotificationModel.js";

// API to get all users for admin
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select('-password');
        res.json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to send notification to users
const sendUserNotification = async (req, res) => {
    try {
        const { title, message, type, sendToAll, recipients } = req.body;

        if (!title || !message) {
            return res.json({ success: false, message: "Title and Message are required" });
        }

        let targetUserIds = [];

        if (sendToAll) {
            const users = await userModel.find({}, '_id');
            targetUserIds = users.map(user => user._id);
        } else {
            targetUserIds = recipients;
        }

        if (!targetUserIds || targetUserIds.length === 0) {
            return res.json({ success: false, message: "No recipients selected" });
        }

        const notifications = targetUserIds.map(userId => ({
            userId,
            title,
            message,
            type: type || 'info',
            createdAt: new Date()
        }));

        await UserNotification.insertMany(notifications);

        res.json({ success: true, message: `Notification sent to ${targetUserIds.length} users` });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginAdmin,
    getAllSubscribers,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    downloadAppointmentsCSV,
    removeDoctor,
    downloadServerLogs,
    getAdminLoginHistory,
    getAllUsers,
    sendUserNotification
};

// Fetch appointment details with related data
export const appointmentDetailsAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentModel.findById(id).lean();
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        const prescription = await prescriptionModel.findOne({ appointmentId: id }).lean();
        const email = appointment?.userData?.email;
        const phone = appointment?.userData?.phone;
        const name = appointment?.userData?.name;
        const sales = await Sale.find({
            $or: [
                { 'customer.email': email },
                { 'customer.phone': phone },
                { customer: name }
            ]
        }).sort({ sold_at: -1 }).limit(10).lean();
        res.json({
            success: true,
            data: {
                appointment,
                prescription,
                pharmacySales: sales
            }
        });
    } catch (error) {
        console.error('Appointment details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
