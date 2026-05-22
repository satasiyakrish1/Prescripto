import React, { useState, useContext, useEffect, useRef } from 'react'
import { X, Lock, Shield, Mail, Bell, Moon, Smartphone, HelpCircle, History, Globe } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { PharmacyContext } from '../context/PharmacyContext'
import { AppContext } from '../context/AppContext'

const SettingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    const [activeTab, setActiveTab] = useState('general')
    const { darkMode, toggleDarkMode } = useTheme()
    const { language, changeLanguage } = useLanguage()
    const { currencyCode, setCurrencyCode, currencySymbol, setCurrencySymbol, backendUrl } = useContext(AppContext)

    // Auth contexts 
    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)
    const { pToken } = useContext(PharmacyContext)

    // Form States
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [recoveryEmail, setRecoveryEmail] = useState('')
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState(localStorage.getItem('selectedCountry') || 'USA')
    const [sessions, setSessions] = useState([])
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const heartbeatRef = useRef(null)
    const pollRef = useRef(null)

    // Handlers
    const handlePasswordChange = (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }
        toast.info("Password update functionality coming soon")
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleRecoveryEmailUpdate = (e) => {
        e.preventDefault()
        toast.success("Recovery email updated")
    }

    const toggle2FA = () => {
        setTwoFactorEnabled(!twoFactorEnabled)
        toast.success(twoFactorEnabled ? "2FA Disabled" : "2FA Enabled")
    }

    const handleCurrencyChange = (e) => {
        const code = e.target.value
        setCurrencyCode(code)
        // Set symbol based on selection
        switch (code) {
            case 'USD': setCurrencySymbol('$'); break;
            case 'INR': setCurrencySymbol('₹'); break;
            case 'EUR': setCurrencySymbol('€'); break;
            case 'GBP': setCurrencySymbol('£'); break;
            default: setCurrencySymbol('$');
        }
    }

    const handleCountryChange = (e) => {
        const country = e.target.value
        setSelectedCountry(country)
        localStorage.setItem('selectedCountry', country)
    }

    const fetchSessions = async () => {
        try {
            const token = aToken || localStorage.getItem('aToken')
            const { data } = await axios.get(`${backendUrl}/api/admin/sessions`, { headers: { aToken: token } })
            if (data.success) setSessions(data.data)
        } catch (e) {
        } finally {
            setSessionsLoading(false)
        }
    }

    const revokeSession = async (id) => {
        try {
            const token = aToken || localStorage.getItem('aToken')
            const { data } = await axios.post(`${backendUrl}/api/admin/sessions/${id}/revoke`, {}, { headers: { aToken: token } })
            if (data.success) {
                toast.success('Session ended')
                fetchSessions()
            }
        } catch {
            toast.error('Failed to end session')
        }
    }

    const revokeOthers = async () => {
        try {
            const token = aToken || localStorage.getItem('aToken')
            const { data } = await axios.post(`${backendUrl}/api/admin/sessions/revoke-others`, {}, { headers: { aToken: token } })
            if (data.success) {
                toast.success('Other sessions ended')
                fetchSessions()
            }
        } catch {
            toast.error('Failed to end other sessions')
        }
    }

    const startHeartbeat = () => {
        if (heartbeatRef.current) return
        heartbeatRef.current = setInterval(async () => {
            try {
                const token = aToken || localStorage.getItem('aToken')
                await axios.post(`${backendUrl}/api/admin/sessions/heartbeat`, {}, { headers: { aToken: token } })
            } catch {}
        }, 20000)
    }

    const stopHeartbeat = () => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
            heartbeatRef.current = null
        }
    }

    const startPolling = () => {
        if (pollRef.current) return
        pollRef.current = setInterval(fetchSessions, 10000)
    }

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    useEffect(() => {
        if (isOpen && activeTab === 'activity') {
            setSessionsLoading(true)
            fetchSessions()
            startHeartbeat()
            startPolling()
            return () => {
                stopHeartbeat()
                stopPolling()
            }
        } else {
            stopHeartbeat()
            stopPolling()
        }
    }, [isOpen, activeTab])

    const tabs = [
        { id: 'general', label: 'General', icon: <SettingsIcon /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'activity', label: 'Activity', icon: <History size={18} /> }
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
            <div className={`w-full max-w-5xl h-[560px] rounded-2xl shadow-xl overflow-hidden flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>

                {/* Sidebar */}
                <div className={`w-60 flex-shrink-0 border-r ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="px-5 py-4">
                        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Manage preferences</p>
                    </div>
                    <nav className="px-2 space-y-0.5">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition ${activeTab === tab.id
                                    ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900')
                                    : (darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50' : 'text-gray-600 hover:bg-gray-50')
                                    }`}
                            >
                                <span className={activeTab === tab.id ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : ''}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className={`h-14 flex items-center justify-between px-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <h3 className="font-semibold text-base capitalize">{activeTab}</h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-50 text-gray-400'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 max-w-2xl">
                                {/* Appearance */}
                                <section>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Appearance</h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                <Moon size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Dark Mode</p>
                                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Toggle dark theme</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                                            <div className={`w-9 h-5 rounded-full peer transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'} peer-checked:bg-indigo-600`}>
                                                <div className={`absolute top-[2px] left-[2px] bg-white border rounded-full h-4 w-4 transition-transform ${darkMode ? 'translate-x-full border-white' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>
                                </section>

                                <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

                                {/* Regional Settings */}
                                <section>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Regional</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Country / Region</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedCountry}
                                                    onChange={handleCountryChange}
                                                    className={`w-full p-2.5 rounded-lg border text-sm outline-none appearance-none cursor-pointer ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <option value="USA">United States</option>
                                                    <option value="UK">United Kingdom</option>
                                                    <option value="India">India</option>
                                                    <option value="EU">Europe</option>
                                                    <option value="Canada">Canada</option>
                                                </select>
                                                <Globe size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Currency</label>
                                            <div className="relative">
                                                <select
                                                    value={currencyCode}
                                                    onChange={handleCurrencyChange}
                                                    className={`w-full p-2.5 rounded-lg border text-sm outline-none appearance-none cursor-pointer ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="INR">INR (₹)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                </select>
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 pointer-events-none">
                                                    {currencySymbol}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Global prices and fees will automatically update to reflect your selected currency.
                                    </p>
                                </section>

                                <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

                                {/* Language */}
                                <section>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Language</h4>
                                    <div>
                                        <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interface Language</label>
                                        <select
                                            value={language}
                                            onChange={() => { }}
                                            className={`w-full p-2.5 rounded-lg border text-sm outline-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="es">Español</option>
                                            <option value="fr">Français</option>
                                        </select>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 max-w-2xl">
                                {/* Password */}
                                <section>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Password</h4>
                                    <form onSubmit={handlePasswordChange} className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5 text-gray-500">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium mb-1.5 text-gray-500">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1.5 text-gray-500">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`w-full p-2.5 rounded-lg border text-sm outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2 flex items-center justify-between">
                                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Terms and conditions apply</p>
                                            <button type="submit" className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white text-sm font-medium rounded-lg hover:opacity-90">Update Password</button>
                                        </div>
                                    </form>
                                </section>

                                <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

                                {/* 2FA */}
                                <section>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">Two-Factor Authentication</p>
                                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                Add an extra layer of security.
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={twoFactorEnabled} onChange={toggle2FA} className="sr-only peer" />
                                            <div className={`w-9 h-5 rounded-full peer transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'} peer-checked:bg-indigo-600`}>
                                                <div className={`absolute top-[2px] left-[2px] bg-white border rounded-full h-4 w-4 transition-transform ${twoFactorEnabled ? 'translate-x-[16px] border-white' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>
                                </section>

                                <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

                                {/* Recovery Email */}
                                <section>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Recovery Email</h4>
                                    <form onSubmit={handleRecoveryEmailUpdate} className="flex gap-2.5">
                                        <input
                                            type="email"
                                            placeholder="backup@example.com"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            className={`flex-1 p-2.5 rounded-lg border text-sm outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                                        />
                                        <button type="submit" className={`px-4 py-2 text-sm font-medium rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50 bg-gray-50'}`}>
                                            Verify
                                        </button>
                                    </form>
                                </section>
                            </div>
                        )}

                        {/* ACTIVITY TAB */}
                        {activeTab === 'activity' && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Recent Sessions</h4>
                                    <div className="flex gap-2">
                                        <button onClick={fetchSessions} className={`px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>Refresh</button>
                                        <button onClick={revokeOthers} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">End Other Sessions</button>
                                    </div>
                                </div>
                                <div className={`rounded-xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                    {sessionsLoading ? (
                                        <div className="p-6 text-sm text-gray-500">Loading sessions…</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className={`text-left border-b ${darkMode ? 'text-gray-400 border-gray-800' : 'text-gray-600 border-gray-100'}`}>
                                                        <th className="py-2.5 px-3">Device</th>
                                                        <th className="py-2.5 px-3">IP</th>
                                                        <th className="py-2.5 px-3">Issued</th>
                                                        <th className="py-2.5 px-3">Last Seen</th>
                                                        <th className="py-2.5 px-3">Status</th>
                                                        <th className="py-2.5 px-3">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sessions.map(s => (
                                                        <tr key={s._id} className={`${darkMode ? 'border-gray-800' : 'border-gray-100'} border-b`}>
                                                            <td className="py-2 px-3">{s.deviceInfo || 'Unknown'}</td>
                                                            <td className="py-2 px-3">{s.ipAddress || 'Unknown'}</td>
                                                            <td className="py-2 px-3">{s.issuedAt ? new Date(s.issuedAt).toLocaleString() : '—'}</td>
                                                            <td className="py-2 px-3">{s.lastSeen ? new Date(s.lastSeen).toLocaleString() : '—'}</td>
                                                            <td className="py-2 px-3">{s.revoked ? <span className="text-red-500">Revoked</span> : <span className="text-green-600">Active</span>}</td>
                                                            <td className="py-2 px-3">
                                                                {!s.revoked ? (
                                                                    <button onClick={() => revokeSession(s._id)} className={`px-3 py-1 rounded-md border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>End</button>
                                                                ) : (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {sessions.length === 0 && (
                                                        <tr>
                                                            <td className="py-6 text-center text-gray-500" colSpan={6}>No sessions found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6 max-w-xl">
                                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Preferences</h4>
                                <div className={`rounded-xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                    {['Email Notifications', 'Push Notifications', 'Weekly Report', 'New Appointment', 'Task Updates'].map((item, idx) => (
                                        <div key={idx} className={`p-4 flex items-center justify-between border-b last:border-0 ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                                                <div className={`w-9 h-5 rounded-full peer peer-focus:outline-none transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'} peer-checked:bg-indigo-600`}>
                                                    <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-4 w-4 transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
)

export default SettingsModal
