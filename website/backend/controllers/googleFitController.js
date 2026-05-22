import { google } from 'googleapis';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';

dotenv.config();

// Determine the correct redirect URI based on environment
const getRedirectUri = () => {
    // Prioritize the explicit GOOGLE_REDIRECT_URI if set
    if (process.env.GOOGLE_REDIRECT_URI) {
        return process.env.GOOGLE_REDIRECT_URI;
    }

    if (process.env.NODE_ENV === 'production') {
        // Use production backend URL if available
        const productionBackend = process.env.PRODUCTION_BACKEND_URL;
        if (productionBackend) {
            return `${productionBackend}/api/user/google-fit/callback`;
        }
    }
    return 'http://localhost:4000/api/user/google-fit/callback';
};

// Helper to create a new OAuth2 client instance
const createOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );
};

// Initialize Google Fitness API
const fitness = google.fitness('v1');

// Google Fit scopes
const GOOGLE_FIT_SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/fitness.nutrition.read',
    'https://www.googleapis.com/auth/fitness.sleep.read'
];

// Data type names for Google Fit
const DATA_TYPES = {
    STEPS: 'com.google.step_count.delta',
    CALORIES: 'com.google.calories.expended',
    DISTANCE: 'com.google.distance.delta',
    ACTIVE_MINUTES: 'com.google.active_minutes',
    HEART_RATE: 'com.google.heart_rate.bpm',
    WEIGHT: 'com.google.weight',
    HEIGHT: 'com.google.height',
    SLEEP: 'com.google.sleep.segment'
};

/**
 * Validate environment variables for Google Fit
 */
const validateConfig = () => {
    const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        const message = `Missing required Google Fit environment variables: ${missing.join(', ')}.\nLoaded env: ${JSON.stringify(process.env, null, 2)}`;
        console.error(message);
        throw new Error(message);
    }
};

/**
 * Generate Google Fit authorization URL
 */
export const getAuthUrl = async (req, res) => {
    try {
        validateConfig();
        const userId = req.user?._id;
        if (!userId) {
            console.error('User authentication required. req.user:', req.user);
            return res.status(401).json({
                success: false,
                message: 'User authentication required',
                debug: req.user
            });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            console.error('User not found for Google Fit auth. userId:', userId);
            return res.status(404).json({
                success: false,
                message: 'User not found',
                debug: userId
            });
        }

        const oauth2Client = createOAuthClient();
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GOOGLE_FIT_SCOPES,
            state: user._id.toString(),
            prompt: 'consent',
            include_granted_scopes: true
        });
        const redirectUri = getRedirectUri();
        console.log(`Generated Google Fit auth URL for user ${userId}`);
        console.log(`Using Redirect URI: ${redirectUri}`);
        res.json({
            success: true,
            authUrl,
            scopes: GOOGLE_FIT_SCOPES
        });
    } catch (error) {
        // Enhanced error logging for missing env vars or other issues
        if (error.message && error.message.includes('Missing required Google Fit environment variables')) {
            return res.status(500).json({
                success: false,
                message: error.message,
                env: process.env
            });
        }
        console.error('Error generating Google Fit auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Google Fit authorization URL',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Handle OAuth callback from Google
 */
export const handleCallback = async (req, res) => {
    const frontendUrl = process.env.NODE_ENV === 'production'
        ? (process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://prescripto.live')
        : (process.env.FRONTEND_URL || 'http://localhost:5173');

    try {
        const { code, state: userIdFromState, error: authError } = req.query;

        // Handle authorization errors
        if (authError) {
            console.error('Google authorization error:', authError);
            return res.redirect(`${frontendUrl}/google-fit?error=${encodeURIComponent('Authorization denied')}`);
        }

        if (!code) {
            return res.redirect(`${frontendUrl}/google-fit?error=${encodeURIComponent('Authorization code missing')}`);
        }

        // Check if this is a login callback
        if (userIdFromState === 'google_login') {
            return handleGoogleLoginFlow(req, res, code, frontendUrl);
        }

        // Check if this is a connect callback
        if (userIdFromState && userIdFromState.startsWith('connect_google_')) {
            const userId = userIdFromState.split('connect_google_')[1];
            return handleGoogleConnectFlow(req, res, code, frontendUrl, userId);
        }

        if (!userIdFromState) {
            return res.redirect(`${frontendUrl}/google-fit?error=${encodeURIComponent('User state missing')}`);
        }

        const user = await userModel.findById(userIdFromState);
        if (!user) {
            return res.redirect(`${frontendUrl}/google-fit?error=${encodeURIComponent('User not found')}`);
        }

        // Exchange code for tokens
        const oauth2Client = createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens?.access_token) {
            throw new Error('Failed to obtain access token');
        }

        // Enhance token data with metadata
        const enhancedTokens = {
            ...tokens,
            obtained_at: Date.now(),
            scopes: GOOGLE_FIT_SCOPES
        };

        // Save tokens to user
        user.googleFitTokens = enhancedTokens;
        user.googleFitConnectedAt = new Date();
        await user.save();

        console.log(`Google Fit connected successfully for user ${user._id}`);

        res.redirect(`${frontendUrl}/google-fit?status=success&userId=${user._id}`);

    } catch (error) {
        console.error('Error handling Google Fit callback:', error);
        const userIdParam = req.query.state ? `&userId=${encodeURIComponent(req.query.state)}` : '';
        res.redirect(`${frontendUrl}/google-fit?error=${encodeURIComponent('Authentication failed')}${userIdParam}`);
    }
};

/**
 * Check Google Fit connection status
 */
export const getConnectionStatus = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isConnected = Boolean(user.googleFitTokens?.access_token);
        const connectionInfo = {
            isConnected,
            connectedAt: user.googleFitConnectedAt || null,
            scopes: user.googleFitTokens?.scopes || []
        };

        res.json({
            success: true,
            ...connectionInfo
        });

    } catch (error) {
        console.error('Error checking connection status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check connection status'
        });
    }
};

