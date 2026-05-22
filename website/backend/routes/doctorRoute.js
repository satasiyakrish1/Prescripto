import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile, getDoctorTodos, createDoctorTodo, updateDoctorTodo, deleteDoctorTodo, getBookingSettings, updateBookingSettings, getDoctorBookingMode, getDoctorAnalytics } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import { authRateLimiter } from '../security/security.js';
const doctorRouter = express.Router();

// Throttle doctor login attempts
doctorRouter.post("/login", authRateLimiter, loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

// Todo routes
doctorRouter.get("/todos", authDoctor, getDoctorTodos);
doctorRouter.post("/todos", authDoctor, createDoctorTodo);
doctorRouter.put("/todos/:id", authDoctor, updateDoctorTodo);
doctorRouter.delete("/todos/:id", authDoctor, deleteDoctorTodo);

// Booking settings routes
doctorRouter.get("/booking-settings", authDoctor, getBookingSettings);
doctorRouter.post("/booking-settings", authDoctor, updateBookingSettings);
doctorRouter.get("/booking-mode/:doctorId", getDoctorBookingMode);

// Analytics routes
doctorRouter.get("/analytics", authDoctor, getDoctorAnalytics);

export default doctorRouter;