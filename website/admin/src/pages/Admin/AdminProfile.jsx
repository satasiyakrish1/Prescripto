import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AdminContext } from '../../context/AdminContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdminProfile = () => {
    const navigate = useNavigate();
    const { isReadOnly } = useContext(AdminContext);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: 'Admin',
        email: '',
        phone: '',
        address: '',
        image: ''
    });


    useEffect(() => {
        fetchAdminProfile();
    }, []);

    const fetchAdminProfile = async () => {
        try {
            const aToken = localStorage.getItem('aToken');
            const response = await axios.get(`${backendUrl}/api/admin/profile`, {
                headers: { aToken }
            });
            if (response.data.success) {
                setProfile(response.data.profile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            if (error.response?.status === 401) {
                localStorage.removeItem('aToken');
                navigate('/login');
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match('image.*')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfile(prev => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;

        setLoading(true);
        try {
            const aToken = localStorage.getItem('aToken');
            const response = await axios.put(`${backendUrl}/api/admin/profile`,
                {
                    ...profile
                },
                {
                    headers: { aToken }
                }
            );

            if (response.data.success) {
                toast.success('Profile updated successfully');
                // Refresh the profile data
                fetchAdminProfile();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
        setLoading(false);
    };

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        // Check against master password
        const masterPassword = import.meta.env.VITE_ADMIN_MASTER_PASSWORD;
        if (!masterPassword) {
            toast.error('Master password not configured');
            return;
        }

        if (passwordData.currentPassword !== masterPassword) {
            toast.error('Incorrect master password');
            return;
        }

        setLoading(true);
        try {
            const aToken = localStorage.getItem('aToken');
            const response = await axios.put(`${backendUrl}/api/admin/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                {
                    headers: { aToken }
                }
            );

            if (response.data.success) {
                toast.success('Password updated successfully');
                setShowPasswordForm(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.response?.data?.message || 'Failed to update password');

            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-7">
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Admin Profile</h2>
                <p className="text-sm text-gray-500 mb-6">Manage your profile details and security</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3 items-start">
                        <div className="md:col-span-1 flex justify-center md:justify-start self-start">
                            <div className="relative">
                                <img
                                    src={profile.image || 'https://krishsatasiya.netlify.app/Uplodes/images/Krish%20Satasiya.jpg'}
                                    alt="Profile"
                                    className="w-28 h-28 md:w-[156px] md:h-[156px] lg:w-[168px] lg:h-[168px] rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                                {!isReadOnly && <label className="absolute bottom-1 right-1 bg-black text-white p-2 rounded-full cursor-pointer hover:opacity-90">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        disabled={isReadOnly}
                                    />
                                    <FaUser className="w-4 h-4" />
                                </label>}
                            </div>
                        </div>

                        <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                            <div className="flex items-center border rounded-lg p-2.5">
                                <FaUser className="text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleInputChange}
                                    placeholder="Name"
                                    className="flex-1 outline-none text-sm"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex items-center border rounded-lg p-2.5">
                                <FaPhone className="text-gray-400 mr-3" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleInputChange}
                                    placeholder="Phone"
                                    className="flex-1 outline-none text-sm"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex items-center border rounded-lg p-2.5 md:col-span-2">
                                <FaEnvelope className="text-gray-400 mr-3" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleInputChange}
                                    placeholder="Email"
                                    className="flex-1 outline-none text-sm"
                                    readOnly
                                />
                            </div>
                            <div className="flex items-center border rounded-lg p-2.5 md:col-span-2">
                                <FaMapMarkerAlt className="text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleInputChange}
                                    placeholder="Address"
                                    className="flex-1 outline-none text-sm"
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-xs text-gray-500">Terms and conditions apply</p>
                        <div className="flex gap-2">
                            {!isReadOnly && <button
                                type="button"
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Change Password
                            </button>}
                            {!isReadOnly && <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90"
                            >
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>}
                        </div>
                    </div>
                </form>

                {showPasswordForm && (
                    <div className="mt-6 border-t pt-5">
                        <h3 className="text-lg font-semibold mb-3">Change Password</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div className="flex items-center border rounded-lg p-2.5">
                                <FaLock className="text-gray-400 mr-3" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Current Password"
                                    className="flex-1 outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="text-gray-400 focus:outline-none"
                                >
                                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className="flex items-center border rounded-lg p-2.5">
                                <FaLock className="text-gray-400 mr-3" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="New Password"
                                    className="flex-1 outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="text-gray-400 focus:outline-none"
                                >
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className="flex items-center border rounded-lg p-2.5">
                                <FaLock className="text-gray-400 mr-3" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Confirm New Password"
                                    className="flex-1 outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="text-gray-400 focus:outline-none"
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-2.5 rounded-lg hover:opacity-90"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProfile;