/**
 * Refresh access tokens
 */
const refreshTokens = async (user) => {
    try {
        if (!user.googleFitTokens?.refresh_token) {
            throw new Error('No refresh token available');
        }

        const oauth2Client = createOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: user.googleFitTokens.refresh_token
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        const enhancedTokens = {
            ...user.googleFitTokens,
            ...credentials,
            refreshed_at: Date.now()
        };

        user.googleFitTokens = enhancedTokens;
        await user.save();

        return enhancedTokens;
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw new Error('Token refresh failed - re-authorization required');
    }
};

/**
 * Ensure valid access token
 */
const ensureValidToken = async (user) => {
    if (!user.googleFitTokens?.access_token) {
        throw new Error('No access token available');
    }

    const { expiry_date } = user.googleFitTokens;
    const isExpired = expiry_date && Date.now() >= expiry_date;

    if (isExpired) {
        return await refreshTokens(user);
    }

    return user.googleFitTokens;
};

/**
 * Get fitness data for a specific time range
 */
export const getFitnessData = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.googleFitTokens) {
            return res.status(400).json({
                success: false,
                message: 'Google Fit not connected'
            });
        }

        // Ensure valid token
        const tokens = await ensureValidToken(user);
        const oauth2Client = createOAuthClient();
        oauth2Client.setCredentials(tokens);

        // Parse query parameters for date range
        const { days = 7, startDate, endDate } = req.query;

        let startTime, endTime;

        if (startDate && endDate) {
            startTime = new Date(startDate).getTime();
            // Set end date to end of day if it's just a date string
            const end = new Date(endDate);
            if (endDate.length <= 10) { // YYYY-MM-DD
                end.setHours(23, 59, 59, 999);
            }
            endTime = end.getTime();
        } else {
            const daysBack = parseInt(days) || 7;
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            const start = new Date();
            start.setDate(start.getDate() - (daysBack - 1)); // Include today
            start.setHours(0, 0, 0, 0);

            startTime = start.getTime();
            endTime = end.getTime();
        }

        console.log('Fetching fitness data for user:', userId);
        console.log('Date range:', { startTime: new Date(startTime), endTime: new Date(endTime) });

        // Aggregate fitness data
        const aggregateRequest = {
            userId: 'me',
            requestBody: {
                aggregateBy: [
                    // Use derived data sources to match Google Fit app numbers (merged/estimated data)
                    { dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' },
                    { dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended' },
                    { dataSourceId: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta' },
                    { dataSourceId: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes' }
                ],
                bucketByTime: {
                    durationMillis: 24 * 60 * 60 * 1000 // Daily buckets
                },
                startTimeMillis: startTime,
                endTimeMillis: endTime
            },
            auth: oauth2Client
        };

        console.log('Making Google Fit API request...');
        const response = await fitness.users.dataset.aggregate(aggregateRequest);
        console.log('Google Fit API response received:', response.data ? 'Success' : 'No data');

        // Process response data
        const processedData = processFitnessData(response.data);
        console.log('Processed fitness data:', processedData);

        res.json({
            success: true,
            data: processedData,
            timeRange: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching fitness data:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            response: error.response?.data
        });

        if (error.message.includes('re-authorization required')) {
            return res.status(401).json({
                success: false,
                message: 'Re-authorization required',
                requiresReauth: true
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch fitness data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get detailed activity data
 */
export const getActivityData = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const user = await userModel.findById(userId);
        if (!user?.googleFitTokens) {
            return res.status(400).json({
                success: false,
                message: 'Google Fit not connected'
            });
        }

        const tokens = await ensureValidToken(user);
        const oauth2Client = createOAuthClient();
        oauth2Client.setCredentials(tokens);

        const { startDate, endDate } = req.query;
        const startTime = startDate ? new Date(startDate).getTime() : Date.now() - (7 * 24 * 60 * 60 * 1000);
        const endTime = endDate ? new Date(endDate).getTime() : Date.now();

        // Get sessions (activities)
        const sessionsResponse = await fitness.users.sessions.list({
            userId: 'me',
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            auth: oauth2Client
        });

        res.json({
            success: true,
            activities: sessionsResponse.data.session || []
        });

    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity data'
        });
    }
};

/**
 * Get heart rate data
 */
export const getHeartRateData = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const user = await userModel.findById(userId);
        if (!user?.googleFitTokens) {
            return res.status(400).json({
                success: false,
                message: 'Google Fit not connected'
            });
        }

        const tokens = await ensureValidToken(user);
        const oauth2Client = createOAuthClient();
        oauth2Client.setCredentials(tokens);

        const { days = 1 } = req.query;
        const endTime = Date.now();
        const startTime = endTime - (parseInt(days) * 24 * 60 * 60 * 1000);

        const dataSourceId = 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm';

        const heartRateResponse = await fitness.users.dataSources.datasets.get({
            userId: 'me',
            dataSourceId,
            datasetId: `${startTime * 1000000}-${endTime * 1000000}`,
            auth: oauth2Client
        });

        const heartRateData = heartRateResponse.data.point?.map(point => ({
            timestamp: new Date(parseInt(point.startTimeNanos) / 1000000),
            value: point.value[0]?.fpVal || 0
        })) || [];

        res.json({
            success: true,
            heartRateData
        });

    } catch (error) {
        console.error('Error fetching heart rate data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch heart rate data'
        });
    }
};

