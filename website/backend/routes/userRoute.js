import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, paymentStripe, verifyStripe, createDonation, verifyDonation, changePassword, updateSkills, updateSocialLinks, getDoctorQueue, getAppointmentById, paymentZoho, verifyZoho, searchUsers, getNotificationSettings, updateNotificationSettings, streamNotificationSettings, verify2FALogin } from '../controllers/userController.js';
import { toggleBookmarkMedicine, getBookmarkedMedicines } from '../controllers/bookmarkController.js';
import { getUserNotifications, getArchivedNotifications, markAsRead, archiveNotification, deleteNotification } from '../controllers/userNotificationController.js';
import { getAuthUrl, handleCallback, getConnectionStatus, getFitnessData, getGoogleLoginAuthUrl, getGoogleConnectAuthUrl } from '../controllers/googleFitController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import verifyCustomCaptcha from '../middleware/customCaptchaMiddleware.js';
import { authRateLimiter, csrfProtection } from '../security/security.js';
import { checkBookingRestriction } from '../middleware/bookingRestriction.js';
const userRouter = express.Router();

// Stricter rate limits on auth endpoints; enable CSRF on registration
userRouter.post("/register", authRateLimiter, csrfProtection, verifyCustomCaptcha, registerUser)
userRouter.post("/login", authRateLimiter, verifyCustomCaptcha, loginUser)
userRouter.post("/verify-2fa-login", authRateLimiter, verify2FALogin)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/change-password", authUser, changePassword)
userRouter.post("/update-skills", authUser, updateSkills)
userRouter.post("/update-social-links", authUser, updateSocialLinks)
// Notification settings
userRouter.get("/notification-settings", authUser, getNotificationSettings)
userRouter.post("/notification-settings", authUser, updateNotificationSettings)
// SSE stream: no auth middleware since EventSource can't send custom headers; we validate token query inside controller
userRouter.get("/notification-settings/stream", streamNotificationSettings)
userRouter.post("/book-appointment", authUser, checkBookingRestriction, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.get("/appointment/:id", getAppointmentById)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.get("/doctor-queue/:doctorId", getDoctorQueue)
userRouter.post("/payment-razorpay", authUser, paymentRazorpay)
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)
// Zoho Payments routes
userRouter.post("/payment-zoho", authUser, paymentZoho)
userRouter.post("/verifyZoho", authUser, verifyZoho)

// Donation routes
userRouter.post("/create-donation", createDonation)
userRouter.post("/verify-donation", verifyDonation)

// Google OAuth Login Routes
userRouter.get("/google-login/auth-url", getGoogleLoginAuthUrl)
userRouter.get("/google-connect/auth-url", authUser, getGoogleConnectAuthUrl)

// Google Fit Routes
userRouter.get("/google-fit/auth-url", authUser, getAuthUrl)
userRouter.get("/google-fit/callback", handleCallback)
userRouter.get("/google-fit/status", authUser, getConnectionStatus)
userRouter.get("/google-fit/data", authUser, getFitnessData)

// User search (protected)
userRouter.get("/search", authUser, searchUsers)

// Bookmark medicine routes
userRouter.post("/bookmark-medicine", authUser, toggleBookmarkMedicine)
userRouter.get("/bookmarked-medicines", authUser, getBookmarkedMedicines)

// User Notification routes
userRouter.get("/notifications", authUser, getUserNotifications);
userRouter.get("/notifications/archive", authUser, getArchivedNotifications);
userRouter.put("/notifications/:notificationId/read", authUser, markAsRead);
userRouter.put("/notifications/:notificationId/archive", authUser, archiveNotification);
userRouter.delete("/notifications/:notificationId", authUser, deleteNotification);

export default userRouter;