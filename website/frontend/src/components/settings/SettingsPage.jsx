import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    User, Shield, Bell, Globe, Eye, Sparkles,
    MessageSquare, AlertCircle, Lock, Mail, Moon,
    Clock, Calendar, Languages, MapPin
} from 'lucide-react';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { token, backendUrl, userData, setUserData } = useContext(AppContext);
    const [activeSection, setActiveSection] = useState('account');
    const [loading, setLoading] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        username: '',
        connectedAccounts: { google: false },
        connectedAccounts: { google: false },
        notificationSettings: { email: true, push: false, marketing: true, loginAlerts: true, dnd: false },
        profileVisibility: 'public',
        profileVisibility: 'public',
        betaFeaturesEnabled: false,
        preferences: {
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
        },
        twoFactorAuth: { enabled: false }
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 2FA state
    const [twoFASetup, setTwoFASetup] = useState({
        qrCode: '',
        secret: '',
        backupCodes: [],
        verificationCode: '',
        showSetup: false
    });

    // Feedback state
    const [feedback, setFeedback] = useState({
        type: 'suggestion',
        subject: '',
        message: ''
    });

    // Login Activity state
    const [loginActivity, setLoginActivity] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    // Load settings on mount
    useEffect(() => {
        loadSettings();

        // Check for connection status from URL
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const error = urlParams.get('error');

        if (status === 'connected') {
            toast.success('Google account connected successfully!');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname + '?tab=settings');
        } else if (error) {
            toast.error(decodeURIComponent(error));
            window.history.replaceState({}, '', window.location.pathname + '?tab=settings');
        }
    }, []);

    useEffect(() => {
        if (activeSection === 'security') {
            fetchLoginActivity();
        }
    }, [activeSection]);

    const loadSettings = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/settings/get-settings`, {
                headers: { token }
            });
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    // Update username
    const updateUsername = async () => {
        if (!settings.username || settings.username.trim().length < 3) {
            toast.error('Username must be at least 3 characters');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/update-username`,
                { username: settings.username },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('Username updated successfully');
                setUserData(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update username');
        }
        setLoading(false);
    };

    // Update notification settings
    const updateNotificationSetting = async (key, value) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/notification-settings`,
                { notificationSettings: { [key]: value } },
                { headers: { token } }
            );
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, [key]: value }
                }));
                toast.success('Notification settings updated');
            }
        } catch (error) {
            toast.error('Failed to update notification settings');
        }
    };

    // Update profile visibility
    const updateProfileVisibility = async (visibility) => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/update-profile-visibility`,
                { profileVisibility: visibility },
                { headers: { token } }
            );
            if (data.success) {
                setSettings(prev => ({ ...prev, profileVisibility: visibility }));
                toast.success('Profile visibility updated');
            }
        } catch (error) {
            toast.error('Failed to update profile visibility');
        }
        setLoading(false);
    };

    // Update beta features
    const updateBetaFeatures = async (enabled) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/update-beta-features`,
                { betaFeaturesEnabled: enabled },
                { headers: { token } }
            );
            if (data.success) {
                setSettings(prev => ({ ...prev, betaFeaturesEnabled: enabled }));
                toast.success(enabled ? 'Beta features enabled' : 'Beta features disabled');
            }
        } catch (error) {
            toast.error('Failed to update beta features');
        }
    };

    // Update preferences
    const updatePreferences = async (key, value) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/update-preferences`,
                { preferences: { [key]: value } },
                { headers: { token } }
            );
            if (data.success) {
                setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, [key]: value }
                }));
                toast.success('Preferences updated');
            }
        } catch (error) {
            toast.error('Failed to update preferences');
        }
    };

    // Change password
    const changePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Please fill all password fields');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/change-password`,
                passwordData,
                { headers: { token } }
            );
            if (data.success) {
                toast.success('Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
        setLoading(false);
    };

    // Setup 2FA
    const setup2FA = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/setup-2fa`,
                {},
                { headers: { token } }
            );
            if (data.success) {
                setTwoFASetup({
                    ...twoFASetup,
                    qrCode: data.qrCode,
                    secret: data.secret,
                    backupCodes: data.backupCodes,
                    showSetup: true
                });
                toast.success('Scan QR code with your authenticator app');
            }
        } catch (error) {
            toast.error('Failed to setup 2FA');
        }
        setLoading(false);
    };

    // Verify and enable 2FA
    const verify2FA = async () => {
        if (!twoFASetup.verificationCode) {
            toast.error('Please enter verification code');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/verify-2fa`,
                { token: twoFASetup.verificationCode },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('2FA enabled successfully');
                setSettings(prev => ({
                    ...prev,
                    twoFactorAuth: { enabled: true }
                }));
                setTwoFASetup({
                    qrCode: '',
                    secret: '',
                    backupCodes: [],
                    verificationCode: '',
                    showSetup: false
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Invalid verification code');
        }
        setLoading(false);
    };

    // Disable 2FA
    const disable2FA = async () => {
        const code = prompt('Enter verification code to disable 2FA:');
        if (!code) return;
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/disable-2fa`,
                { token: code },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('2FA disabled successfully');
                setSettings(prev => ({
                    ...prev,
                    twoFactorAuth: { enabled: false }
                }));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to disable 2FA');
        }
        setLoading(false);
    };

    // Submit feedback
    const submitFeedback = async () => {
        if (!feedback.subject || !feedback.message) {
            toast.error('Please fill all feedback fields');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/feedback/submit`,
                {
                    ...feedback,
                    userId: userData._id
                },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('Feedback submitted successfully! Thank you for your input.');
                setFeedback({ type: 'suggestion', subject: '', message: '' });
            } else {
                toast.error(data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        }
        setLoading(false);
    };

    // Connect Google Account
    const handleGoogleConnect = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/google-connect/auth-url`, {
                headers: { token }
            });
            if (data.success) {
                window.location.href = data.authUrl;
            } else {
                toast.error('Failed to get authorization URL');
            }
        } catch (error) {
            toast.error('Failed to initiate Google connection');
        }
    };

    // Fetch login activity
    const fetchLoginActivity = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/settings/login-activity`, {
                headers: { token }
            });
            if (data.success) {
                setLoginActivity(data.history);
            }
        } catch (error) {
            console.error('Failed to fetch login activity:', error);
        }
    };

    // Delete Account
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Please enter your password');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/settings/delete-account`,
                { password: deletePassword },
                { headers: { token } }
            );
            if (data.success) {
                toast.success('Account deleted successfully');
                // Logout user
                localStorage.removeItem('token');
                setUserData(null);
                navigate('/login');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        }
        setLoading(false);
    };

    const sections = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'privacy', label: 'Privacy', icon: Eye },
        { id: 'beta', label: 'Beta Features', icon: Sparkles },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare }
    ];

    const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
        <label className='relative inline-flex items-center cursor-pointer'>
            <input
                type="checkbox"
                className='sr-only peer'
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
    );

    return (
        <div className='max-w-7xl mx-auto px-4 py-8'>
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>Settings</h1>
                <p className='text-gray-600'>Manage your account settings and preferences</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                {/* Sidebar */}
                <div className='lg:col-span-1'>
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-2'>
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className='font-medium'>{section.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className='lg:col-span-3'>
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>

                        {/* Account Section */}
                        {activeSection === 'account' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Account Settings</h2>
                                    <p className='text-sm text-gray-600'>Manage your account information</p>
                                </div>

                                {/* Username */}
                                <div className='border-t pt-6'>
                                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                        <User size={16} className='inline mr-2' />
                                        Username
                                    </label>
                                    <p className='text-xs text-gray-500 mb-3'>Choose a unique username for your account</p>
                                    <div className='flex gap-3'>
                                        <input
                                            type="text"
                                            value={settings.username}
                                            onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                                            placeholder='Enter username'
                                            className='flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        />
                                        <button
                                            onClick={updateUsername}
                                            disabled={loading}
                                            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50'
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                {/* Connected Accounts */}
                                <div className='border-t pt-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                                        <Mail size={18} className='inline mr-2' />
                                        Connected Accounts
                                    </h3>
                                    <div className='bg-gray-50 rounded-lg p-4'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm'>
                                                    <svg className='w-5 h-5' viewBox="0 0 24 24">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className='font-medium text-gray-800'>Google</p>
                                                    <p className='text-xs text-gray-500'>
                                                        {settings.connectedAccounts.google
                                                            ? settings.connectedAccounts.googleEmail || 'Connected'
                                                            : 'Not connected'}
                                                    </p>
                                                </div>
                                            </div>
                                            {settings.connectedAccounts.google ? (
                                                <span className='px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                                                    Connected
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleGoogleConnect}
                                                    className='px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition'
                                                >
                                                    Connect
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Change Password */}
                                <div className='border-t pt-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                                        <Lock size={18} className='inline mr-2' />
                                        Change Password
                                    </h3>
                                    <div className='space-y-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                            />
                                        </div>
                                        <button
                                            onClick={changePassword}
                                            disabled={loading}
                                            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50'
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Security Settings</h2>
                                    <p className='text-sm text-gray-600'>Manage your account security</p>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className='border-t pt-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                                        <Shield size={18} className='inline mr-2' />
                                        Two-Factor Authentication (2FA)
                                    </h3>
                                    <p className='text-sm text-gray-600 mb-4'>
                                        Add an extra layer of security to your account
                                    </p>

                                    {!settings.twoFactorAuth.enabled && !twoFASetup.showSetup && (
                                        <button
                                            onClick={setup2FA}
                                            disabled={loading}
                                            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50'
                                        >
                                            Enable 2FA
                                        </button>
                                    )}

                                    {twoFASetup.showSetup && (
                                        <div className='bg-gray-50 rounded-lg p-6 space-y-4'>
                                            <div className='text-center'>
                                                <p className='text-sm text-gray-700 mb-4'>Scan this QR code with your authenticator app</p>
                                                <img src={twoFASetup.qrCode} alt="QR Code" className='mx-auto w-48 h-48' />
                                                <p className='text-xs text-gray-500 mt-2'>Or enter this code manually:</p>
                                                <code className='text-xs bg-white px-3 py-1 rounded mt-1 inline-block'>{twoFASetup.secret}</code>
                                            </div>

                                            <div>
                                                <label className='block text-sm font-medium text-gray-700 mb-2'>Verification Code</label>
                                                <input
                                                    type="text"
                                                    value={twoFASetup.verificationCode}
                                                    onChange={(e) => setTwoFASetup({ ...twoFASetup, verificationCode: e.target.value })}
                                                    placeholder='Enter 6-digit code'
                                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                                />
                                            </div>

                                            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                                                <p className='text-sm font-medium text-yellow-800 mb-2'>Backup Codes</p>
                                                <p className='text-xs text-yellow-700 mb-3'>Save these codes in a safe place. You can use them to access your account if you lose your device.</p>
                                                <div className='grid grid-cols-2 gap-2'>
                                                    {twoFASetup.backupCodes.map((code, idx) => (
                                                        <code key={idx} className='text-xs bg-white px-2 py-1 rounded'>{code}</code>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className='flex gap-3'>
                                                <button
                                                    onClick={verify2FA}
                                                    disabled={loading}
                                                    className='flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50'
                                                >
                                                    Verify & Enable
                                                </button>
                                                <button
                                                    onClick={() => setTwoFASetup({ ...twoFASetup, showSetup: false })}
                                                    className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {settings.twoFactorAuth.enabled && (
                                        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                                            <div className='flex items-center justify-between'>
                                                <div>
                                                    <p className='font-medium text-green-800'>2FA is enabled</p>
                                                    <p className='text-sm text-green-700'>Your account is protected with two-factor authentication</p>
                                                </div>
                                                <button
                                                    onClick={disable2FA}
                                                    disabled={loading}
                                                    className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50'
                                                >
                                                    Disable
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Login Alerts */}
                                    <div className='border-t pt-6'>
                                        <div className='flex items-center justify-between'>
                                            <div>
                                                <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                                    <Bell size={18} />
                                                    Login Alerts
                                                </h3>
                                                <p className='text-sm text-gray-600'>Receive an email when your account is accessed from a new device</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={settings.notificationSettings.loginAlerts}
                                                onChange={(val) => updateNotificationSetting('loginAlerts', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Recent Login Activity */}
                                    <div className='border-t pt-6'>
                                        <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                                            <Clock size={18} />
                                            Recent Login Activity
                                        </h3>
                                        <div className='bg-gray-50 rounded-lg overflow-hidden'>
                                            {loginActivity.map((login, idx) => (
                                                <div key={idx} className='p-4 border-b last:border-0 flex items-center justify-between'>
                                                    <div>
                                                        <p className='font-medium text-gray-800'>{login.deviceInfo || 'Unknown Device'}</p>
                                                        <p className='text-xs text-gray-500'>{login.ipAddress} • {new Date(login.loginTime).toLocaleString()}</p>
                                                    </div>
                                                    {idx === 0 && <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>Current</span>}
                                                </div>
                                            ))}
                                            {loginActivity.length === 0 && <p className='p-4 text-sm text-gray-500 text-center'>No login history available</p>}
                                        </div>
                                    </div>

                                    {/* Delete Account */}
                                    <div className='border-t pt-6'>
                                        <h3 className='text-lg font-semibold text-red-600 mb-3 flex items-center gap-2'>
                                            <AlertCircle size={18} />
                                            Delete Account
                                        </h3>
                                        <p className='text-sm text-gray-600 mb-4'>
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        {!showDeleteConfirm ? (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className='px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition'
                                            >
                                                Delete Account
                                            </button>
                                        ) : (
                                            <div className='bg-red-50 border border-red-100 rounded-lg p-4'>
                                                <p className='text-sm font-medium text-red-800 mb-3'>Are you sure you want to delete your account?</p>
                                                <input
                                                    type="password"
                                                    value={deletePassword}
                                                    onChange={(e) => setDeletePassword(e.target.value)}
                                                    placeholder='Enter your password to confirm'
                                                    className='w-full border border-red-200 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500'
                                                />
                                                <div className='flex gap-3'>
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        disabled={loading}
                                                        className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50'
                                                    >
                                                        Confirm Delete
                                                    </button>
                                                    <button
                                                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                                                        className='px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Notification Settings</h2>
                                    <p className='text-sm text-gray-600'>Manage how you receive notifications</p>
                                </div>

                                <div className='border-t pt-6 space-y-4'>
                                    <div className='flex items-center justify-between py-3'>
                                        <div>
                                            <p className='font-medium text-gray-800 flex items-center gap-2'>
                                                <Mail size={18} />
                                                Email Notifications
                                            </p>
                                            <p className='text-sm text-gray-600'>Receive email updates about your account</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={settings.notificationSettings.email}
                                            onChange={(val) => updateNotificationSetting('email', val)}
                                        />
                                    </div>

                                    <div className='flex items-center justify-between py-3 border-t'>
                                        <div>
                                            <p className='font-medium text-gray-800 flex items-center gap-2'>
                                                <Bell size={18} />
                                                Push Notifications
                                            </p>
                                            <p className='text-sm text-gray-600'>Receive notifications on your device</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={settings.notificationSettings.push}
                                            onChange={(val) => updateNotificationSetting('push', val)}
                                        />
                                    </div>

                                    <div className='flex items-center justify-between py-3 border-t'>
                                        <div>
                                            <p className='font-medium text-gray-800 flex items-center gap-2'>
                                                <MessageSquare size={18} />
                                                Marketing Communications
                                            </p>
                                            <p className='text-sm text-gray-600'>Receive marketing emails and promotions</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={settings.notificationSettings.marketing}
                                            onChange={(val) => updateNotificationSetting('marketing', val)}
                                        />
                                    </div>

                                    <div className='flex items-center justify-between py-3 border-t'>
                                        <div>
                                            <p className='font-medium text-gray-800 flex items-center gap-2'>
                                                <Moon size={18} />
                                                Do Not Disturb (DND)
                                            </p>
                                            <p className='text-sm text-gray-600'>Pause all notifications temporarily</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={settings.notificationSettings.dnd}
                                            onChange={(val) => updateNotificationSetting('dnd', val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Section */}
                        {activeSection === 'preferences' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Preferences</h2>
                                    <p className='text-sm text-gray-600'>Customize your experience</p>
                                </div>

                                <div className='border-t pt-6 space-y-6'>
                                    {/* Language */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                            <Languages size={18} />
                                            Language
                                        </label>
                                        <select
                                            value={settings.preferences.language}
                                            onChange={(e) => updatePreferences('language', e.target.value)}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>

                                    {/* Timezone */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                            <MapPin size={18} />
                                            Timezone
                                        </label>
                                        <select
                                            value={settings.preferences.timezone}
                                            onChange={(e) => updatePreferences('timezone', e.target.value)}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        >
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">Eastern Time (ET)</option>
                                            <option value="America/Chicago">Central Time (CT)</option>
                                            <option value="America/Denver">Mountain Time (MT)</option>
                                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                            <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                        </select>
                                    </div>

                                    {/* Date Format */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                            <Calendar size={18} />
                                            Date Format
                                        </label>
                                        <select
                                            value={settings.preferences.dateFormat}
                                            onChange={(e) => updatePreferences('dateFormat', e.target.value)}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        >
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>

                                    {/* Time Format */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                            <Clock size={18} />
                                            Time Format
                                        </label>
                                        <select
                                            value={settings.preferences.timeFormat}
                                            onChange={(e) => updatePreferences('timeFormat', e.target.value)}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        >
                                            <option value="12h">12-hour (AM/PM)</option>
                                            <option value="24h">24-hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Privacy Section */}
                        {activeSection === 'privacy' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Privacy Settings</h2>
                                    <p className='text-sm text-gray-600'>Control who can see your information</p>
                                </div>

                                <div className='border-t pt-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                                        <Eye size={18} />
                                        Profile Visibility
                                    </h3>
                                    <p className='text-sm text-gray-600 mb-4'>Choose who can view your profile</p>

                                    <div className='space-y-3'>
                                        <label className='flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition'>
                                            <input
                                                type="radio"
                                                name="visibility"
                                                value="public"
                                                checked={settings.profileVisibility === 'public'}
                                                onChange={(e) => updateProfileVisibility(e.target.value)}
                                                className='w-4 h-4 text-primary'
                                            />
                                            <div>
                                                <p className='font-medium text-gray-800'>Public</p>
                                                <p className='text-sm text-gray-600'>Anyone can view your profile</p>
                                            </div>
                                        </label>

                                        <label className='flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition'>
                                            <input
                                                type="radio"
                                                name="visibility"
                                                value="friends"
                                                checked={settings.profileVisibility === 'friends'}
                                                onChange={(e) => updateProfileVisibility(e.target.value)}
                                                className='w-4 h-4 text-primary'
                                            />
                                            <div>
                                                <p className='font-medium text-gray-800'>Friends Only</p>
                                                <p className='text-sm text-gray-600'>Only your connections can view your profile</p>
                                            </div>
                                        </label>

                                        <label className='flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition'>
                                            <input
                                                type="radio"
                                                name="visibility"
                                                value="private"
                                                checked={settings.profileVisibility === 'private'}
                                                onChange={(e) => updateProfileVisibility(e.target.value)}
                                                className='w-4 h-4 text-primary'
                                            />
                                            <div>
                                                <p className='font-medium text-gray-800'>Private</p>
                                                <p className='text-sm text-gray-600'>Only you can view your profile</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Beta Features Section */}
                        {activeSection === 'beta' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Beta Features</h2>
                                    <p className='text-sm text-gray-600'>Try out new features before they're released</p>
                                </div>

                                <div className='border-t pt-6'>
                                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                                        <div className='flex items-start gap-3'>
                                            <AlertCircle size={20} className='text-blue-600 mt-0.5' />
                                            <div>
                                                <p className='font-medium text-blue-800'>About Beta Features</p>
                                                <p className='text-sm text-blue-700 mt-1'>
                                                    Beta features are experimental and may not work as expected.
                                                    Your feedback helps us improve these features before general release.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex items-center justify-between p-4 border border-gray-300 rounded-lg'>
                                        <div>
                                            <p className='font-medium text-gray-800 flex items-center gap-2'>
                                                <Sparkles size={18} />
                                                Enable Beta Features
                                            </p>
                                            <p className='text-sm text-gray-600'>Get early access to new features</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={settings.betaFeaturesEnabled}
                                            onChange={updateBetaFeatures}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feedback Section */}
                        {activeSection === 'feedback' && (
                            <div className='space-y-6'>
                                <div>
                                    <h2 className='text-2xl font-bold text-gray-800 mb-1'>Feedback & Suggestions</h2>
                                    <p className='text-sm text-gray-600'>Help us improve by sharing your thoughts</p>
                                </div>

                                <div className='border-t pt-6 space-y-4'>
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>Type</label>
                                        <select
                                            value={feedback.type}
                                            onChange={(e) => setFeedback({ ...feedback, type: e.target.value })}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        >
                                            <option value="suggestion">Suggestion</option>
                                            <option value="bug">Bug Report</option>
                                            <option value="feature">Feature Request</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>Subject</label>
                                        <input
                                            type="text"
                                            value={feedback.subject}
                                            onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })}
                                            placeholder='Brief description of your feedback'
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>Message</label>
                                        <textarea
                                            value={feedback.message}
                                            onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                                            placeholder='Provide detailed information about your feedback...'
                                            rows={6}
                                            className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none'
                                        />
                                    </div>

                                    <button
                                        onClick={submitFeedback}
                                        disabled={loading}
                                        className='w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 font-medium'
                                    >
                                        Submit Feedback
                                    </button>

                                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                        <p className='text-sm text-gray-700'>
                                            <strong>Note:</strong> We review all feedback carefully.
                                            While we may not respond to every submission, your input helps shape our product.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