/**
 * Disconnect Google Fit
 */
export const disconnectGoogleFit = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Revoke tokens if they exist
        if (user.googleFitTokens?.access_token) {
            try {
                const oauth2Client = createOAuthClient();
                oauth2Client.setCredentials(user.googleFitTokens);
                await oauth2Client.revokeCredentials();
            } catch (revokeError) {
                console.warn('Failed to revoke Google tokens:', revokeError.message);
            }
        }

        // Clear stored tokens
        user.googleFitTokens = undefined;
        user.googleFitConnectedAt = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Google Fit disconnected successfully'
        });

    } catch (error) {
        console.error('Error disconnecting Google Fit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect Google Fit'
        });
    }
};

/**
 * Process and format fitness data from Google Fit response
 */
const processFitnessData = (responseData) => {
    if (!responseData?.bucket) {
        return {
            summary: { steps: 0, calories: 0, distance: 0, activeMinutes: 0 },
            daily: []
        };
    }

    const daily = responseData.bucket.map(bucket => {
        const startTime = new Date(parseInt(bucket.startTimeMillis));
        const datasets = bucket.dataset || [];

        // Use local date to avoid UTC shifts (e.g., 00:00 IST is previous day in UTC)
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0');
        const day = String(startTime.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        return {
            date: dateStr,
            steps: getDatasetValue(datasets[0]) || 0,
            calories: Math.round(getDatasetValue(datasets[1], 'fpVal') || 0),
            distance: Math.round((getDatasetValue(datasets[2], 'fpVal') || 0) / 1000 * 100) / 100, // Convert to km
            activeMinutes: Math.round((getDatasetValue(datasets[3]) || 0) / 60000)
        };
    });

    // Calculate summary totals
    const summary = daily.reduce((acc, day) => ({
        steps: acc.steps + day.steps,
        calories: acc.calories + day.calories,
        distance: Math.round((acc.distance + day.distance) * 100) / 100,
        activeMinutes: acc.activeMinutes + day.activeMinutes
    }), { steps: 0, calories: 0, distance: 0, activeMinutes: 0 });

    return { summary, daily };
};

/**
 * Extract and sum all values from dataset points
 * This fixes the accuracy issue by aggregating ALL data points, not just the first one
 */
const getDatasetValue = (dataset, valueType = 'intVal') => {
    if (!dataset?.point || dataset.point.length === 0) {
        return 0;
    }

    // Sum all points in the dataset for accurate totals
    return dataset.point.reduce((total, point) => {
        const value = point?.value?.[0]?.[valueType] || 0;
        return total + value;
    }, 0);
};

// Error handling middleware for Google Fit routes
export const handleGoogleFitError = (error, req, res, next) => {
    console.error('Google Fit API Error:', error);

    if (error.code === 403) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for Google Fit data',
            requiresReauth: true
        });
    }

    if (error.code === 401) {
        return res.status(401).json({
            success: false,
            message: 'Google Fit authorization expired',
            requiresReauth: true
        });
    }

    res.status(500).json({
        success: false,
        message: 'Google Fit service error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

/**
 * Handle Google login flow within the fitness callback
 */
const handleGoogleLoginFlow = async (req, res, code, frontendUrl) => {
    try {
        // Exchange code for tokens
        const oauth2Client = createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens?.access_token) {
            throw new Error('Failed to obtain access token');
        }

        // Set credentials to get user info
        oauth2Client.setCredentials(tokens);

        // Get user information from Google
        const oauth2 = google.oauth2('v2');
        const { data: googleUser } = await oauth2.userinfo.get({
            auth: oauth2Client
        });

        if (!googleUser.email) {
            throw new Error('Failed to get user email from Google');
        }

        // Check if user exists in database
        let user = await userModel.findOne({ email: googleUser.email });

        if (!user) {
            // Create new user if doesn't exist
            user = new userModel({
                name: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                password: 'google_oauth_user', // Placeholder password for OAuth users
                image: googleUser.picture || '',
                googleId: googleUser.id,
                isGoogleUser: true,
                connectedAccounts: {
                    google: true,
                    googleEmail: googleUser.email
                }
            });
            await user.save();
            console.log('New Google user created:', googleUser.email);
        } else {
            // Update existing user with Google info if not already set
            if (!user.googleId) {
                user.googleId = googleUser.id;
                user.isGoogleUser = true;
                if (googleUser.picture && !user.image) {
                    user.image = googleUser.picture;
                }
            }
            // Update connected accounts
            user.connectedAccounts = {
                google: true,
                googleEmail: googleUser.email
            };
            await user.save();
            console.log('Existing user logged in via Google:', googleUser.email);
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/login?token=${token}&status=success`);

    } catch (error) {
        console.error('Error in Google login flow:', error);
        res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
};

/**
 * Generate Google OAuth authorization URL for login
 */
export const getGoogleLoginAuthUrl = async (req, res) => {
    try {
        validateConfig();

        const oauth2Client = createOAuthClient();
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            state: 'google_login', // Different state to identify login vs fitness
            prompt: 'consent',
            include_granted_scopes: true
        });

        const redirectUri = getRedirectUri();
        console.log('Generated Google login auth URL');
        console.log(`Using Redirect URI: ${redirectUri}`);
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('Error generating Google login auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Google authorization URL',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Handle Google connect flow within the callback
 */
const handleGoogleConnectFlow = async (req, res, code, frontendUrl, userId) => {
    try {
        // Exchange code for tokens
        const oauth2Client = createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens?.access_token) {
            throw new Error('Failed to obtain access token');
        }

        // Set credentials to get user info
        oauth2Client.setCredentials(tokens);

        // Get user information from Google
        const oauth2 = google.oauth2('v2');
        const { data: googleUser } = await oauth2.userinfo.get({
            auth: oauth2Client
        });

        if (!googleUser.email) {
            throw new Error('Failed to get user email from Google');
        }

        // Update user
        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.connectedAccounts = {
            google: true,
            googleEmail: googleUser.email
        };

        // If user doesn't have an image, use Google's
        if (!user.image && googleUser.picture) {
            user.image = googleUser.picture;
        }

        await user.save();
        console.log(`User ${userId} connected Google account: ${googleUser.email}`);

        // Redirect to settings page with success
        res.redirect(`${frontendUrl}/my-profile?tab=settings&status=connected`);

    } catch (error) {
        console.error('Error in Google connect flow:', error);
        res.redirect(`${frontendUrl}/my-profile?tab=settings&error=${encodeURIComponent('Failed to connect Google account')}`);
    }
};

/**
 * Generate Google OAuth authorization URL for connecting account
 */
export const getGoogleConnectAuthUrl = async (req, res) => {
    try {
        validateConfig();
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User authentication required' });
        }

        const oauth2Client = createOAuthClient();
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            state: `connect_google_${userId}`,
            prompt: 'consent',
            include_granted_scopes: true
        });

        const redirectUri = getRedirectUri();
        console.log(`Generated Google connect auth URL for user ${userId}`);
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('Error generating Google connect auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Google authorization URL',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
