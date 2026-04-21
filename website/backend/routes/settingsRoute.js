import express from 'express';
import authUser from '../middleware/authUser.js';
import {
    getUserSettings,
    updateUsername,
    updateProfileVisibility,
    updateBetaFeatures,
    updatePreferences,
    updateDND,
    setup2FA,
    verify2FA,
    disable2FA,
    submitFeedback,
    getLoginActivity,
    deleteAccount
} from '../controllers/settingsController.js';

const settingsRouter = express.Router();

// Get all settings
settingsRouter.get('/get-settings', authUser, getUserSettings);

// Update username
settingsRouter.post('/update-username', authUser, updateUsername);

// Update profile visibility
settingsRouter.post('/update-profile-visibility', authUser, updateProfileVisibility);

// Update beta features
settingsRouter.post('/update-beta-features', authUser, updateBetaFeatures);

// Update preferences
settingsRouter.post('/update-preferences', authUser, updatePreferences);

// Update DND
settingsRouter.post('/update-dnd', authUser, updateDND);

// 2FA routes
settingsRouter.post('/setup-2fa', authUser, setup2FA);
settingsRouter.post('/verify-2fa', authUser, verify2FA);
settingsRouter.post('/disable-2fa', authUser, disable2FA);

// Feedback
settingsRouter.post('/submit-feedback', authUser, submitFeedback);

// Security
settingsRouter.get('/login-activity', authUser, getLoginActivity);
settingsRouter.post('/delete-account', authUser, deleteAccount);

export default settingsRouter;
