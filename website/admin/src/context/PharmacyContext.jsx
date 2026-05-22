import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const PharmacyContext = createContext();

const PharmacyContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [pToken, setPToken] = useState(localStorage.getItem('pToken') || '');
    const [medicines, setMedicines] = useState([]);
    const [dashData, setDashData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [inventoryStats, setInventoryStats] = useState(null);
    const [isTokenExpired, setIsTokenExpired] = useState(false);

    useEffect(() => {
        if (pToken) {
            // Validate token format before making API calls
            try {
                // Simple validation - check if token looks like a JWT (has two dots)
                if (!pToken.includes('.') || pToken.split('.').length !== 3) {
                    console.error('Invalid token format detected');
                    toast.error('Invalid authentication token. Please login again.');
                    // Clear invalid token
                    localStorage.removeItem('pToken');
                    setPToken('');
                    return;
                }
                
                // Reset token expired state when token changes
                setIsTokenExpired(false);
                
                // Proceed with data fetching
                getDashData();
                getProfileData();
                getInventoryStats();
            } catch (error) {
                console.error('Token validation error:', error);
            }
        }
    }, [pToken]);
    
    // Handle 401 errors globally
    const handle401Error = (error) => {
        if (error.response && error.response.status === 401) {
            // Only show the error message once
            if (!isTokenExpired) {
                setIsTokenExpired(true);
                console.error('Authentication token expired or invalid');
                toast.error('Your session has expired. Please login again.');
                // Clear the token
                localStorage.removeItem('pToken');
                setPToken('');
            }
            return true; // Error was handled
        }
        return false; // Error was not handled
    };

    // Getting Pharmacy dashboard data using API
    const getDashData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/pharmacy/dashboard`, {
                headers: { pToken }
            });
            
            if (data.success) {
                setDashData(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching dashboard data');
            }
        }
    };

    // Getting Pharmacy profile data
    const getProfileData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/pharmacy/profile`, {
                headers: { pToken }
            });
            
            if (data.success) {
                setProfileData(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch profile data');
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching profile data');
            }
        }
    };

    // Pharmacy Login
    const pharmacyLogin = async (formData) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/pharmacy/login`, formData);
            
            if (data.success) {
                localStorage.setItem('pToken', data.token);
                setPToken(data.token);
                toast.success('Login successful');
                return true;
            } else {
                toast.error(data.message || 'Login failed');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    // Pharmacy Logout
    const pharmacyLogout = () => {
        localStorage.removeItem('pToken');
        setPToken('');
        setDashData(null);
        setProfileData(null);
        setMedicines([]);
        toast.success('Logged out successfully');
    };

    // Complete a sale
    const completeSale = async (saleId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/pharmacy/complete-sale`, 
                { saleId },
                { headers: { pToken } }
            );
            
            if (data.success) {
                toast.success('Sale completed successfully');
                getDashData(); // Refresh dashboard data
                return true;
            } else {
                toast.error(data.message || 'Failed to complete sale');
                return false;
            }
        } catch (error) {
            console.error('Error completing sale:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error completing sale');
            }
            return false;
        }
    };

    // Cancel a sale
    const cancelSale = async (saleId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/pharmacy/cancel-sale`, 
                { saleId },
                { headers: { pToken } }
            );
            
            if (data.success) {
                toast.success('Sale cancelled successfully');
                getDashData(); // Refresh dashboard data
                return true;
            } else {
                toast.error(data.message || 'Failed to cancel sale');
                return false;
            }
        } catch (error) {
            console.error('Error cancelling sale:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error cancelling sale');
            }
            return false;
        }
    };

    // Get inventory statistics
    const getInventoryStats = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/pharmacy/inventory-stats`, {
                headers: { pToken }
            });
            
            if (data.success) {
                setInventoryStats(data.data);
                return data.data;
            } else {
                toast.error(data.message || 'Failed to fetch inventory statistics');
                return null;
            }
        } catch (error) {
            console.error('Error fetching inventory statistics:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching inventory statistics');
            }
            return null;
        }
    };

    // Update profile data
    const updateProfile = async (formData) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/pharmacy/update-profile`, 
                formData,
                { headers: { pToken } }
            );
            
            if (data.success) {
                setProfileData(data.data);
                toast.success('Profile updated successfully');
                return true;
            } else {
                toast.error(data.message || 'Failed to update profile');
                return false;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error updating profile');
            }
            return false;
        }
    };

    // Get analytics data
    const getAnalyticsData = async (type, params = {}) => {
        try {
            let endpoint = '';
            
            // Map different analytics types to the appropriate endpoint
            switch (type) {
                case 'overview':
                case 'category-stats':
                case 'stock-status':
                case 'monthly-report':
                case 'top-medicines':
                case 'stock-alerts':
                    endpoint = '/api/pharmacy/analytics-overview';
                    break;
                default:
                    endpoint = '/api/pharmacy/analytics-overview';
            }
            
            const { data } = await axios.get(`${backendUrl}${endpoint}`, {
                headers: { pToken },
                params
            });
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Analytics API error:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching analytics overview:', error);
            if (!handle401Error(error)) {
                // Don't show toast for analytics errors to avoid spam
                console.error('Analytics fetch failed:', error.response?.data?.message || error.message);
            }
            return null;
        }
    };
    
    // Get recent sales for POS page
    const getRecentSales = async (limit = 10) => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/pharmacy/sell/recent`, {
                params: { limit },
                headers: { pToken }
            });
            
            if (data.success) {
                return data.data;
            } else {
                toast.error(data.message || 'Failed to fetch recent sales');
                return [];
            }
        } catch (error) {
            console.error('Error fetching recent sales:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching recent sales');
            }
            return [];
        }
    };

    const contextValue = {
        pToken,
        setPToken,
        medicines,
        setMedicines,
        dashData,
        setDashData,
        profileData,
        setProfileData,
        inventoryStats,
        setInventoryStats,
        pharmacyLogin,
        pharmacyLogout,
        getDashData,
        getProfileData,
        completeSale,
        cancelSale,
        getInventoryStats,
        updateProfile,
        getAnalyticsData,
        getRecentSales,
        handle401Error
    };

    return (
        <PharmacyContext.Provider value={contextValue}>
            {props.children}
        </PharmacyContext.Provider>
    );
};

export default PharmacyContextProvider;