import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { sendAppointmentConfirmation } from "../utils/emailService.js";
import { sendAppointmentCancellation } from "../utils/emailReminderService.js";
import { sendAppointmentCompletion as sendZohoAppointmentCompletion } from "../utils/zohoWebhookService.js";
import Todo from "../models/Todo.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });

        // Get doctor's email for notifications
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Send confirmation emails for new appointments
        const newAppointments = appointments.filter(apt => !apt.emailSent);
        for (const appointment of newAppointments) {
            try {
                await sendAppointmentConfirmation(
                    appointment,
                    appointment.userData.email,
                    doctor.email
                );
                // Mark appointment as email sent
                await appointmentModel.findByIdAndUpdate(appointment._id, { emailSent: true });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        }

        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            // Update appointment status
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            
            // Get doctor data for email
            const doctor = await doctorModel.findById(docId);
            if (!doctor) {
                return res.json({ success: false, message: 'Doctor not found' });
            }
            
            // Send cancellation notification emails
            try {
                await sendAppointmentCancellation(appointmentData);
                console.log('Appointment cancellation notification sent successfully');
            } catch (emailError) {
                console.error('Failed to send cancellation notification:', emailError);
                // Continue with the response even if email fails
            }
            
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment not found or not authorized' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            // Update appointment status
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            
            // Get doctor data for email
            const doctor = await doctorModel.findById(docId);
            if (!doctor) {
                return res.json({ success: false, message: 'Doctor not found' });
            }
            
            // Send completion notification emails
            try {
                await sendAppointmentCompletion(appointmentData);
                console.log('Appointment completion notification sent successfully');
            } catch (emailError) {
                console.error('Failed to send completion notification:', emailError);
                // Continue with the response even if email fails
            }
            
            // Send completion to Zoho webhook
            try {
                const webhookResult = await sendZohoAppointmentCompletion(appointmentData);
                if (webhookResult.success) {
                    console.log('Appointment completion sent to Zoho webhook successfully');
                } else {
                    console.warn('Failed to send completion to Zoho webhook:', webhookResult.error);
                }
            } catch (webhookError) {
                console.error('Error sending completion to Zoho webhook:', webhookError);
                // Continue with the response even if webhook fails
            }
            
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment not found or not authorized' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        
        // Add booking mode information to each doctor
        const doctorsWithBookingInfo = doctors.map(doctor => ({
            ...doctor.toObject(),
            bookingMode: doctor.bookingMode || 'default',
            emergencyFee: doctor.emergencyFee || 0
        }));
        
        res.json({ success: true, doctors: doctorsWithBookingInfo })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const doctor = await doctorModel.findById(docId).select('-password')

        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        // Include booking settings in profile data
        const profileData = {
            ...doctor.toObject(),
            bookingMode: doctor.bookingMode || 'default',
            customSlots: doctor.customSlots || [],
            emergencyFee: doctor.emergencyFee || 0,
            instantBookingSettings: doctor.instantBookingSettings || {
                enabled: false,
                normalFee: doctor.fees || 0,
                emergencyFeeMultiplier: 1.5
            }
        };

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Todo Controllers
const getDoctorTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ doctor: req.doctor._id, admin: null })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      todos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching todos',
      error: error.message
    });
  }
};

const createDoctorTodo = async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const todo = await Todo.create({
      title,
      doctor: req.doctor._id,
      admin: null
    });

    res.status(201).json({
      success: true,
      todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating todo',
      error: error.message
    });
  }
};

const updateDoctorTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const todo = await Todo.findOne({ _id: id, doctor: req.doctor._id, admin: null });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    todo.completed = completed;
    await todo.save();

    res.status(200).json({
      success: true,
      todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating todo',
      error: error.message
    });
  }
};

const deleteDoctorTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findOneAndDelete({ _id: id, doctor: req.doctor._id, admin: null });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting todo',
      error: error.message
    });
  }
};

// API to get doctor booking settings
const getBookingSettings = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const doctor = await doctorModel.findById(doctorId).select('bookingMode customSlots fees emergencyFee instantBookingSettings');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      bookingSettings: {
        bookingMode: doctor.bookingMode || 'default',
        customSlots: doctor.customSlots || [],
        fees: doctor.fees || 0,
        emergencyFee: doctor.emergencyFee || 0,
        instantBookingSettings: doctor.instantBookingSettings || {
          enabled: false,
          normalFee: doctor.fees || 0,
          emergencyFeeMultiplier: 1.5
        }
      }
    });
  } catch (error) {
    console.error('Error getting booking settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking settings',
      error: error.message
    });
  }
};

