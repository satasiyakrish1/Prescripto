import { google } from 'googleapis';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Configure OAuth client settings
oauth2Client.setCredentials({
    prompt: 'consent',
    access_type: 'offline'
});

// Set application name for Google OAuth consent screen
const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
oauth2Client._options = {
    ...oauth2Client._options,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
};

const fitness = google.fitness('v1');

export const getAuthUrl = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const scopes = [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.body.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: user._id.toString()
        });

        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ success: false, message: 'Failed to generate auth URL' });
    }
};

export const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            throw new Error('Authorization code is missing');
        }

        if (!state) {
            throw new Error('User state is missing');
        }

        // Find user by ID from state parameter
        const user = await userModel.findById(state);
        if (!user) {
            throw new Error('User not found');
        }

        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens || !tokens.access_token) {
            throw new Error('Invalid token response');
        }
        
        // Store tokens in user's database record
        user.googleFitTokens = tokens;
        await user.save();

        res.redirect('/google-fit?status=success');
    } catch (error) {
        console.error('Error handling callback:', error);
        const errorMessage = error.message || 'Authentication failed';
        res.redirect(`/google-fit?error=${encodeURIComponent(errorMessage)}`);
    }
};

export const getConnectionStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isConnected = Boolean(user.googleFitTokens);
        res.json({ success: true, isConnected });
    } catch (error) {
        console.error('Error checking connection status:', error);
        res.status(500).json({ success: false, message: 'Failed to check connection status' });
    }
};

export const getFitnessData = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.googleFitTokens) {
            return res.status(400).json({ success: false, message: 'Not connected to Google Fit' });
        }

        // Check if token needs refresh
        if (!user.googleFitTokens.access_token || 
            (user.googleFitTokens.expiry_date && Date.now() >= user.googleFitTokens.expiry_date)) {
            try {
                if (!user.googleFitTokens.refresh_token) {
                    return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
                }
                const { tokens } = await oauth2Client.refreshToken(user.googleFitTokens.refresh_token);
                if (!tokens || !tokens.access_token) {
                    return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
                }
                user.googleFitTokens = tokens;
                await user.save();
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
            }
        }

        oauth2Client.setCredentials(user.googleFitTokens);

        const now = Date.now();
        const startTime = new Date(now - 24 * 60 * 60 * 1000).getTime();

        const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [
                    { dataTypeName: 'com.google.step_count.delta' },
                    { dataTypeName: 'com.google.calories.expended' },
                    { dataTypeName: 'com.google.active_minutes' }
                ],
                bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
                startTimeMillis: startTime,
                endTimeMillis: now
            },
            auth: oauth2Client
        });

        const fitnessData = {
            steps: response.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0,
            calories: Math.round(response.data.bucket[0]?.dataset[1]?.point[0]?.value[0]?.fpVal || 0),
            activeMinutes: response.data.bucket[0]?.dataset[2]?.point[0]?.value[0]?.intVal || 0
        };

        res.json({ success: true, fitnessData });
    } catch (error) {
        console.error('Error fetching fitness data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch fitness data' });
    }
};