import React, { useContext, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import jsPDF from 'jspdf'
import GoogleFitData from '../components/GoogleFitData'
import { QRCodeSVG } from 'qrcode.react'
import 'leaflet/dist/leaflet.css'
import {
    Calendar,
    MapPin,
    Clock,
    CreditCard,
    Download,
    X,
    CheckCircle,
    AlertCircle,
    Navigation,
    FileText,
    Share2,
    Search,
    Filter,
    XCircle,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Star
} from 'lucide-react'

const MyAppointments = () => {
    const { backendUrl, token, currencySymbol } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [payment, setPayment] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming', 'past', 'cancelled'

    // Search and filter states
    const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('')
    const [selectedSpeciality, setSelectedSpeciality] = useState('all')
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
    const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'week', 'month'
    const [showFilters, setShowFilters] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const [banStatus, setBanStatus] = useState(null) // { isBlocked, blockUntil, noShowCount }

    // Map related states
    const [showMap, setShowMap] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const mapRef = useRef(null)
    const mapContainerRef = useRef(null)
    const markerRef = useRef(null)

    // Google Drive popup state
    const [showDrivePopup, setShowDrivePopup] = useState(false)
    const [currentAppointment, setCurrentAppointment] = useState(null)
    const [pdfBlob, setPdfBlob] = useState(null)
    const [isUploading, setIsUploading] = useState(false)

    const appointmentsPerPage = 5

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to verify Zoho payment after user returns from payment page
    const verifyZohoPayment = async (appointmentId, paymentLinkId) => {
        try {
            toast.info('Verifying payment status...');
            const { data } = await axios.post(backendUrl + '/api/user/verifyZoho', {
                appointmentId,
                payment_link_id: paymentLinkId
            }, { headers: { token } })

            if (data.success) {
                toast.success(data.testMode ?
                    'Payment verified successfully (Test Mode)!' :
                    'Real payment completed successfully!'
                );
                // Clear session storage
                sessionStorage.removeItem('pending_appointment_id');
                sessionStorage.removeItem('pending_payment_link_id');
                // Refresh appointments
                getUserAppointments();
                return true;
            } else {
                toast.error(data.message || 'Payment verification failed');
                return false;
            }
        } catch (error) {
            console.error('Zoho payment verification error:', error);
            toast.error(error.response?.data?.message || error.message || 'Payment verification failed');
            return false;
        }
    };

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Function to copy booking ID to clipboard
    const copyBookingId = (id) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedId(id)
            toast.success('Booking ID copied!')
            setTimeout(() => setCopiedId(null), 2000)
        }).catch(() => {
            toast.error('Failed to copy')
        })
    }

    // Function to create Google Calendar URL
    const createGoogleCalendarUrl = (appointment) => {
        try {
            // Parse the date from slot format (DD_MM_YYYY)
            const dateArray = appointment.slotDate.split('_');
            const day = parseInt(dateArray[0], 10);
            const month = parseInt(dateArray[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(dateArray[2], 10);

            // Validate the year (should be a 4-digit number)
            if (year < 1000 || year > 9999) {
                console.error('Invalid year format:', year);
                return '#'; // Return empty link if year is invalid
            }

            // Parse the time
            const timeStr = appointment.slotTime;
            const [time, period] = timeStr.split(' ');
            const [hoursStr, minutesStr] = time.split(':');
            const hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);

            // Create JavaScript Date objects
            const startDate = new Date(year, month, day);

            // Set hours and minutes
            let hour24 = hours;
            if (period === 'PM' && hour24 < 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;

            startDate.setHours(hour24, minutes, 0);

            // Create end date (1 hour after start)
            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 1);

            // Format for Google Calendar
            const formatForCalendar = (date) => {
                return date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0') +
                    'T' +
                    date.getHours().toString().padStart(2, '0') +
                    date.getMinutes().toString().padStart(2, '0') +
                    '00';
            };

            const startDateStr = formatForCalendar(startDate);
            const endDateStr = formatForCalendar(endDate);

            // Create event details
            const eventTitle = `Appointment with Dr. ${appointment.docData.name}`;
            const eventLocation = `${appointment.docData.address.line1}, ${appointment.docData.address.line2}`;
            const eventDescription = `Appointment with ${appointment.docData.name} (${appointment.docData.speciality})`;

            // For debugging - log the created date strings
            console.log('Start date string:', startDateStr);
            console.log('End date string:', endDateStr);
            console.log('Original date parts:', { day, month: month + 1, year });

            // Create Google Calendar URL
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateStr}/${endDateStr}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}&sf=true&output=xml`;

            return googleCalendarUrl;
        } catch (error) {
            console.error('Error creating Google Calendar URL:', error);
            return '#'; // Return empty link if there's an error
        }
    };


    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

            // Fetch ban / no-show status
            try {
                const { data: userData } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })
                if (userData.success) {
                    const u = userData.userData
                    const now = new Date()
                    const blockUntil = u.bookingBlockedUntil ? new Date(u.bookingBlockedUntil) : null
                    setBanStatus({
                        isBlocked: blockUntil && blockUntil > now,
                        blockUntil,
                        noShowCount: u.autoCancelCount || 0
                    })
                }
            } catch {}

            setLoading(false)
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
            setLoading(false)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.response?.data?.message || error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        }
    }

    // Function to make payment using Zoho Payments
    const appointmentZoho = async (appointmentId) => {
        try {
            toast.info('Initializing Zoho Payments...');
            const { data } = await axios.post(backendUrl + '/api/user/payment-zoho', { appointmentId }, { headers: { token } })

            if (data.success && data.payment_link_url) {
                // Store appointment ID in session storage for verification after payment
                sessionStorage.setItem('pending_appointment_id', appointmentId);
                sessionStorage.setItem('pending_payment_link_id', data.payment_link_id);

                if (data.testMode) {
                    toast.info('Redirecting to test payment page...');
                } else {
                    toast.success('Redirecting to Zoho Payments for real payment...');
                }

                // Use replace to prevent back button issues
                window.location.replace(data.payment_link_url);
            } else {
                const errorMsg = data.message || 'Failed to initialize Zoho payment';
                console.error('Zoho payment initialization failed:', data);
                toast.error(errorMsg);

                // Show additional debug info in development
                if (data.details || data.missing) {
                    console.error('Additional details:', { details: data.details, missing: data.missing });
                }
            }
        } catch (error) {
            console.error('Zoho payment error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to initialize Zoho payment';
            toast.error(errorMsg);

            // Show configuration hints in development
            if (error.response?.status === 500 && error.response?.data?.missing) {
                console.error('Configuration missing:', error.response.data.missing);
                toast.error('Payment configuration incomplete. Please check server logs.');
            }
        }
    }

    // Function to save appointment PDF to Google Drive
    const handleSaveToDrive = async (appointment) => {
        try {
            // Set the current appointment for the popup
            setCurrentAppointment(appointment);

            // Show the Google Drive popup
            setShowDrivePopup(true);

        } catch (error) {
            console.error('Error preparing for Google Drive upload:', error);
            toast.error('Failed to prepare for Google Drive upload: ' + (error.message || 'Unknown error'));
        }
    };

    // Function to handle the actual upload to Google Drive via backend
    const uploadToDriveViaBackend = async () => {
        try {
            if (!currentAppointment) {
                toast.error('No appointment data available');
                return;
            }

            // Set uploading state to true
            setIsUploading(true);

            toast.info('Uploading to Google Drive...');

            // Use the new API endpoint that handles everything
            const { data } = await axios.post(
                backendUrl + '/api/appointment-pdf/save-to-drive',
                { appointmentId: currentAppointment._id },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Uploaded to Google Drive successfully!');
                // Close the popup
                setShowDrivePopup(false);
                setPdfBlob(null);
                setCurrentAppointment(null);
                // Open the link in a new tab
                window.open(data.googleDrive.fileUrl, '_blank');
            } else {
                // Handle error from backend
                toast.error(data.message || 'Failed to upload to Google Drive');
                console.error('Google Drive upload error:', data.message);
            }
        } catch (error) {
            toast.error('Error uploading to Google Drive: ' + (error.response?.data?.message || error.message || 'Unknown error'));
            console.error('Google Drive upload exception:', error);
        } finally {
            // Reset uploading state
            setIsUploading(false);
        }
    };

    // Function to generate and download appointment details as PDF
    const downloadAppointmentPDF = (appointment) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPos = 20;

            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Appointment Details', pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // Add doctor info
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Doctor Information', margin, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${appointment.docData.name}`, margin, yPos);
            yPos += 8;
            doc.text(`Speciality: ${appointment.docData.speciality}`, margin, yPos);
            yPos += 8;
            doc.text('Address:', margin, yPos);
            yPos += 8;
            doc.text(`${appointment.docData.address.line1}`, margin, yPos);
            yPos += 8;
            doc.text(`${appointment.docData.address.line2}`, margin, yPos);
            yPos += 15;

            // Add appointment details
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Appointment Details', margin, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${slotDateFormat(appointment.slotDate)}`, margin, yPos);
            yPos += 8;
            doc.text(`Time: ${appointment.slotTime}`, margin, yPos);
            yPos += 8;
            doc.text(`Status: ${appointment.isCompleted ? 'Completed' : appointment.cancelled ? 'Cancelled' : 'Scheduled'}`, margin, yPos);
            yPos += 15;

            // Add payment details
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Payment Details', margin, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Payment Status: ${appointment.payment ? 'Paid' : 'Not Paid'}`, margin, yPos);
            yPos += 8;
            if (appointment.payment) {
                // Check if payment details exist in the payment object
                const paymentMethod = appointment.payment.method || appointment.paymentMethod || 'Online Payment';
                const amount = appointment.payment.amount || appointment.fees || '';
                const transactionId = appointment.payment.transactionId || appointment.transactionId || 'N/A';

                doc.text(`Payment Method: ${paymentMethod}`, margin, yPos);
                yPos += 8;
                doc.text(`Amount: ${currencySymbol}${amount}`, margin, yPos);
                yPos += 8;
                doc.text(`Transaction ID: ${transactionId}`, margin, yPos);
                yPos += 8;
            }

            // Add footer
            yPos = doc.internal.pageSize.getHeight() - 20;
            doc.setFontSize(10);
            doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, yPos, { align: 'center' });

            // Save the PDF
            doc.save(`Appointment_${appointment._id}.pdf`);
            toast.success('Appointment details downloaded successfully');
        } catch (error) {
            console.log(error);
            toast.error('Failed to download appointment details');
        }
    };

    // Function to generate and download all appointments as PDF
    const downloadAllAppointmentsPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPos = 20;

            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('All Appointments Summary', pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // Filter appointments based on active tab
            const filteredAppointments = filterAppointmentsByTab(appointments, activeTab);

            // Loop through all appointments
            filteredAppointments.forEach((appointment, index) => {
                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Add appointment separator if not first appointment
                if (index > 0) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
                    yPos += 10;
                }

                // Add doctor name and speciality
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.docData.name} - ${appointment.docData.speciality}`, margin, yPos);
                yPos += 10;

                // Add appointment details
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(`Date: ${slotDateFormat(appointment.slotDate)} | Time: ${appointment.slotTime}`, margin, yPos);
                yPos += 8;

                // Add status
                let status = 'Scheduled';
                if (appointment.isCompleted) status = 'Completed';
                if (appointment.cancelled) status = 'Cancelled';

                doc.text(`Status: ${status}`, margin, yPos);
                yPos += 8;

                // Add payment status
                doc.text(`Payment: ${appointment.payment ? 'Paid' : 'Not Paid'}`, margin, yPos);
                yPos += 20;
            });

            // Add footer
            yPos = doc.internal.pageSize.getHeight() - 20;
            doc.setFontSize(10);
            doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, yPos, { align: 'center' });

            // Save the PDF
            doc.save(`All_Appointments_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('All appointments downloaded successfully');
        } catch (error) {
            console.log(error);
            toast.error('Failed to download appointments');
        }
    };

    // Add this function near the other download functions
    const downloadPkpass = async (appointmentId) => {
        try {
            const response = await fetch(`${backendUrl}/api/wallet/appointments/${appointmentId}/pass`);
            if (!response.ok) throw new Error('Failed to download pass');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `appointment-${appointmentId}.pkpass`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Could not download pass.');
        }
    };

    /**
     * Resolve the appointment's actual date from multiple sources:
     *  1. slotDate  "DD_MM_YYYY"  ← most reliable
     *  2. scheduledAt  (ISO Date stored by scheduler)
     *  3. date  (Unix-ms timestamp stored on creation)
     * Returns a Date set to midnight, or null on total failure.
     */
    const resolveAppointmentDate = (a) => {
        // ── source 1: slotDate ──────────────────────────────────────────
        if (a.slotDate) {
            try {
                const parts = a.slotDate.split('_').map(Number);
                // parts = [day, month, year]  e.g. [10, 4, 2026]
                if (parts.length === 3 && parts[2] > 1000) {
                    const d = new Date(parts[2], parts[1] - 1, parts[0]);
                    d.setHours(0, 0, 0, 0);
                    if (!isNaN(d.getTime())) return d;
                }
            } catch {}
        }
        // ── source 2: scheduledAt (ISO string / Date) ───────────────────
        if (a.scheduledAt) {
            try {
                const d = new Date(a.scheduledAt);
                d.setHours(0, 0, 0, 0);
                if (!isNaN(d.getTime())) return d;
            } catch {}
        }
        // ── source 3: date field (Unix ms on booking creation) ──────────
        if (a.date) {
            try {
                const d = new Date(Number(a.date));
                d.setHours(0, 0, 0, 0);
                if (!isNaN(d.getTime())) return d;
            } catch {}
        }
        return null;
    };

    // Kept for backward-compat inside getFilteredAppointments date-range filter
    const parseSlotDate = (slotDate) => resolveAppointmentDate({ slotDate }) || new Date();

    // Is this appointment in the "cancelled / no-show" bucket?
    const isCancelledOrNoShow = (a) =>
        a.cancelled === true ||
        a.status === 'auto_cancelled' ||
        a.autoCancelled === true;

    // Filter appointments based on active tab
    const filterAppointmentsByTab = (appointments, tab) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        switch (tab) {
            case 'upcoming':
                return appointments.filter(a => {
                    if (isCancelledOrNoShow(a) || a.isCompleted) return false;
                    const d = resolveAppointmentDate(a);
                    // If we can't determine the date, keep it in upcoming (safe default)
                    return d === null || d >= todayStart;
                });

            case 'past':
                return appointments.filter(a => {
                    // cancelled / no-show → belongs to cancelled tab only
                    if (isCancelledOrNoShow(a)) return false;
                    // explicitly completed → always past
                    if (a.isCompleted) return true;
                    // expired (date in past, but NOT marked completed) → past
                    const d = resolveAppointmentDate(a);
                    return d !== null && d < todayStart;
                });

            case 'cancelled':
                return appointments.filter(a => isCancelledOrNoShow(a));

            default:
                return appointments;
        }
    };

    // Enhanced filter with search and filters
    const getFilteredAppointments = () => {
        let filtered = filterAppointmentsByTab(appointments, activeTab);

        // Search filter
        if (appointmentSearchQuery.trim()) {
            const query = appointmentSearchQuery.toLowerCase();
            filtered = filtered.filter(appointment => 
                appointment.docData.name.toLowerCase().includes(query) ||
                appointment.docData.speciality.toLowerCase().includes(query) ||
                appointment.userData.name.toLowerCase().includes(query) ||
                appointment._id.toLowerCase().includes(query)
            );
        }

        // Speciality filter
        if (selectedSpeciality !== 'all') {
            filtered = filtered.filter(appointment => 
                appointment.docData.speciality === selectedSpeciality
            );
        }

        // Payment status filter
        if (selectedPaymentStatus !== 'all') {
            if (selectedPaymentStatus === 'paid') {
                filtered = filtered.filter(appointment => appointment.payment);
            } else if (selectedPaymentStatus === 'unpaid') {
                filtered = filtered.filter(appointment => !appointment.payment);
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            filtered = filtered.filter(appointment => {
                const appointmentDate = parseSlotDate(appointment.slotDate);

                if (dateFilter === 'today') {
                    return appointmentDate.getTime() === today.getTime();
                } else if (dateFilter === 'week') {
                    const weekFromNow = new Date(today);
                    weekFromNow.setDate(today.getDate() + 7);
                    return appointmentDate >= today && appointmentDate <= weekFromNow;
                } else if (dateFilter === 'month') {
                    const monthFromNow = new Date(today);
                    monthFromNow.setMonth(today.getMonth() + 1);
                    return appointmentDate >= today && appointmentDate <= monthFromNow;
                }
                return true;
            });
        }

        return filtered;
    };

    // Get current appointments based on pagination
    const getCurrentAppointments = () => {
        const filteredAppointments = getFilteredAppointments();
        const indexOfLastAppointment = currentPage * appointmentsPerPage;
        const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
        return filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
    };

    // Get unique specialities for filter dropdown
    const getUniqueSpecialities = () => {
        const specialities = appointments.map(apt => apt.docData.speciality);
        return [...new Set(specialities)];
    };

    // Calculate total pages
    const totalPages = Math.ceil(getFilteredAppointments().length / appointmentsPerPage);

    // Handle page changes
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Initialize Leaflet map
    const initializeMap = () => {
        // Import Leaflet dynamically to avoid SSR issues
        import('leaflet').then(L => {
            // Check if the map already exists
            if (mapRef.current) {
                mapRef.current.remove();
            }

            // Create a new map
            const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5); // Default center on India

            // Add the OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Store the map reference
            mapRef.current = map;
        });
    };

    // Search location using OpenStreetMap Nominatim API
    const searchLocation = async () => {
        if (!searchQuery.trim()) {
            toast.error('Please enter a location to search');
            return;
        }

        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                setSearchResults({
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon),
                    displayName: result.display_name
                });

                // Update map to show the location
                updateMapLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
            } else {
                toast.error('No results found for your search query');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            toast.error('Failed to search location');
        }
    };

    // Update map with new location
    const updateMapLocation = (lat, lon, displayName) => {
        import('leaflet').then(L => {
            if (!mapRef.current) return;

            // Update map view
            mapRef.current.setView([lat, lon], 16);

            // Remove previous marker if exists
            if (markerRef.current) {
                mapRef.current.removeLayer(markerRef.current);
            }

            // Add marker
            const marker = L.marker([lat, lon]).addTo(mapRef.current)
                .bindPopup(displayName)
                .openPopup();

            // Store marker reference
            markerRef.current = marker;

            // Show toast notification
            toast.success('Location found! Click "Open in Google Maps" to navigate.');
        });
    };

    // Open location in Google Maps
    const openInGoogleMaps = () => {
        if (!searchResults) return;

        const { lat, lon } = searchResults;
        window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
    };

    // Utility to detect Android
    const isAndroid = () => /android/i.test(navigator.userAgent);

    // Add downloadGooglePkpass function
    const downloadGooglePkpass = async (appointmentId) => {
        try {
            console.log('Downloading Google Wallet pass for appointment:', appointmentId);
            toast.info('Generating Google Wallet pass...');

            const response = await fetch(`${backendUrl}/api/wallet/appointments/${appointmentId}/google-pass`);
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to download pass: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success && data.passUrl) {
                // Open the Google Wallet pass URL in a new tab
                console.log('Opening Google Wallet pass URL:', data.passUrl);
                window.open(data.passUrl, '_blank');
                toast.success('Google Wallet pass generated successfully!');
            } else {
                console.error('Invalid response data:', data);
                toast.error(data.message || 'Could not generate Google Wallet pass.');
            }
        } catch (error) {
            console.error('Error generating Google Wallet pass:', error);
            toast.error(`Could not generate Google Wallet pass: ${error.message}`);
        }
    };

    useEffect(() => {
        if (token) {
            getUserAppointments();
        }
    }, [token]);

    // Reset to page 1 when changing tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Initialize map when showMap changes to true
    useEffect(() => {
        if (showMap) {
            // Small delay to ensure the DOM element exists
            setTimeout(() => {
                initializeMap();
            }, 100);
        }
    }, [showMap]);

    // Clean up map on component unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ── Ban / No-Show Alert Banner ──────────────────────── */}
                {banStatus && (banStatus.isBlocked || banStatus.noShowCount > 0) && (
                    <div className={`mb-6 rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3
                        ${banStatus.isBlocked
                            ? 'bg-red-50 border-red-200'
                            : banStatus.noShowCount >= 2
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-yellow-50 border-yellow-200'
                        }`}>
                        <div className="flex items-start gap-3 flex-1">
                            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${banStatus.isBlocked ? 'text-red-500' : 'text-amber-500'}`} />
                            <div>
                                {banStatus.isBlocked ? (
                                    <>
                                        <p className="text-sm font-semibold text-red-700">Booking suspended</p>
                                        <p className="text-xs text-red-600 mt-0.5">
                                            Your account is suspended from booking new appointments until{' '}
                                            <strong>{new Date(banStatus.blockUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                            {' '}due to {banStatus.noShowCount} missed appointment{banStatus.noShowCount !== 1 ? 's' : ''}.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-amber-700">
                                            Warning — {banStatus.noShowCount} of 3 no-show{banStatus.noShowCount !== 1 ? 's' : ''}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            {3 - banStatus.noShowCount} more missed appointment{3 - banStatus.noShowCount !== 1 ? 's' : ''} will suspend your account for 1 month.
                                            Please cancel in advance if you can't attend.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        {banStatus.isBlocked && (
                            <span className="shrink-0 text-xs font-medium text-red-500 bg-red-100 px-3 py-1 rounded-full">
                                Suspended
                            </span>
                        )}
                    </div>
                )}

                {/* Header Section - Clean & Minimal */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">My Appointments</h1>
                            <p className="text-gray-600 text-sm">Manage and track your healthcare appointments</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-sm relative"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Filters</span>
                                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {(appointmentSearchQuery || selectedSpeciality !== 'all' || selectedPaymentStatus !== 'all' || dateFilter !== 'all') && (
                                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                        {[appointmentSearchQuery, selectedSpeciality !== 'all', selectedPaymentStatus !== 'all', dateFilter !== 'all'].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowMap(!showMap)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-sm"
                            >
                                <MapPin className="w-4 h-4" />
                                {showMap ? 'Hide Map' : 'Find Clinic'}
                            </button>
                            <button
                                onClick={downloadAllAppointmentsPDF}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2 font-medium text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export All
                            </button>
                        </div>
                    </div>

                    {/* Tabs - Clean Underline Style */}
                    <div className="border-b border-gray-200">
                        <div className="flex gap-8">
                            {['upcoming', 'past', 'cancelled'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 text-sm font-semibold transition-all capitalize relative ${activeTab === tab
                                        ? 'text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-full"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    {showFilters && (
                        <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by doctor, patient, or ID..."
                                    value={appointmentSearchQuery}
                                    onChange={(e) => {
                                        setAppointmentSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                                {appointmentSearchQuery && (
                                    <button
                                        onClick={() => {
                                            setAppointmentSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Speciality Filter */}
                            <select
                                value={selectedSpeciality}
                                onChange={(e) => {
                                    setSelectedSpeciality(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none cursor-pointer"
                            >
                                <option value="all">All Specialities</option>
                                {getUniqueSpecialities().map((speciality, index) => (
                                    <option key={index} value={speciality}>{speciality}</option>
                                ))}
                            </select>

                            {/* Payment Status Filter */}
                            <select
                                value={selectedPaymentStatus}
                                onChange={(e) => {
                                    setSelectedPaymentStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none cursor-pointer"
                            >
                                <option value="all">All Payments</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>

                            {/* Date Filter */}
                            <select
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none cursor-pointer"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        {/* Active Filters Display */}
                        {(appointmentSearchQuery || selectedSpeciality !== 'all' || selectedPaymentStatus !== 'all' || dateFilter !== 'all') && (
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                                {appointmentSearchQuery && (
                                    <span className="px-3 py-1  #5f6FFF text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        Search: "{appointmentSearchQuery}"
                                        <button onClick={() => setAppointmentSearchQuery('')} className="hover:text-blue-900">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedSpeciality !== 'all' && (
                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        {selectedSpeciality}
                                        <button onClick={() => setSelectedSpeciality('all')} className="hover:text-purple-900">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedPaymentStatus !== 'all' && (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        {selectedPaymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                        <button onClick={() => setSelectedPaymentStatus('all')} className="hover:text-green-900">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {dateFilter !== 'all' && (
                                    <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : 'This Month'}
                                        <button onClick={() => setDateFilter('all')} className="hover:text-orange-900">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setAppointmentSearchQuery('');
                                        setSelectedSpeciality('all');
                                        setSelectedPaymentStatus('all');
                                        setDateFilter('all');
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}

                            {/* Results Count */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-bold text-gray-900">{getFilteredAppointments().length}</span> appointment{getFilteredAppointments().length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Section */}
                {showMap && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-blue-600" />
                            Find Location
                        </h2>
                        <div className="flex flex-col md:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for a hospital or clinic..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button
                                onClick={searchLocation}
                                className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-sm shadow-sm hover:shadow"
                            >
                                Search
                            </button>
                            {searchResults && (
                                <button
                                    onClick={openInGoogleMaps}
                                    className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Open Maps
                                </button>
                            )}
                        </div>
                        <div
                            ref={mapContainerRef}
                            className="h-80 rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                        ></div>
                        {searchResults && (
                            <div className="mt-4 p-4  #5f6FFF rounded-xl flex items-start gap-3 border border-blue-100">
                                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Location Found</p>
                                    <p className="text-xs text-gray-600 mt-1">{searchResults.displayName}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Appointments List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="relative w-12 h-12 mb-4">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-600 font-medium text-sm">Loading appointments...</p>
                    </div>
                ) : getCurrentAppointments().length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab} appointments</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">You don't have any appointments in this category yet.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {getCurrentAppointments().map((item, index) => (
                            <div key={index} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                                {/* Top Section: Doctor & Status */}
                                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                    {/* Doctor Image */}
                                    <div className="flex-shrink-0 relative">
                                        <img
                                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl bg-gray-50 shadow-inner"
                                            src={item.docData.image}
                                            alt={item.docData.name}
                                        />
                                    </div>

                                    {/* Doctor Details */}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-1">{item.docData.name}</h3>
                                                <p className="text-gray-500 font-medium text-sm">{item.docData.speciality}</p>
                                            </div>
                                            {/* Status Badge */}
                                            {(() => {
                                                const isNoShow = item.status === 'auto_cancelled' || item.autoCancelled;
                                                const cls = item.isCompleted
                                                    ? 'bg-green-50 text-green-700'
                                                    : isNoShow
                                                        ? 'bg-orange-50 text-orange-700'
                                                        : item.cancelled
                                                            ? 'bg-red-50 text-red-700'
                                                            : 'bg-blue-50 text-blue-700';
                                                const label = item.isCompleted
                                                    ? 'Completed'
                                                    : isNoShow
                                                        ? 'No-show / Expired'
                                                        : item.cancelled
                                                            ? 'Cancelled'
                                                            : 'Upcoming';
                                                return (
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${cls}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* Date & Location Info Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</p>
                                                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                        {slotDateFormat(item.slotDate)} <span className="text-gray-300 mx-1">|</span> {item.slotTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {item.docData.address.line1}
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowMap(true);
                                                                setSearchQuery(`${item.docData.address.line1}, ${item.docData.address.line2}`);
                                                                setTimeout(() => searchLocation(), 300);
                                                            }}
                                                            className="text-blue-600 hover:text-primary-700 p-1 rounded-full hover: #5f6FFF transition-colors"
                                                            title="View on Map"
                                                        >
                                                            <Navigation className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code - Minimalistic */}
                                    <div className="flex-shrink-0 flex items-center justify-center">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200">
                                            <QRCodeSVG
                                                value={`${window.location.origin}/appointment-scan/${item._id}`}
                                                size={90}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Divider */}
                                <div className="h-px bg-gray-100 w-full mb-5"></div>

                                {/* Actions Section */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Left Side: Booking ID & Google Calendar */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Compact Booking ID */}
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-xs font-mono text-gray-700">{item._id.slice(0, 8)}...</span>
                                            <button
                                                onClick={() => copyBookingId(item._id)}
                                                className="p-1 hover:bg-white rounded transition-all"
                                                title="Copy Full Booking ID"
                                            >
                                                {copiedId === item._id ? (
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                )}
                                            </button>
                                        </div>

                                        {!item.cancelled && !item.isCompleted && (
                                            <a
                                                href={createGoogleCalendarUrl(item)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors group/link"
                                            >
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-blue-600 transition-colors" />
                                                <span className="hidden sm:inline">Add to Calendar</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Right Side: Primary Actions */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Payment Logic */}
                                        {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && (
                                            <button
                                                onClick={() => setPayment(item._id)}
                                                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Pay Now
                                            </button>
                                        )}

                                        {!item.cancelled && !item.payment && !item.isCompleted && payment === item._id && (
                                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-100">
                                                <button
                                                    onClick={() => appointmentStripe(item._id)}
                                                    className="px-6 py-1.5 bg-white rounded-full shadow-sm flex items-center justify-center hover:scale-105 transition-transform min-w-[100px]"
                                                    title="Pay with Stripe"
                                                >
                                                    <img className="h-5 w-auto object-contain" src={assets.stripe_logo} alt="Stripe" />
                                                </button>
                                                <button
                                                    onClick={() => appointmentRazorpay(item._id)}
                                                    className="px-6 py-1.5 bg-white rounded-full shadow-sm flex items-center justify-center hover:scale-105 transition-transform min-w-[100px]"
                                                    title="Pay with Razorpay"
                                                >
                                                    <img className="h-5 w-auto object-contain" src={assets.razorpay_logo} alt="Razorpay" />
                                                </button>
                                                <button
                                                    onClick={() => appointmentZoho(item._id)}
                                                    className="px-6 py-1.5 bg-white rounded-full shadow-sm flex items-center justify-center hover:scale-105 transition-transform min-w-[100px]"
                                                    title="Pay with Zoho"
                                                >
                                                    <img className="h-5 w-auto object-contain" src="https://www.zoho.com/sites/zweb/images/productlogos/payments.svg" alt="Zoho" />
                                                </button>
                                            </div>
                                        )}

                                        {!item.cancelled && item.payment && !item.isCompleted && (
                                            <span className="px-4 py-2 bg-green-50 text-green-700 text-sm font-bold rounded-full flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Paid
                                            </span>
                                        )}

                                        {/* Post-Appointment Actions */}
                                        {(item.isCompleted || item.payment) && (
                                            <>
                                                {/* Google Wallet - Only Wallet Option */}
                                                <button
                                                    onClick={() => downloadGooglePkpass(item._id)}
                                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                                                >
                                                    <img src="https://brandlogos.net/wp-content/uploads/2022/05/google_wallet-logo_brandlogos.net_9vbqn.png" className="w-3.5 h-3.5" alt="Google Wallet" />
                                                    <span>Google Wallet</span>
                                                </button>

                                                {item.isCompleted && (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveToDrive(item)}
                                                            className="p-2.5 text-primary hover:text-primary-700 hover: #5f6FFF rounded-full transition-all"
                                                            title="Save to Drive"
                                                        >
                                                            <Share2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/testimonials/${item.docData._id}`)}
                                                            className="px-4 py-2 bg-yellow-500 text-white text-xs font-medium rounded-full hover:bg-yellow-600 transition-all flex items-center gap-2 shadow-sm"
                                                            title="Write Review"
                                                        >
                                                            <Star className="w-3.5 h-3.5" />
                                                            <span>Write Review</span>
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => downloadAppointmentPDF(item)}
                                                    className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                                                    title="Download Invoice"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Cancel Button */}
                                        {!item.cancelled && !item.isCompleted && (
                                            <button
                                                onClick={() => cancelAppointment(item._id)}
                                                className="px-5 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-full transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination - Minimal */}
                {
                    totalPages > 1 && (
                        <div className="flex justify-center pt-8">
                            <nav className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-white'
                                        }`}
                                >
                                    Previous
                                </button>

                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePageChange(index + 1)}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === index + 1
                                            ? 'bg-black text-white'
                                            : 'text-gray-600 hover:bg-white'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-white'
                                        }`}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    )
                }

                {/* Google Fit Section */}
                <div className="mt-12">
                    <GoogleFitData />
                </div>

                {/* Google Drive Popup - Minimal */}
                {
                    showDrivePopup && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Save to Drive</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowDrivePopup(false)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                                        disabled={isUploading}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className=" #5f6FFF/50 p-4 rounded-xl border border-blue-100 mb-6">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Your appointment details will be securely saved as a PDF file to your Google Drive account.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDrivePopup(false)}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={uploadToDriveViaBackend}
                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                                        style={{ backgroundColor: '#1a73e8' }}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4 brightness-0 invert" alt="" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    )
}

export default MyAppointments