// API to update doctor booking settings
const updateBookingSettings = async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const { bookingMode, customSlots, fees, emergencyFee, instantBookingSettings } = req.body;

    // Validate booking mode
    if (bookingMode && !['instant', 'custom', 'default'].includes(bookingMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking mode'
      });
    }

    // Validate custom slots if provided
    if (customSlots && Array.isArray(customSlots)) {
      for (const slot of customSlots) {
        if (!slot.id || !slot.startTime || !slot.endTime || slot.price === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Invalid custom slot data'
          });
        }
      }
    }

    // Calculate emergency fee for instant booking mode
    let calculatedEmergencyFee = emergencyFee;
    if (bookingMode === 'instant' && instantBookingSettings && instantBookingSettings.normalFee) {
      calculatedEmergencyFee = Math.round(instantBookingSettings.normalFee * (instantBookingSettings.emergencyFeeMultiplier || 1.5));
    }

    // Update doctor settings
    const updateData = {
      bookingMode: bookingMode || 'default',
      fees: fees || 0,
      emergencyFee: calculatedEmergencyFee
    };

    if (customSlots) {
      updateData.customSlots = customSlots;
    }

    if (instantBookingSettings) {
      updateData.instantBookingSettings = {
        enabled: bookingMode === 'instant',
        normalFee: instantBookingSettings.normalFee || fees || 0,
        emergencyFeeMultiplier: instantBookingSettings.emergencyFeeMultiplier || 1.5
      };
    }

    const updatedDoctor = await doctorModel.findByIdAndUpdate(
      doctorId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking settings updated successfully',
      bookingSettings: {
        bookingMode: updatedDoctor.bookingMode,
        customSlots: updatedDoctor.customSlots,
        fees: updatedDoctor.fees,
        emergencyFee: updatedDoctor.emergencyFee,
        instantBookingSettings: updatedDoctor.instantBookingSettings
      }
    });
  } catch (error) {
    console.error('Error updating booking settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking settings',
      error: error.message
    });
  }
};

// API to get doctor booking mode for patient booking page
const getDoctorBookingMode = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await doctorModel.findById(doctorId).select('bookingMode customSlots fees emergencyFee instantBookingSettings available');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.available) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available for bookings'
      });
    }

    res.json({
      success: true,
      bookingMode: doctor.bookingMode || 'default',
      customSlots: doctor.customSlots || [],
      fees: doctor.fees || 0,
      emergencyFee: doctor.emergencyFee || 0,
      instantBookingSettings: doctor.instantBookingSettings || {
        enabled: false,
        normalFee: doctor.fees || 0,
        emergencyFeeMultiplier: 1.5
      }
    });
  } catch (error) {
    console.error('Error getting doctor booking mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor booking mode',
      error: error.message
    });
  }
};

