import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { 
    Calendar, 
    MapPin, 
    Clock, 
    User, 
    Phone, 
    Mail, 
    CheckCircle, 
    XCircle,
    ArrowLeft,
    CreditCard
} from 'lucide-react'

const AppointmentScan = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { backendUrl, currencySymbol } = useContext(AppContext)
    
    const [appointment, setAppointment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Format date
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Fetch appointment details
    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const { data } = await axios.get(`${backendUrl}/api/user/appointment/${id}`)
            
            if (data.success) {
                setAppointment(data.appointment)
            } else {
                setError(data.message || 'Appointment not found')
            }
        } catch (err) {
            console.error('Error fetching appointment:', err)
            setError(err.response?.data?.message || 'Failed to load appointment details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchAppointmentDetails()
        }
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="relative w-16 h-16 mb-4 mx-auto">
                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading appointment details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Not Found</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header with Status */}
                    <div className={`p-6 ${
                        appointment.isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        appointment.cancelled ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                        'bg-gradient-to-r from-primary to-indigo-500'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">Appointment Details</h1>
                                <p className="text-white/80 text-sm">Booking ID: {appointment._id}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                {appointment.isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                ) : appointment.cancelled ? (
                                    <XCircle className="w-5 h-5 text-white" />
                                ) : (
                                    <Clock className="w-5 h-5 text-white" />
                                )}
                                <span className="text-white font-bold text-sm">
                                    {appointment.isCompleted ? 'Completed' : appointment.cancelled ? 'Cancelled' : 'Upcoming'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Doctor Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Doctor Information
                            </h2>
                            <div className="flex items-start gap-6 bg-gray-50 p-6 rounded-2xl">
                                <img
                                    src={appointment.docData.image}
                                    alt={appointment.docData.name}
                                    className="w-24 h-24 rounded-xl object-cover shadow-md"
                                />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{appointment.docData.name}</h3>
                                    <p className="text-blue-600 font-medium mb-3">{appointment.docData.speciality}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <Mail className="w-4 h-4" />
                                            <span>{appointment.docData.email}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 mt-0.5" />
                                            <div>
                                                <p>{appointment.docData.address.line1}</p>
                                                <p>{appointment.docData.address.line2}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Patient Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-green-600" />
                                Patient Information
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-medium min-w-[120px]">Name:</span>
                                    <span className="text-gray-900 font-semibold">{appointment.userData.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-medium min-w-[120px]">Email:</span>
                                    <span className="text-gray-900 font-semibold">{appointment.userData.email}</span>
                                </div>
                                {appointment.userData.phone && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 font-medium min-w-[120px]">Phone:</span>
                                        <span className="text-gray-900 font-semibold">{appointment.userData.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Appointment Schedule
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <span className="text-gray-500 font-medium text-sm">Date</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">{slotDateFormat(appointment.slotDate)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                        <span className="text-gray-500 font-medium text-sm">Time</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">{appointment.slotTime}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-orange-600" />
                                Payment Details
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-600 font-medium">Payment Status:</span>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                                        appointment.payment ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {appointment.payment ? 'Paid' : 'Pending'}
                                    </span>
                                </div>
                                {appointment.payment && (
                                    <>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-600 font-medium">Amount:</span>
                                            <span className="text-gray-900 font-bold text-lg">
                                                {currencySymbol}{appointment.amount || appointment.fees}
                                            </span>
                                        </div>
                                        {appointment.transactionId && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">Transaction ID:</span>
                                                <span className="text-gray-900 font-mono text-sm">{appointment.transactionId}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                        <p className="text-center text-gray-500 text-sm">
                            This is a verified appointment record. For any queries, please contact the clinic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppointmentScan
