import { createContext, useState, useEffect } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'


export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)
    const [isTokenExpired, setIsTokenExpired] = useState(false)
    
    useEffect(() => {
        if (dToken) {
            // Validate token format before making API calls
            try {
                // Simple validation - check if token looks like a JWT (has two dots)
                if (!dToken.includes('.') || dToken.split('.').length !== 3) {
                    console.error('Invalid token format detected');
                    toast.error('Invalid authentication token. Please login again.');
                    // Clear invalid token
                    localStorage.removeItem('dToken');
                    setDToken('');
                    return;
                }
                
                // Reset token expired state when token changes
                setIsTokenExpired(false);
                
                // Proceed with data fetching
                getAppointments();
                getProfileData();
                getDashData();
            } catch (error) {
                console.error('Token validation error:', error);
            }
        }
    }, [dToken]);
    
    // Handle 401 errors globally
    const handle401Error = (error) => {
        if (error.response && error.response.status === 401) {
            // Only show the error message once
            if (!isTokenExpired) {
                setIsTokenExpired(true);
                console.error('Authentication token expired or invalid');
                toast.error('Your session has expired. Please login again.');
                // Clear the token
                localStorage.removeItem('dToken');
                setDToken('');
            }
            return true; // Error was handled
        }
        return false; // Error was not handled
    };

    // Getting Doctor appointment data from Database using API
    const getAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/appointments', { headers: { dToken } })

            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.error('Error fetching appointments:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching appointments');
            }
        }
    }

    // Getting Doctor profile data from Database using API
    const getProfileData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/profile', { headers: { dToken } })
            console.log(data.profileData)
            setProfileData(data.profileData)

        } catch (error) {
            console.error('Error fetching profile data:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching profile data');
            }
        }
    }

    // Function to cancel doctor appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/cancel-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
                // after creating dashboard
                getDashData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.error('Error cancelling appointment:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error cancelling appointment');
            }
        }

    }

    // Function to Mark appointment completed using API
    const completeAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/doctor/complete-appointment', { appointmentId }, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
                // Later after creating getDashData Function
                getDashData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.error('Error completing appointment:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error completing appointment');
            }
        }

    }

    // Getting Doctor dashboard data using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/dashboard', { headers: { dToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Error fetching dashboard data');
            }
        }

    }

    const value = {
        dToken, setDToken, backendUrl,
        appointments,
        getAppointments,
        cancelAppointment,
        completeAppointment,
        dashData, getDashData,
        profileData, setProfileData,
        getProfileData,
        handle401Error
    }

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )


}

export default DoctorContextProvider