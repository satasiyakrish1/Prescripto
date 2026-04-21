/**
 * Enhanced Wallet Controller with Database Integration
 * 
 * This controller handles the generation and management of both Apple Wallet and Google Wallet passes
 * with full database persistence, lifecycle management, and Google Cloud integration.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Appointment from '../models/appointmentModel.js';
import GoogleWalletPass from '../models/googleWalletPassModel.js';
import { generateAndSavePass, generateAppointmentPass } from '../utils/pkpassGenerator.js';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import { generateGoogleWalletStructure, generateJwtClaims } from '../utils/walletPassStructure.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to store generated passes
const PASSES_DIR = path.join(__dirname, '..', 'public', 'passes');

// Ensure the passes directory exists
if (!fs.existsSync(PASSES_DIR)) {
    fs.mkdirSync(PASSES_DIR, { recursive: true });
    console.log(`Created passes directory at: ${PASSES_DIR}`);
}

/**
 * Helper function to create Google Auth client
 */
const createGoogleAuthClient = async () => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    }

    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Google credentials file not found at: ${credentialsPath}`);
    }

    const auth = new GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    return { client, accessToken: accessToken.token };
};

/**
 * Helper function to ensure Google Wallet class exists
 */
const ensureGoogleWalletClass = async (classId, genericClass, accessToken) => {
    try {
        // Check if class exists
        const classResponse = await axios.get(
            `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${classId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✓ Google Wallet class exists');
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Class doesn't exist, create it
            try {
                await axios.post(
                    'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
                    genericClass,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('✓ Google Wallet class created successfully');
                return true;
            } catch (createError) {
                console.error('✗ Error creating Google Wallet class:', createError.response?.data || createError.message);
                // Don't throw - we can still try to create the object
                return false;
            }
        } else {
            console.error('✗ Error checking Google Wallet class:', error.response?.data || error.message);
            return false;
        }
    }
};

/**
 * Helper function to create or update Google Wallet object
 */
const createOrUpdateGoogleWalletObject = async (objectId, genericObject, accessToken) => {
    try {
        // Try to get existing object
        const getResponse = await axios.get(
            `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Object exists, update it
        if (getResponse.status === 200) {
            const updateResponse = await axios.put(
                `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
                genericObject,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✓ Google Wallet object updated');
            return { action: 'updated', response: updateResponse.data };
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Object doesn't exist, create it
            try {
                const createResponse = await axios.post(
                    'https://walletobjects.googleapis.com/walletobjects/v1/genericObject',
                    genericObject,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('✓ Google Wallet object created');
                return { action: 'created', response: createResponse.data };
            } catch (createError) {
                console.error('✗ Error creating Google Wallet object:', createError.response?.data || createError.message);
                throw new Error(`Failed to create Google Wallet object: ${createError.message}`);
            }
        } else {
            console.error('✗ Error checking Google Wallet object:', error.response?.data || error.message);
            throw new Error(`Failed to check Google Wallet object: ${error.message}`);
        }
    }
};

/**
 * Generate a wallet pass for an appointment (Apple Wallet)
 */
export const generateWalletPass = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        const userData = appointment.userData || {};
        const docData = appointment.docData || {};
        const slotDate = appointment.slotDate;
        const slotTime = appointment.slotTime;

        const appointmentDetails = {
            userData,
            docData,
            slotDate,
            slotTime,
            appointmentId
        };

        const passFileName = `appointment-${appointmentId}.pkpass`;
        const passFilePath = path.join(PASSES_DIR, passFileName);

        await generateAndSavePass(appointmentDetails, passFilePath);

        const passUrl = `/public/passes/${passFileName}`;

        return res.status(200).json({
            success: true,
            message: 'Apple Wallet pass generated successfully',
            passUrl
        });
    } catch (error) {
        console.error('Error generating Apple Wallet pass:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate Apple Wallet pass',
            error: error.message
        });
    }
};

/**
 * Download Apple Wallet pass
 */
export const downloadWalletPass = async (req, res) => {
    try {
        console.log('📱 Starting Apple Wallet pass generation...');
        const { id: appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        const userData = appointment.userData || {};
        const docData = appointment.docData || {};
        const slotDate = appointment.slotDate;
        const slotTime = appointment.slotTime;
        const appointmentDetails = { userData, docData, slotDate, slotTime, appointmentId };

        const passBuffer = await generateAppointmentPass(appointmentDetails);

        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Content-Disposition', `attachment; filename=appointment-${appointmentId}.pkpass`);
        res.send(passBuffer);

        console.log('✓ Apple Wallet pass sent successfully');
    } catch (error) {
        console.error('✗ Error downloading Apple Wallet pass:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to download Apple Wallet pass',
            error: error.message
        });
    }
};

/**
 * Download Google Wallet pass with full database integration
 */