// API to get real-time analytics data for doctor dashboard
const getDoctorAnalytics = async (req, res) => {
    try {
        const docId = req.doctor._id
        const { dateRange, startDate, endDate } = req.query
        
        // Define date filters based on the requested range
        let dateFilter = {}
        const now = new Date()
        
        if (startDate && endDate) {
            // Custom date range
            dateFilter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        } else if (dateRange) {
            // Predefined ranges
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            
            switch(dateRange) {
                case 'today':
                    dateFilter = { date: { $gte: today } }
                    break
                case 'week':
                    const weekStart = new Date(today)
                    weekStart.setDate(today.getDate() - 7)
                    dateFilter = { date: { $gte: weekStart } }
                    break
                case 'month':
                    const monthStart = new Date(today)
                    monthStart.setMonth(today.getMonth() - 1)
                    dateFilter = { date: { $gte: monthStart } }
                    break
                case 'quarter':
                    const quarterStart = new Date(today)
                    quarterStart.setMonth(today.getMonth() - 3)
                    dateFilter = { date: { $gte: quarterStart } }
                    break
                case 'year':
                    const yearStart = new Date(today)
                    yearStart.setFullYear(today.getFullYear() - 1)
                    dateFilter = { date: { $gte: yearStart } }
                    break
                default:
                    // No date filter
                    break
            }
        }
        
        // Build the query
        const query = { docId, ...dateFilter }
        
        // Get appointments with the filter
        const appointments = await appointmentModel.find(query)
        
        // Get today's appointments for real-time tracking
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        
        const todayAppointments = await appointmentModel.find({
            docId,
            date: { $gte: todayStart, $lte: todayEnd }
        })
        
        // Calculate hourly distribution for today
        const hourlyDistribution = Array(24).fill(0)
        todayAppointments.forEach(appointment => {
            const timeStr = appointment.slotTime
            const hourMatch = timeStr.match(/^(\d+):/) 
            if (hourMatch) {
                const hour = parseInt(hourMatch[1])
                hourlyDistribution[hour]++
            }
        })
        
        // Format hourly data
        const hourlyData = hourlyDistribution.map((count, hour) => ({
            hour: hour.toString().padStart(2, '0') + ':00',
            appointments: count
        })).filter((_, i) => i >= 8 && i <= 20) // Only show business hours
        
        // Calculate status counts
        const statusCounts = {
            completed: todayAppointments.filter(a => a.isCompleted).length,
            pending: todayAppointments.filter(a => !a.isCompleted && !a.cancelled).length,
            cancelled: todayAppointments.filter(a => a.cancelled).length
        }
        
        // Calculate monthly data
        const monthlyData = {}
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (now.getMonth() - i + 12) % 12
            monthlyData[monthNames[monthIndex]] = { earnings: 0, appointments: 0, completed: 0 }
        }
        
        // Process appointments for monthly data
        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date)
            const month = monthNames[appointmentDate.getMonth()]
            
            if (monthlyData[month]) {
                monthlyData[month].appointments += 1
                
                if (appointment.isCompleted || appointment.payment) {
                    monthlyData[month].earnings += appointment.amount
                    monthlyData[month].completed += appointment.isCompleted ? 1 : 0
                }
            }
        })
        
        // Format monthly data for charts
        const monthlyEarnings = Object.keys(monthlyData).map(month => ({
            name: month,
            earnings: monthlyData[month].earnings,
            appointments: monthlyData[month].appointments
        }))
        
        // Calculate booking modes
        const bookingModes = {
            default: 0,
            instant: 0,
            custom: 0
        }
        
        appointments.forEach(appointment => {
            if (appointment.bookingMode) {
                bookingModes[appointment.bookingMode] += 1
            } else {
                bookingModes.default += 1
            }
        })
        
        // Format booking modes for charts
        const bookingModesData = [
            { name: 'Regular', value: bookingModes.default },
            { name: 'Instant', value: bookingModes.instant },
            { name: 'Custom', value: bookingModes.custom }
        ]
        
        // Calculate weekday distribution
        const weekdays = {
            'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
        }
        
        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date)
            const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][appointmentDate.getDay()]
            weekdays[weekday] += 1
        })
        
        // Format weekday data
        const weekdayDistribution = Object.keys(weekdays).map(day => ({
            name: day,
            appointments: weekdays[day]
        }))
        
        // Count unique patients per month for trends
        const patientsByMonth = {}
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (now.getMonth() - i + 12) % 12
            patientsByMonth[monthNames[monthIndex]] = new Set()
        }
        
        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date)
            const month = monthNames[appointmentDate.getMonth()]
            if (patientsByMonth[month]) {
                patientsByMonth[month].add(appointment.userId)
            }
        })
        
        // Format patient trends data
        const patientTrends = Object.keys(patientsByMonth).map(month => ({
            name: month,
            patients: patientsByMonth[month].size,
            newPatients: Math.floor(patientsByMonth[month].size * 0.3) // Simulating new patients (30% of total)
        }))
        
        // Prepare response data
        const analyticsData = {
            realTimeData: {
                hourlyDistribution: hourlyData,
                statusCounts,
                lastUpdated: new Date()
            },
            monthlyEarnings,
            bookingModes: bookingModesData,
            weekdayDistribution,
            patientTrends,
            appointmentStats: [
                { name: 'Completed', value: appointments.filter(a => a.isCompleted).length },
                { name: 'Cancelled', value: appointments.filter(a => a.cancelled).length },
                { name: 'Pending', value: appointments.filter(a => !a.isCompleted && !a.cancelled).length }
            ]
        }
        
        res.json({ success: true, analyticsData })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile,
    getDoctorTodos,
    createDoctorTodo,
    updateDoctorTodo,
    deleteDoctorTodo,
    getBookingSettings,
    updateBookingSettings,
    getDoctorBookingMode,
    getDoctorAnalytics
}