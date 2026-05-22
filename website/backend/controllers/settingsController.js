import userModel from "../models/userModel.js";
import LoginHistory from "../models/loginHistoryModel.js";
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';

// Get all user settings
export const getUserSettings = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select('-password -twoFactorAuth.secret -twoFactorAuth.backupCodes');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const settings = {
            username: user.username || '',
            connectedAccounts: user.connectedAccounts || { google: false },
            notificationSettings: user.notificationSettings || {},
            profileVisibility: user.profileVisibility || 'public',
            betaFeaturesEnabled: user.betaFeaturesEnabled || false,
            preferences: user.preferences || {},
            twoFactorAuth: {
                enabled: user.twoFactorAuth?.enabled || false
            }
        };

        res.json({ success: true, settings });
    } catch (error) {
        console.error('getUserSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
};

// Update username
export const updateUsername = async (req, res) => {
    try {
        const { userId } = req.body;
        const { username } = req.body;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
        }

        // Check if username already exists
        const existingUser = await userModel.findOne({ username: username.trim(), _id: { $ne: userId } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username already taken' });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { username: username.trim() },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Username updated successfully', user });
    } catch (error) {
        console.error('updateUsername error:', error);
        res.status(500).json({ success: false, message: 'Failed to update username' });
    }
};

// Update profile visibility
export const updateProfileVisibility = async (req, res) => {
    try {
        const { userId } = req.body;
        const { profileVisibility } = req.body;

        if (!['public', 'private', 'friends'].includes(profileVisibility)) {
            return res.status(400).json({ success: false, message: 'Invalid visibility option' });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { profileVisibility },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Profile visibility updated', user });
    } catch (error) {
        console.error('updateProfileVisibility error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile visibility' });
    }
};

// Update beta features
export const updateBetaFeatures = async (req, res) => {
    try {
        const { userId } = req.body;
        const { betaFeaturesEnabled } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { betaFeaturesEnabled: !!betaFeaturesEnabled },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Beta features updated', user });
    } catch (error) {
        console.error('updateBetaFeatures error:', error);
        res.status(500).json({ success: false, message: 'Failed to update beta features' });
    }
};

// Update preferences
export const updatePreferences = async (req, res) => {
    try {
        const { userId } = req.body;
        const { preferences } = req.body;

        const allowedFields = ['language', 'timezone', 'dateFormat', 'timeFormat'];
        const updates = {};

        for (const field of allowedFields) {
            if (preferences[field] !== undefined) {
                updates[`preferences.${field}`] = preferences[field];
            }
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Preferences updated', user });
    } catch (error) {
        console.error('updatePreferences error:', error);
        res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
};

// Update DND (Do Not Disturb)
export const updateDND = async (req, res) => {
    try {
        const { userId } = req.body;
        const { dnd } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { 'notificationSettings.dnd': !!dnd },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Do Not Disturb updated', user });
    } catch (error) {
        console.error('updateDND error:', error);
        res.status(500).json({ success: false, message: 'Failed to update DND' });
    }
};

// Setup 2FA
export const setup2FA = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `VHealth (${user.email})`,
            length: 32
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
            Math.random().toString(36).substring(2, 10).toUpperCase()
        );

        // Save secret temporarily (not enabled yet)
        await userModel.findByIdAndUpdate(userId, {
            'twoFactorAuth.secret': secret.base32,
            'twoFactorAuth.backupCodes': backupCodes,
            'twoFactorAuth.enabled': false
        });

        res.json({
            success: true,
            qrCode,
            secret: secret.base32,
            backupCodes
        });
    } catch (error) {
        console.error('setup2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
    }
};

// Verify and enable 2FA
export const verify2FA = async (req, res) => {
    try {
        const { userId } = req.body;
        const { token } = req.body;

        const user = await userModel.findById(userId);
        if (!user || !user.twoFactorAuth?.secret) {
            return res.status(400).json({ success: false, message: 'Please setup 2FA first' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorAuth.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        // Enable 2FA
        await userModel.findByIdAndUpdate(userId, {
            'twoFactorAuth.enabled': true
        });

        res.json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
        console.error('verify2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
    }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
    try {
        const { userId } = req.body;
        const { token } = req.body;

        const user = await userModel.findById(userId);
        if (!user || !user.twoFactorAuth?.enabled) {
            return res.status(400).json({ success: false, message: '2FA is not enabled' });
        }

        // Verify token before disabling
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorAuth.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        // Disable 2FA
        await userModel.findByIdAndUpdate(userId, {
            'twoFactorAuth.enabled': false,
            'twoFactorAuth.secret': null,
            'twoFactorAuth.backupCodes': []
        });

        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
        console.error('disable2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
    }
};

// Submit feedback
export const submitFeedback = async (req, res) => {
    try {
        const { userId } = req.body;
        const { type, subject, message } = req.body;

        if (!type || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const user = await userModel.findById(userId).select('name email');

        // Here you would typically save to a feedback collection or send email
        // For now, just log it
        console.log('Feedback received:', {
            userId,
            userName: user.name,
            userEmail: user.email,
            type,
            subject,
            message,
            timestamp: new Date()
        });

        res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('submitFeedback error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
};

// Get login activity
export const getLoginActivity = async (req, res) => {
    try {
        const { userId } = req.body;

        const history = await LoginHistory.find({ userId })
            .sort({ loginTime: -1 })
            .limit(5);

        res.json({ success: true, history });
    } catch (error) {
        console.error('getLoginActivity error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch login activity' });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        // Delete user data
        // Note: In a real app, you might want to soft delete or archive data
        await userModel.findByIdAndDelete(userId);
        await LoginHistory.deleteMany({ userId });

        // Add more cleanup if necessary (appointments, etc.)

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('deleteAccount error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
};
