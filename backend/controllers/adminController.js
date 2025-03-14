import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import { generateAppointmentsCSV } from "../utils/csvGenerator.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        // Get best doctor of the month
        const getBestDoctor = async () => {
          const currentDate = new Date();
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
          const doctors = await doctorModel.find({});
          const appointments = await appointmentModel.find({
            slotDate: { $gte: firstDayOfMonth },
            isCompleted: true
          });
        
          const doctorStats = {};
        
          appointments.forEach(appointment => {
            const docId = appointment.docId;
            if (!doctorStats[docId]) {
              doctorStats[docId] = {
                completedAppointments: 0,
                totalRevenue: 0
              };
            }
            doctorStats[docId].completedAppointments++;
            doctorStats[docId].totalRevenue += appointment.amount;
          });
        
          let bestDoctor = null;
          let maxScore = -1;
        
          doctors.forEach(doctor => {
            const stats = doctorStats[doctor._id] || { completedAppointments: 0, totalRevenue: 0 };
            const score = stats.completedAppointments * 0.7 + (stats.totalRevenue / 1000) * 0.3;
            if (score > maxScore) {
              maxScore = score;
              bestDoctor = {
                ...doctor.toObject(),
                stats: stats
              };
            }
          });
        
          return bestDoctor;
        };

        const getDashboardData = async (req, res) => {
            try {
                const appointments = await appointmentModel.find({}).count()
                const patients = await userModel.find({}).count()
                const doctors = await doctorModel.find({}).count()
                const latestAppointments = await appointmentModel.find({}).sort({ date: -1 })
                const bestDoctor = await getBestDoctor();
        
                res.json({ success: true, appointments, patients, doctors, latestAppointments, bestDoctor })
        
            } catch (error) {
                console.log(error)
                res.json({ success: false, message: error.message })
            }
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to download all appointments as CSV
const downloadAppointmentsCSV = async (req, res) => {
    try {
        // Fetch all appointments from database
        const appointments = await appointmentModel.find({})
        
        // Generate CSV content using the utility function
        const csvContent = generateAppointmentsCSV(appointments)
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv')
        
        // Send CSV content as response
        res.send(csvContent)
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to remove doctor and related appointments
const removeDoctor = async (req, res) => {
    try {
        const { doctorId } = req.body

        // Remove all appointments related to this doctor
        await appointmentModel.deleteMany({ docId: doctorId })

        // Remove the doctor
        await doctorModel.findByIdAndDelete(doctorId)

        res.json({ success: true, message: 'Doctor and related appointments removed successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    downloadAppointmentsCSV,
    removeDoctor
}