import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

export const useAuth = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useAuth must be used within an AppContextProvider')
    }
    return context
}

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
        setUserData(false)
        setIsAuthenticated(false)
    }

    // Getting Doctors using API with retry mechanism
    const getDoctosData = async (retryCount = 0) => {
        try {
            // Add a timeout to the axios request
            const { data } = await axios.get(`${backendUrl}/api/doctor/list`, {
                timeout: 15000 // 15 seconds timeout (increased from 10s)
            })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log('Doctor data fetch error:', error)
            if (error.response) {
                // Server responded with an error status code
                toast.error(error.response.data?.message || 'Server error')
            } else if (error.request) {
                // Request was made but no response received
                console.error('Connection error details:', {
                    url: `${backendUrl}/api/doctor/list`,
                    error: error.message,
                    status: error.request?.status,
                    statusText: error.request?.statusText,
                    readyState: error.request?.readyState
                })

                // Implement retry logic (max 3 retries with exponential backoff)
                if (retryCount < 3) {
                    const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    console.log(`Retrying connection (${retryCount + 1}/3) in ${backoffTime}ms...`)
                    // Wait with exponential backoff before retrying
                    setTimeout(() => getDoctosData(retryCount + 1), backoffTime)
                    return
                }

                toast.error(`Network error: Unable to connect to the backend server at ${backendUrl}. Please check your internet connection or server status.`)
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }
    }

    // Getting User Profile using API with retry mechanism
    const loadUserProfileData = async (retryCount = 0) => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
                headers: { token },
                timeout: 15000 // 15 seconds timeout (increased from 10s)
            })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log('User profile fetch error:', error)
            if (error.response) {
                // Server responded with an error status code
                toast.error(error.response.data?.message || 'Server error')
            } else if (error.request) {
                // Check if token is invalid or expired
                if (token) {
                    try {
                        // Try to parse the token to see if it's valid JSON
                        JSON.parse(atob(token.split('.')[1]))
                    } catch (e) {
                        // If token is invalid, clear it and show auth error
                        localStorage.removeItem('token')
                        setToken('')
                        toast.error('Authentication failed. Please login again.')
                        return
                    }
                }

                console.error('Connection error details:', {
                    url: `${backendUrl}/api/user/get-profile`,
                    error: error.message,
                    status: error.request?.status,
                    statusText: error.request?.statusText,
                    readyState: error.request?.readyState
                })

                // Implement retry logic (max 3 retries with exponential backoff)
                if (retryCount < 3) {
                    const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                    console.log(`Retrying profile connection (${retryCount + 1}/3) in ${backoffTime}ms...`)
                    // Wait with exponential backoff before retrying
                    setTimeout(() => loadUserProfileData(retryCount + 1), backoffTime)
                    return
                }

                toast.error(`Network error: Unable to connect to the backend server at ${backendUrl}. Please check your internet connection or server status.`)
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }
    }

    useEffect(() => {
        getDoctosData()
    }, [])

    useEffect(() => {
        if (token) {
            // Validate token format and expiration
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]))
                const expTime = tokenData.exp * 1000 // Convert to milliseconds

                if (expTime < Date.now()) {
                    toast.error('Session expired. Please login again.')
                    logout()
                    return
                }

                setIsAuthenticated(true)
                loadUserProfileData()
            } catch (error) {
                console.error('Invalid token:', error)
                toast.error('Invalid session. Please login again.')
                logout()
            }
        } else {
            setIsAuthenticated(false)
        }
    }, [token])

    // Theme Management
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    }

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,
        isAuthenticated,
        logout,
        theme, toggleTheme
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider