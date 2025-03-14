import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";


export const AdminContext = createContext()

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

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                const appointmentsData = data.appointments.reverse()
                setAppointments(appointmentsData)
                setFilteredAppointments(appointmentsData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Function to download all appointments as CSV
    const downloadAppointmentsCSV = async () => {
        try {
            // Get the CSV file from the backend
            const response = await axios.get(backendUrl + '/api/admin/download-appointments', {
                headers: { aToken },
                responseType: 'blob' // Important for handling file downloads
            })
            
            // Create a blob URL for the CSV file
            const url = window.URL.createObjectURL(new Blob([response.data]))
            
            // Create a temporary link element to trigger the download
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'appointments.csv')
            document.body.appendChild(link)
            
            // Trigger the download
            link.click()
            
            // Clean up
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
        
        // Filter by status
        if (filters.status !== 'all') {
            if (filters.status === 'completed') {
                result = result.filter(item => item.isCompleted)
            } else if (filters.status === 'cancelled') {
                result = result.filter(item => item.cancelled)
            } else if (filters.status === 'upcoming') {
                result = result.filter(item => !item.isCompleted && !item.cancelled)
            }
        }
        
        // Filter by doctor
        if (filters.doctor !== 'all') {
            result = result.filter(item => item.docData._id === filters.doctor)
        }
        
        // Filter by date range
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            result = result.filter(item => new Date(item.slotDate) >= fromDate)
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999) // End of the day
            result = result.filter(item => new Date(item.slotDate) <= toDate)
        }
        
        setFilteredAppointments(result)
    }

    // Function to update filters
    const updateFilters = (newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }))
    }

    // Effect to apply filters whenever they change
    useEffect(() => {
        if (appointments.length > 0) {
            applyFilters()
        }
    }, [filters, appointments])

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments,
        filteredAppointments,
        filters,
        updateFilters,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        downloadAppointmentsCSV
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider