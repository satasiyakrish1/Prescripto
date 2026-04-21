import axios from "axios";
import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { ViewerContext } from "./ViewerContext.jsx";


export const AdminContext = createContext()

export const useAdmin = () => {
    const context = useContext(AdminContext)
    if (!context) {
        throw new Error('useAdmin must be used within an AdminContextProvider')
    }
    return context
}

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [filteredAppointments, setFilteredAppointments] = useState([])
    const [filters, setFilters] = useState({
        status: 'all',
        doctor: 'all',
        dateFrom: '',
        dateTo: ''
    })
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)
    const [subscribers, setSubscribers] = useState([])
    const [isTokenExpired, setIsTokenExpired] = useState(false)

    const { vToken, setVToken, vRole } = useContext(ViewerContext) || {}
    const isReadOnly = aToken ? false : (vRole === 'viewer')

    useEffect(() => {
        const token = aToken || vToken;
        if (token) {
            // Validate token format before making API calls
            try {
                // Simple validation - check if token looks like a JWT (has two dots)
                if (!token.includes('.') || token.split('.').length !== 3) {
                    console.error('Invalid token format detected');
                    return;
                }

                // Reset token expired state when token changes
                setIsTokenExpired(false);

                // Proceed with data fetching
                getAllDoctors();
                getAllAppointments();
                getDashData();
                getAllSubscribers();
            } catch (error) {
                console.error('Token validation error:', error);
            }
        }
    }, [aToken, vToken]);

    const handle401Error = (error) => {
        if (error.response && error.response.status === 401) {
            if (!isTokenExpired) {
                setIsTokenExpired(true);
                console.error('Authentication token expired or invalid');
                toast.error('Your session has expired. Please login again.');
                localStorage.removeItem('aToken');
                localStorage.removeItem('vToken');
                setAToken('');
                if (setVToken) setVToken('');
            }
            return true; // Error was handled
        }
        return false; // Error was not handled
    };

    useEffect(() => {
        const reqInterceptor = axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('aToken') || localStorage.getItem('vToken');
            if (token) {
                config.headers = config.headers || {};
                config.headers.aToken = token;
                config.headers.vToken = token;
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        const resInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    handle401Error(error);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, [isTokenExpired]);

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            // Improved error handling for AxiosError
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else if (error.request) {
                toast.error(`Network error: Unable to connect to the backend server.`)
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }

    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {
            const response = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                const appointmentsData = data.appointments.reverse()
                setAppointments(appointmentsData)
                setFilteredAppointments(appointmentsData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {
        try {
            const response = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }

    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }

    }

    // Function to download all appointments as CSV
    const downloadAppointmentsCSV = async () => {
        try {
            // Get the CSV file from the backend
            const response = await axios.get(backendUrl + '/api/admin/download-appointments', {
                headers: { aToken: aToken || vToken },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'appointments.csv')
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success('Appointments downloaded successfully')
        } catch (error) {
            console.log(error)
            toast.error('Failed to download appointments')
        }
    }

    // Function to apply filters to appointments
    const applyFilters = () => {
        let result = [...appointments]

        if (filters.status !== 'all') {
            if (filters.status === 'completed') {
                result = result.filter(item => item.isCompleted)
            } else if (filters.status === 'cancelled') {
                result = result.filter(item => item.cancelled)
            } else if (filters.status === 'upcoming') {
                result = result.filter(item => !item.isCompleted && !item.cancelled)
            }
        }

        if (filters.doctor !== 'all') {
            result = result.filter(item => item.docData._id === filters.doctor)
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            result = result.filter(item => new Date(item.slotDate) >= fromDate)
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999)
            result = result.filter(item => new Date(item.slotDate) <= toDate)
        }

        setFilteredAppointments(result)
    }

    const updateFilters = (newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }))
    }

    useEffect(() => {
        if (appointments.length > 0) {
            applyFilters()
        }
    }, [filters, appointments])

    // Function to remove doctor
    const removeDoctor = async (docId) => {
        try {
            const response = await axios.post(backendUrl + '/api/admin/remove-doctor', { docId }, { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }
    }

    // Getting all subscribers from Database using API
    const getAllSubscribers = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/admin/subscribers', { headers: { aToken: aToken || vToken } })
            const { data } = response

            if (data.success) {
                setSubscribers(data.subscribers)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error')
            } else {
                toast.error(error.message || 'An error occurred')
            }
        }
    }

    const value = {
        aToken,
        setAToken,
        appointments,
        filteredAppointments,
        filters,
        updateFilters,
        doctors,
        dashData,
        subscribers,
        getAllDoctors,
        changeAvailability,
        getAllAppointments,
        cancelAppointment,
        getDashData,
        downloadAppointmentsCSV,
        removeDoctor,
        getAllSubscribers,
        handle401Error,
        isReadOnly
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
