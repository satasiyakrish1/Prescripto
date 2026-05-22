import React, { useState, useContext, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { 
  FileText, 
  Download, 
  Calendar, 
  Shield, 
  Server, 
  Eye, 
  AlertTriangle, 
  Lock,
  CheckCircle
} from 'lucide-react'

const LogsDownload = () => {
    const [date, setDate] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [logTypes, setLogTypes] = useState({
        system: true,
        access: true,
        error: true,
        security: true
    })

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)
    const { darkMode } = useTheme()

    // Set default date to today
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
    }, []);

    const handleLogTypeChange = (type) => {
        setLogTypes(prev => ({
            ...prev,
            [type]: !prev[type]
        }))
    }

    const downloadLogs = async (e) => {
        e.preventDefault()
        
        if (!date) {
            return toast.error('Please select a date')
        }

        // Check if at least one log type is selected
        if (!Object.values(logTypes).some(value => value)) {
            return toast.error('Please select at least one log type')
        }

        try {
            setIsLoading(true)
            
            // Create an array of selected log types
            const selectedLogTypes = Object.entries(logTypes)
                .filter(([_, isSelected]) => isSelected)
                .map(([type]) => type)

            // Check token validity
            if (!aToken) {
                throw new Error('Authentication token is missing');
            }

            // Log request details for debugging
            console.log('Sending request with:', {
                url: `${backendUrl}/api/admin/logs`,
                params: { date, types: selectedLogTypes.join(',') },
                headers: { Authorization: aToken ? 'Token exists' : 'No token' }
            });

            // Make API request to download logs
            const response = await axios({
                method: 'GET',
                url: `${backendUrl}/api/admin/logs`,
                params: {
                    date,
                    types: selectedLogTypes.join(',')
                },
                headers: { 
                    'Authorization': `Bearer ${aToken}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'blob', // Important for file download
                timeout: 30000, // Increase timeout for large files
                withCredentials: true // Include cookies if using session-based auth
            })

            // Check if response is valid
            if (!response.data || response.data.size === 0) {
                throw new Error('Received empty response from server');
            }

            // Verify the content type is correct for a ZIP file
            const contentType = response.headers['content-type'];
            if (contentType !== 'application/zip') {
                console.warn(`Unexpected content type: ${contentType}. Expected: application/zip`);
            }
            
            // Create a download link for the file
            const blob = new Blob([response.data], { type: 'application/zip' });
            
            // Verify the blob size is reasonable
            if (blob.size < 10) { // Very small files are likely errors
                throw new Error('Downloaded file is too small to be a valid ZIP archive');
            }
            
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `server-logs-${date}.zip`)
            document.body.appendChild(link)
            link.click()
            
            // Clean up after a short delay to ensure download starts
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);
            
            toast.success('Logs downloaded successfully')
        } catch (error) {
            console.error('Error downloading logs:', error)
            
            // Enhanced error logging
            if (error.response) {
                console.error('Response status:', error.response.status)
                console.error('Response headers:', error.response.headers)
                
                // Try to parse error blob if possible
                if (error.response.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorData = JSON.parse(reader.result);
                            console.error('Error data:', errorData);
                            toast.error(errorData.message || 'Failed to download logs');
                        } catch (e) {
                            // If we can't parse as JSON, try to display as text
                            const textContent = reader.result;
                            console.error('Error content:', textContent);
                            if (textContent && typeof textContent === 'string') {
                                toast.error(`Failed to download logs: ${textContent.substring(0, 100)}`);
                            } else {
                                toast.error('Failed to download logs: Server error');
                            }
                        }
                    };
                    reader.readAsText(error.response.data);
                } else {
                    toast.error(error.response.data?.message || 'Failed to download logs');
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
                toast.error('Failed to download logs: No response from server');
            } else {
                console.error('Error message:', error.message);
                toast.error(`Failed to download logs: ${error.message}`);
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
            {/* Minimalistic Header */}
            <div className="mb-6">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : ' #5f6FFF'} rounded-lg`}>
                        <FileText className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Server Logs
                        </h1>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Download and manage system logs securely
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Download Form */}
                <div className="lg:col-span-2">
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-6`}>
                        <div className="flex items-center space-x-2 mb-6">
                            <Download className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Download Logs
                            </h2>
                        </div>
                
                        <form onSubmit={downloadLogs} className='space-y-6'>
                            <div>
                                <label htmlFor='log-date' className={`flex items-center space-x-2 mb-3 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Calendar className="w-4 h-4" />
                                    <span>Select Date</span>
                                </label>
                                <input 
                                    type='date' 
                                    id='log-date'
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-blue-500'}`}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className={`flex items-center space-x-2 mb-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Server className="w-4 h-4" />
                                    <span>Log Types</span>
                                </label>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    {[
                                        { key: 'system', label: 'System Logs', icon: Server },
                                        { key: 'access', label: 'Access Logs', icon: Eye },
                                        { key: 'error', label: 'Error Logs', icon: AlertTriangle },
                                        { key: 'security', label: 'Security Logs', icon: Lock }
                                    ].map(({ key, label, icon: Icon }) => (
                                        <label key={key} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            logTypes[key] 
                                                ? darkMode ? 'bg-blue-900/20 border-blue-600' : ' #5f6FFF border-primary-200'
                                                : darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}>
                                            <input 
                                                type='checkbox' 
                                                checked={logTypes[key]}
                                                onChange={() => handleLogTypeChange(key)}
                                                className='sr-only'
                                            />
                                            <div className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
                                                logTypes[key] 
                                                    ? 'bg-primary-600 border-blue-600' 
                                                    : darkMode ? 'border-gray-500' : 'border-gray-300'
                                            }`}>
                                                {logTypes[key] && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <Icon className={`w-4 h-4 ${logTypes[key] ? darkMode ? 'text-blue-400' : 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <span className={`text-sm font-medium ${logTypes[key] ? darkMode ? 'text-blue-400' : 'text-blue-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className='pt-4'>
                                <button 
                                    type='submit' 
                                    className={`w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                                        isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
                                    } ${darkMode ? 'bg-primary-600 hover:bg-blue-700 text-white' : 'bg-primary-600 hover:bg-blue-700 text-white'}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-5 w-5" />
                                            <span>Download Logs</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Security Info Sidebar */}
                <div className="space-y-6">
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-6`}>
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Security Notice
                            </h3>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                            Server logs contain sensitive information. Ensure proper authorization before downloading.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Encrypted download</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Audit trail logged</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Admin access required</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-6`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Log Types Info
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <Server className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>System</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Server operations & performance</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Eye className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Access</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User login & API requests</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Error</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Application errors & exceptions</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Lock className={`w-4 h-4 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Security</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Authentication & authorization</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LogsDownload