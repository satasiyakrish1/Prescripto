import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import CreateFamily from '../components/CreateFamily'
import EntryIDCard from '../components/EntryIDCard'
import VHealthCard from '../components/profile/VHealthCard'
import MedicalFilesSection from '../components/MedicalFilesSection'
import SettingsPage from '../components/settings/SettingsPage'
import Lottie from 'lottie-react'

const MyProfile = () => {
    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')
    const [profileCompleteness, setProfileCompleteness] = useState(0)
    const [loginHistory, setLoginHistory] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)
    const [notificationSettings, setNotificationSettings] = useState({ email: true, push: false, marketing: true })
    const [settingsStream, setSettingsStream] = useState(null)
    const [verificationStatus, setVerificationStatus] = useState({ isExpired: false })
    const navigate = useNavigate()

    // Family management state
    const [family, setFamily] = useState(null)
    const [showAddMember, setShowAddMember] = useState(false)
    const [selectedMember, setSelectedMember] = useState(null)

    // Check verification status on component mount and when userData changes
    useEffect(() => {
        const checkVerificationStatus = async () => {
            if (!token || !userData?._id) return;

            try {
                const { data } = await axios.get(`${backendUrl}/api/verification/status`, {
                    headers: { token }
                });

                if (data.success) {
                    setVerificationStatus(data);

                    // Update local userData if verification has expired
                    if (data.isExpired && userData.isVerified) {
                        setUserData(prev => ({
                            ...prev,
                            isVerified: false,
                            verifiedPlan: null,
                            verifiedAt: null
                        }));
                    }
                }
            } catch (error) {
                console.error('Error checking verification status:', error);
            }
        };

        if (userData?.isVerified) {
            checkVerificationStatus();
        }
    }, [backendUrl, token, userData?._id, userData?.isVerified, setUserData]);

    useEffect(() => {
        calculateProfileCompleteness()
    }, [userData])

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchLoginHistory()
        }
        if (activeTab === 'family') {
            fetchFamily()
        }
        if (activeTab === 'settings') {
            loadNotificationSettings()
            startSettingsStream()
        } else {
            stopSettingsStream()
        }
    }, [activeTab, currentPage])

    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
    const [DotLottiePlayer, setDotLottiePlayer] = useState(null)
    const [fallbackAnim, setFallbackAnim] = useState(null)

    // Safely load DotLottie player only on client to prevent blank portal
    useEffect(() => {
        let mounted = true
        import('@lottiefiles/dotlottie-react')
            .then(mod => { if (mounted) setDotLottiePlayer(() => mod.DotLottiePlayer) })
            .catch(() => { if (mounted) setDotLottiePlayer(null) })
        // Preload fallback JSON (blank) for quick paste/replace
        import('../assets/empty-family.json')
            .then(json => { if (mounted) setFallbackAnim(json.default || json) })
            .catch(() => { if (mounted) setFallbackAnim({}) })
        return () => { mounted = false }
    }, [])

    const fetchLoginHistory = async (retryCount = 0) => {
        try {
            // Validate token before making request
            if (!token) {
                console.error('No token available');
                toast.error('Authentication required. Please login.');
                window.location.href = '/login';
                return;
            }

            setIsLoadingHistory(true);

            const params = new URLSearchParams({ page: String(currentPage), limit: '10' });
            if (dateFilter.from) params.set('from', dateFilter.from);
            if (dateFilter.to) params.set('to', dateFilter.to);
            const apiUrl = `${backendUrl}/api/login-history/history?${params.toString()}`;

            const response = await axios.get(apiUrl, {
                headers: {
                    'token': token
                }
            });

            if (response.data.success) {
                setLoginHistory(response.data.data || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
            } else {
                throw new Error(response.data.message || 'Failed to fetch login history');
            }
        } catch (error) {
            console.error('Error fetching login history:', error);

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 401 || status === 403) {
                    toast.error('Session expired. Please login again.');
                    window.location.href = '/login';
                } else if (status === 404) {
                    toast.error('Login history service not found. Please contact support.');
                } else if (status >= 500) {
                    toast.error('Server is currently unavailable. Please try again later.');
                } else {
                    toast.error(errorData?.message || 'Failed to fetch login history');
                }
            } else if (error.request) {
                if (retryCount < 3) {
                    const backoffTime = Math.pow(2, retryCount) * 1000;
                    setTimeout(() => fetchLoginHistory(retryCount + 1), backoffTime);
                    return;
                }
                toast.error('Network error: Please check your internet connection and try again.');
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }

            setLoginHistory([]);
            setTotalPages(1);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Debug function to test the API directly
    const testLoginHistoryAPI = async () => {
        try {
            console.log('=== Testing Login History API ===');
            console.log('Backend URL:', backendUrl);
            console.log('Token exists:', !!token);
            console.log('User Data:', userData);

            if (!token) {
                console.error('No token available for testing');
                return;
            }

            // Test basic connectivity
            const healthCheck = await axios.get(`${backendUrl}/api/user/get-profile`, {
                headers: { token }
            });
            console.log('Profile API works:', healthCheck.data.success);

            // Now test login history
            const historyResponse = await axios.get(`${backendUrl}/api/login-history/history?page=1&limit=5`, {
                headers: { token }
            });
            console.log('Login History API Response:', historyResponse.data);

        } catch (error) {
            console.error('API Test Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    };

    const calculateProfileCompleteness = () => {
        if (!userData) return 0

        const fields = [
            userData.name,
            userData.email,
            userData.phone,
            userData.gender !== 'Not Selected' ? userData.gender : null,
            userData.dob,
            userData.image !== assets.default_profile ? userData.image : null,
            userData.address?.line1,
            userData.address?.city,
            userData.address?.state,
            userData.address?.pincode
        ]

        const filledFields = fields.filter(field => field).length
        const percentage = Math.floor((filledFields / fields.length) * 100)
        setProfileCompleteness(percentage)
    }

    const updateUserProfileData = async () => {
        try {
            const formData = new FormData();

            // Add basic fields
            formData.append('name', userData.name || '');
            formData.append('phone', userData.phone || '');
            formData.append('gender', userData.gender || 'Not Selected');
            formData.append('dob', userData.dob || '');

            // Add address as JSON string if it exists
            if (userData.address) {
                formData.append('address', JSON.stringify(userData.address));
            }

            // Add skills if they exist
            if (Array.isArray(userData.skills)) {
                formData.append('skills', JSON.stringify(userData.skills));
            }

            // Add social links if they exist
            if (Array.isArray(userData.socialLinks)) {
                formData.append('socialLinks', JSON.stringify(userData.socialLinks));
            }

            // Add image if exists
            if (image) {
                formData.append('image', image);
            }

            // Debug log the form data
            console.log('Form data contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, ':', value);
            }

            console.log('Submitting profile update...');

            const { data } = await axios.post(
                `${backendUrl}/api/user/update-profile`,
                formData,
                {
                    headers: {
                        token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (data.success) {
                toast.success(data.message);
                await loadUserProfileData();
                setIsEdit(false);
                setImage(false);
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Error updating profile');
        }
    };

    const changePassword = async () => {
        try {
            // Validation
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                return toast.error('New passwords do not match')
            }

            if (passwordData.newPassword.length < 6) {
                return toast.error('Password must be at least 6 characters')
            }

            const { data } = await axios.post(
                backendUrl + '/api/user/change-password',
                passwordData,
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message)
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message || 'Failed to change password')
        }
    }

    const addSkill = () => {
        setUserData(prev => ({
            ...prev,
            skills: [...(prev.skills || []), '']
        }))
    }

    const updateSkill = (index, value) => {
        const newSkills = [...(userData.skills || [])]
        newSkills[index] = value
        setUserData(prev => ({
            ...prev,
            skills: newSkills
        }))
    }

    const removeSkill = (index) => {
        const newSkills = [...(userData.skills || [])]
        newSkills.splice(index, 1)
        setUserData(prev => ({
            ...prev,
            skills: newSkills
        }))
    }

    const initSocialLinks = () => {
        if (!userData.socialLinks) {
            setUserData(prev => ({
                ...prev,
                socialLinks: [
                    { platform: 'LinkedIn', url: '' },
                    { platform: 'Twitter', url: '' },
                    { platform: 'GitHub', url: '' },
                    { platform: 'Instagram', url: '' }
                ]
            }))
        }
    }

    const updateSocialLink = (platform, url) => {
        setUserData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: url
            }
        }))
    }

    useEffect(() => {
        if (isEdit && !userData.socialLinks) {
            initSocialLinks()
        }
    }, [isEdit])

    // Family management functions
    const fetchFamily = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/family/get-family`, {
                headers: { token }
            });

            if (data.success) {
                setFamily(data.family);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleAddMember = async (memberData) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/family/add-member`,
                { member: memberData },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(`Member added! Entry ID: ${data.entryId}`);
                setShowAddMember(false);
                fetchFamily();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to add family member');
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this family member?')) {
            return;
        }

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/family/delete-member`,
                { memberId },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Member removed successfully');
                fetchFamily();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to remove family member');
        }
    };

    // ---- Notification Settings: load, update, and realtime stream ----
    const loadNotificationSettings = async () => {
        try {
            if (!token) return;
            const { data } = await axios.get(`${backendUrl}/api/user/notification-settings`, { headers: { token } })
            if (data.success) {
                setNotificationSettings(prev => ({ ...prev, ...(data.notificationSettings || {}) }))
            }
        } catch (err) {
            console.error('Failed to load notification settings', err)
        }
    }

    const updateNotificationSetting = async (partial) => {
        try {
            if (!token) return;
            const { data } = await axios.post(`${backendUrl}/api/user/notification-settings`, {
                notificationSettings: partial
            }, { headers: { token } })
            if (!data.success) throw new Error(data.message || 'Failed')
            // Optimistic update happens via SSE, but keep local in sync quickly
            setNotificationSettings(prev => ({ ...prev, ...(data.notificationSettings || partial) }))
        } catch (err) {
            console.error('Failed to update notification setting', err)
            toast.error('Failed to update setting')
        }
    }

    const startSettingsStream = () => {
        try {
            if (!token || settingsStream) return;
            const es = new EventSource(`${backendUrl}/api/user/notification-settings/stream?token=${token}`)
            es.addEventListener('init', (e) => {
                try {
                    const payload = JSON.parse(e.data)
                    if (payload?.notificationSettings) setNotificationSettings(prev => ({ ...prev, ...payload.notificationSettings }))
                } catch (_) { }
            })
            es.addEventListener('update', (e) => {
                try {
                    const payload = JSON.parse(e.data)
                    if (payload?.notificationSettings) setNotificationSettings(prev => ({ ...prev, ...payload.notificationSettings }))
                } catch (_) { }
            })
            es.onerror = () => {
                es.close()
                setSettingsStream(null)
                // Auto-retry with backoff
                setTimeout(startSettingsStream, 3000)
            }
            setSettingsStream(es)
        } catch (_) { }
    }

    const stopSettingsStream = () => {
        try { settingsStream?.close() } catch (_) { }
        setSettingsStream(null)
    }

    useEffect(() => {
        return () => {
            stopSettingsStream()
        }
    }, [])

    const copyEntryId = (entryId) => {
        navigator.clipboard.writeText(entryId);
        toast.success('Entry ID copied to clipboard!');
    };

    if (!userData) return null

    return (
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'>
            <header className='mb-4 sm:mb-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <h1 className='text-xl sm:text-2xl font-semibold text-gray-800'>My Account</h1>
                    <nav className='flex items-center gap-2 bg-white border rounded-full p-1 shadow-sm overflow-x-auto scrollbar-hide'>
                        <button onClick={() => setActiveTab('profile')} className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Profile</button>
                        <button onClick={() => setActiveTab('settings')} className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Settings</button>
                        <button onClick={() => setActiveTab('activity')} className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition whitespace-nowrap ${activeTab === 'activity' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Activity</button>
                        <button onClick={() => setActiveTab('family')} className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition whitespace-nowrap ${activeTab === 'family' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Family</button>
                        <button onClick={() => setActiveTab('medical-files')} className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition whitespace-nowrap ${activeTab === 'medical-files' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Medical Files</button>
                    </nav>
                </div>
            </header>

            {activeTab === 'family' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-sm font-medium text-gray-700'>Family</h3>
                        <button onClick={() => setShowAddMember(true)} className='px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-600 transition'>Add Member</button>
                    </div>

                    {family?.members?.length ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {family.members.map((m) => (
                                <div key={m._id || m.entryId} className='p-3 bg-white border rounded-lg flex gap-3 items-start'>
                                    <img src={m.image || assets.default_profile} alt={m.name} className='w-12 h-12 rounded-full object-cover border' />
                                    <div className='flex-1'>
                                        <div className='flex items-center gap-2'>
                                            <p className='font-medium text-gray-800'>{m.name}</p>
                                            <span className='text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-primary-700'>{m.relation}</span>
                                        </div>
                                        <p className='text-xs text-gray-500 mt-1'>Entry ID: <button className='underline' onClick={() => copyEntryId(m.entryId)}>{m.entryId}</button></p>
                                        <div className='mt-1 grid grid-cols-2 gap-1 text-xs text-gray-700'>
                                            {m.email && <p>Email: {m.email}</p>}
                                            {m.phone && <p>Phone: {m.phone}</p>}
                                            {m.gender && m.gender !== 'Not Selected' && <p>Gender: {m.gender}</p>}
                                            {m.dateOfBirth && <p>DOB: {m.dateOfBirth}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMember(m._id)} className='text-red-500 hover:text-red-600'>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h12a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM5 6a1 1 0 011-1h8a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='py-10 bg-white border rounded-lg flex flex-col items-center justify-center'>
                            <div className='w-64 h-64'>
                                {DotLottiePlayer ? (
                                    <DotLottiePlayer src={'https://lottie.host/4c7470f3-c3dd-449f-8185-28546cc7f0e9/jVpErnBcBV.lottie'} autoplay loop style={{ width: '100%', height: '100%' }} />
                                ) : fallbackAnim ? (
                                    <Lottie animationData={fallbackAnim} loop autoplay style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <div className='w-full h-full flex items-center justify-center text-gray-400 text-sm'>Loading…</div>
                                )}
                            </div>
                        </div>
                    )}

                    {showAddMember && (
                        <CreateFamily onMemberAdded={handleAddMember} onClose={() => setShowAddMember(false)} />
                    )}
                </div>
            )}

            {activeTab === 'medical-files' && (
                <MedicalFilesSection />
            )}

            {activeTab === 'profile' && (
                <div className='space-y-8'>

                    <div className='bg-white border rounded-xl p-4'>
                        <div className='flex justify-between items-center mb-2'>
                            <h3 className='text-sm font-medium text-gray-700'>Profile Completeness</h3>
                            <span className='text-sm font-semibold text-gray-800'>{profileCompleteness}%</span>
                        </div>
                        <div className='w-full bg-gray-100 rounded-full h-2'>
                            <div className='bg-primary h-2 rounded-full' style={{ width: `${profileCompleteness}%` }}></div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    {(!userData.isVerified || verificationStatus.isExpired) && (
                        <div className='bg-white border rounded-xl p-4'>
                            <div className='flex items-center gap-3'>
                                <div className=' #5f6FFF p-2 rounded-full'>
                                    <img src={assets.info_icon} alt="Info" className="w-4 h-4" />
                                </div>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium text-gray-800'>Verify Your Account</p>
                                    <p className='text-xs text-gray-500 mt-1'>Unlock a verified badge and premium features.</p>
                                </div>
                                <button onClick={() => navigate('/verification')} className='text-xs px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-600 transition'>Get Verified</button>
                            </div>
                        </div>
                    )}

                    <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white border rounded-xl p-4 sm:p-6'>
                        <label htmlFor='image' className='relative cursor-pointer flex-shrink-0'>
                            <img
                                className='w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border'
                                src={image ? URL.createObjectURL(image) : userData.image || assets.default_profile}
                                alt="Profile"
                            />
                            {isEdit && <div className='w-6 h-6 absolute bottom-0 right-0 bg-primary rounded-full flex items-center justify-center'>
                                <img className='w-4 h-4' src={assets.upload_icon} alt="Upload" />
                            </div>}
                        </label>
                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden accept="image/*" />
                        <div className='text-center sm:text-left flex-1'>
                            {isEdit
                                ? <input
                                    className='text-lg font-medium border-b border-gray-300 focus:outline-none w-full sm:w-auto'
                                    type="text"
                                    onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                                    value={userData.name}
                                />
                                : <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <p className='text-lg font-medium'>{userData.name}</p>
                                    {userData.isVerified && !verificationStatus.isExpired && (
                                        <div className="tooltip" title={`Verified ${userData.verifiedPlan} Plan`}>
                                            <img src={assets.verified_icon} alt="Verified" className="w-5 h-5" />
                                        </div>
                                    )}
                                    {verificationStatus.isExpired && (
                                        <div className="tooltip" title="Verification Expired">
                                            <img
                                                src={assets.info_icon}
                                                alt="Expired"
                                                className="w-5 h-5 opacity-50"
                                                style={{ filter: 'invert(50%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            }
                            <p className='text-gray-500 text-sm mt-1'>{userData.email}</p>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className='bg-white border rounded-xl p-4 sm:p-6'>
                        <h3 className='text-sm sm:text-base font-medium text-gray-700 mb-3 sm:mb-4'>Personal Information</h3>
                        {isEdit ? (
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                                <div>
                                    <label className='block text-xs sm:text-sm font-medium text-gray-500 mb-1'>Name</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        type="text"
                                        value={userData.name}
                                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Email</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none bg-gray-50'
                                        type="email"
                                        value={userData.email}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Phone</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        type="tel"
                                        value={userData.phone}
                                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Gender</label>
                                    <select
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        value={userData.gender}
                                        onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                                    >
                                        <option value="Not Selected">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Date of Birth</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        type="date"
                                        value={userData.dob}
                                        onChange={(e) => setUserData({ ...userData, dob: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div>
                                    <p className='text-sm font-medium text-gray-500'>Name</p>
                                    <p className='text-gray-700'>{userData.name || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className='text-sm font-medium text-gray-500'>Email</p>
                                    <p className='text-gray-700'>{userData.email}</p>
                                </div>
                                <div>
                                    <p className='text-sm font-medium text-gray-500'>Phone</p>
                                    <p className='text-gray-700'>{userData.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className='text-sm font-medium text-gray-500'>Gender</p>
                                    <p className='text-gray-700'>{userData.gender !== 'Not Selected' ? userData.gender : 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className='text-sm font-medium text-gray-500'>Date of Birth</p>
                                    <p className='text-gray-700'>{userData.dob || 'Not provided'}</p>
                                </div>
                                {userData.isVerified && (
                                    <div className="col-span-1 md:col-span-2 mt-2">
                                        <div className="flex items-center gap-2  #5f6FFF p-3 rounded-md">
                                            <img src={assets.verified_icon} alt="Verified" className="w-5 h-5" />
                                            <div>
                                                <p className="text-sm font-medium text-primary-700">Verified Account</p>
                                                <p className="text-xs text-blue-600">
                                                    {userData.verifiedPlan} Plan • Verified on {new Date(userData.verifiedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className='bg-white border rounded-xl p-4 sm:p-6'>
                        <h3 className='text-sm sm:text-base font-medium text-gray-700 mb-3 sm:mb-4'>Address</h3>
                        {isEdit ? (
                            <div className='space-y-3 sm:space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Address Line 1</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        type="text"
                                        value={userData.address?.line1 || ''}
                                        onChange={(e) => setUserData({
                                            ...userData,
                                            address: { ...userData.address, line1: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-500 mb-1'>Address Line 2</label>
                                    <input
                                        className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                        type="text"
                                        value={userData.address?.line2 || ''}
                                        onChange={(e) => setUserData({
                                            ...userData,
                                            address: { ...userData.address, line2: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 mb-1'>City</label>
                                        <input
                                            className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                            type="text"
                                            value={userData.address?.city || ''}
                                            onChange={(e) => setUserData({
                                                ...userData,
                                                address: { ...userData.address, city: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 mb-1'>State</label>
                                        <input
                                            className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                            type="text"
                                            value={userData.address?.state || ''}
                                            onChange={(e) => setUserData({
                                                ...userData,
                                                address: { ...userData.address, state: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-500 mb-1'>Pincode</label>
                                        <input
                                            className='w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
                                            type="text"
                                            value={userData.address?.pincode || ''}
                                            onChange={(e) => setUserData({
                                                ...userData,
                                                address: { ...userData.address, pincode: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='space-y-1'>
                                {userData.address?.line1 ? (
                                    <>
                                        <p className='text-gray-700'>{userData.address.line1}</p>
                                        {userData.address.line2 && <p className='text-gray-700'>{userData.address.line2}</p>}
                                        <p className='text-gray-700'>
                                            {[
                                                userData.address.city,
                                                userData.address.state,
                                                userData.address.pincode
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                    </>
                                ) : (
                                    <p className='text-gray-500 text-sm'>No address provided</p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className='bg-white border rounded-xl p-4'>
                        <VHealthCard />
                    </div>

                    <div className='flex flex-col sm:flex-row justify-end gap-3 mt-6'>
                        {isEdit ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEdit(false);
                                        setImage(false);
                                        loadUserProfileData();
                                    }}
                                    className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 border rounded-lg hover:bg-gray-50 transition'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateUserProfileData}
                                    className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-600 transition font-medium'
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEdit(true)}
                                className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-600 transition font-medium'
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <SettingsPage />
            )}

            {activeTab === 'activity' && (
                <div className='space-y-6'>
                    <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-3'>
                        <div>
                            <h3 className='text-lg font-medium text-gray-600 mb-1'>Login History</h3>
                            <p className='text-xs text-gray-500'>Shows IP and device information when available</p>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-end gap-2'>
                            <div className='flex items-end gap-2'>
                                <div>
                                    <label className='block text-xs text-gray-500 mb-1'>From</label>
                                    <input type='date' value={dateFilter.from} onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })} className='border rounded-md px-2 py-1 text-sm' />
                                </div>
                                <div>
                                    <label className='block text-xs text-gray-500 mb-1'>To</label>
                                    <input type='date' value={dateFilter.to} onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })} className='border rounded-md px-2 py-1 text-sm' />
                                </div>
                            </div>
                            <div className='flex items-end gap-2'>
                                <button onClick={() => { setCurrentPage(1); fetchLoginHistory(); }} className='px-3 py-1.5 text-sm bg-primary text-white rounded-md'>Apply</button>
                                <button onClick={() => { setDateFilter({ from: '', to: '' }); setCurrentPage(1); fetchLoginHistory(); }} className='px-3 py-1.5 text-sm border rounded-md'>Clear</button>
                                <button onClick={() => window.print()} className='px-3 py-1.5 text-sm border rounded-md'>Print</button>
                            </div>
                        </div>
                    </div>

                    {isLoadingHistory ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : loginHistory.length > 0 ? (
                        <div className='space-y-4'>
                            {loginHistory.map((record) => (
                                <div key={record._id} className='flex items-start space-x-3 p-4 bg-white border rounded-lg'>
                                    <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className='flex-grow'>
                                        <div className='flex justify-between items-start'>
                                            <div>
                                                <p className='font-medium text-gray-700'>Login from {record.deviceInfo}</p>
                                                <p className='text-sm text-gray-500'>IP: {record.ipAddress}</p>
                                                {record.userAgent && <p className='text-xs text-gray-400 mt-1 line-clamp-1'>UA: {record.userAgent}</p>}
                                            </div>
                                            <p className='text-xs text-gray-400'>
                                                {new Date(record.loginTime).toLocaleString()}
                                            </p>
                                        </div>
                                        {record.location && (
                                            <p className='text-sm text-gray-500 mt-1'>
                                                Location: {record.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-8'>
                            <p className='text-gray-500'>No login history available</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className='flex justify-center items-center space-x-2 mt-6'>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Previous
                            </button>
                            <span className='text-sm text-gray-600'>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default MyProfile