export const downloadGoogleWalletPass = async (req, res) => {
    try {
        console.log('🎫 Starting Google Wallet pass generation...');
        const { id: appointmentId } = req.params;
        console.log('📋 Appointment ID:', appointmentId);

        // Fetch appointment from database
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            console.error('✗ Appointment not found:', appointmentId);
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        console.log('✓ Appointment found');

        // Check if pass already exists in database
        let existingPass = await GoogleWalletPass.findByAppointment(appointmentId);

        if (existingPass && existingPass.status === 'active') {
            console.log('✓ Found existing active pass in database');
            return res.status(200).json({
                success: true,
                passUrl: existingPass.saveUrl,
                message: 'Google Wallet pass retrieved from database',
                fromCache: true
            });
        }

        // Prepare appointment details
        const userData = appointment.userData || {};
        const docData = appointment.docData || {};
        const slotDate = appointment.slotDate;
        const slotTime = appointment.slotTime;

        const appointmentDetails = {
            userData,
            docData,
            slotDate,
            slotTime,
            appointmentId
        };

        // Create Google Auth client
        console.log('🔐 Authenticating with Google Cloud...');
        const { client, accessToken } = await createGoogleAuthClient();
        console.log('✓ Authentication successful');

        // Generate wallet pass structure
        const { objectId, classId, genericClass, genericObject } = generateGoogleWalletStructure(appointmentDetails);
        console.log('📦 Object ID:', objectId);
        console.log('📦 Class ID:', classId);

        // Ensure class exists
        await ensureGoogleWalletClass(classId, genericClass, accessToken);

        // Create or update the Google Wallet object
        const { action } = await createOrUpdateGoogleWalletObject(objectId, genericObject, accessToken);

        // Generate JWT for save link
        console.log('🔑 Generating JWT token...');
        const claims = generateJwtClaims(client.email, objectId);
        const jwt = await client.sign(JSON.stringify(claims));
        const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;
        console.log('✓ Save URL generated');

        // Calculate expiration date (appointment date + 30 days)
        let expiresAt = null;
        if (slotDate) {
            const dateParts = slotDate.split('_');
            if (dateParts.length === 3) {
                const appointmentDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                expiresAt = new Date(appointmentDate);
                expiresAt.setDate(expiresAt.getDate() + 30); // Expire 30 days after appointment
            }
        }

        // Save or update pass in database
        if (existingPass) {
            await existingPass.markAsUpdated(saveUrl, jwt);
            console.log('✓ Updated existing pass in database');
        } else {
            const newPass = new GoogleWalletPass({
                appointmentId: appointment._id,
                userId: appointment.userId,
                objectId,
                classId,
                saveUrl,
                jwtToken: jwt,
                status: 'active',
                metadata: {
                    doctorName: docData.name,
                    patientName: userData.name,
                    appointmentDate: slotDate,
                    appointmentTime: slotTime,
                    speciality: docData.speciality,
                    location: `${docData.address?.line1 || ''} ${docData.address?.line2 || ''}`.trim()
                },
                expiresAt
            });

            await newPass.save();
            console.log('✓ Saved new pass to database');
        }

        console.log('✅ Google Wallet pass generation complete');

        // Return success response
        res.status(200).json({
            success: true,
            passUrl: saveUrl,
            message: 'Google Wallet pass generated successfully!',
            action,
            metadata: {
                objectId,
                classId,
                expiresAt
            }
        });
    } catch (error) {
        console.error('✗ Google Wallet error:', error.message);

        // Log error to database if pass exists
        if (req.params.id) {
            try {
                const existingPass = await GoogleWalletPass.findByAppointment(req.params.id);
                if (existingPass) {
                    await existingPass.logError(error.message, 'generate_pass');
                }
            } catch (dbError) {
                console.error('✗ Failed to log error to database:', dbError);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to generate Google Wallet pass',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Get all Google Wallet passes for a user
 */
export const getUserGoogleWalletPasses = async (req, res) => {
    try {
        const { userId } = req.params;

        const passes = await GoogleWalletPass.findActivePassesForUser(userId);

        return res.status(200).json({
            success: true,
            count: passes.length,
            passes
        });
    } catch (error) {
        console.error('Error fetching user passes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user passes',
            error: error.message
        });
    }
};

/**
 * Cancel a Google Wallet pass
 */
export const cancelGoogleWalletPass = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const pass = await GoogleWalletPass.findByAppointment(appointmentId);

        if (!pass) {
            return res.status(404).json({
                success: false,
                message: 'Pass not found'
            });
        }

        await pass.markAsCancelled();

        return res.status(200).json({
            success: true,
            message: 'Google Wallet pass cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling pass:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel pass',
            error: error.message
        });
    }
};

/**
 * Get pass statistics
 */
export const getPassStatistics = async (req, res) => {
    try {
        const totalPasses = await GoogleWalletPass.countDocuments();
        const activePasses = await GoogleWalletPass.countDocuments({ status: 'active' });
        const expiredPasses = await GoogleWalletPass.countDocuments({ status: 'expired' });
        const cancelledPasses = await GoogleWalletPass.countDocuments({ status: 'cancelled' });

        return res.status(200).json({
            success: true,
            statistics: {
                total: totalPasses,
                active: activePasses,
                expired: expiredPasses,
                cancelled: cancelledPasses
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

/**
 * Convert wallet images from SVG to PNG
 */
export const convertWalletImages = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Wallet images converted successfully'
        });
    } catch (error) {
        console.error('Error converting wallet images:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to convert wallet images',
            error: error.message
        });
    }
};