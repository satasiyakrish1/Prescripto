import './fix-buffer.js';
import './config/envLoader.js';
import express from "express"
import cors from 'cors'
import helmet from 'helmet'
import { applySecurity, csrfProtection, csrfErrorHandler } from './security/security.js'
// import 'dotenv/config' - Replaced by envLoader
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import pharmacyRouter from "./routes/pharmacyRoute.js"
import apiPackageRoute from './routes/apiPackageRoute.js';
import medicineRouter from './routes/medicineRoute.js';
import inventoryRouter from './routes/inventoryRoute.js';
import communityRouter from './routes/communityRoute.js';
import statisticsRouter from './routes/statisticsRoute.js';
import donationRouter from './routes/donationRoute.js';
import wardRouter from './routes/wardRoute.js';
import blogRouter from './routes/blogRoute.js';
import settingsRouter from './routes/settingsRoute.js';
console.log('✅ Blog router imported:', !!blogRouter);
import medicalQuestionnaireRouter from './routes/medicalQuestionnaireRoute.js';
import perioperativeChecklistRouter from './routes/perioperativeChecklistRoute.js';
import testimonialRouter from './routes/testimonialRoute.js';
import gpsRouter from './routes/gpsRoute.js';
import subscriberRouter from './routes/subscriberRoute.js';
import loginHistoryRouter from './routes/loginHistoryRoutes.js';
import saleRouter from './routes/saleRoutes.js';
import salesRouter from './routes/salesRoute.js';
import saleHistoryRouter from './routes/saleHistoryRoute.js';
import paymentRouter from './routes/paymentRoutes.js';
import cashPaymentRouter from './routes/cashPaymentRoutes.js';
import bedAllocationRouter from './routes/bedAllocationRoute.js';
import bedCategoryRouter from './routes/bedCategoryRoute.js';
import patientRouter from './routes/patientRoute.js';
import driveRouter from './routes/driveRoute.js';
import captchaRouter from './routes/captchaRoute.js';
import verificationRouter from './routes/verificationRoute.js';
import doctorVerificationRouter from './routes/doctorVerificationRoute.js';
import aiRouter from './routes/aiRoute.js';
import googleTasksRouter from './routes/googleTasksRoute.js';
import authAdmin from './middleware/authAdmin.js';
import { scheduleAppointmentChecks } from './utils/scheduledTasks.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import webhookRouter from './routes/webhooks.js';
import notificationRouter from './routes/notificationRoute.js';
import todoRouter from './routes/todoRoutes.js';
import walletRouter from './routes/walletRoute.js';
import analysisRouter from './routes/analysisRoute.js';
import eventRouter from './routes/eventRoute.js';
import familyRouter from './routes/familyRoute.js';
import vhidRouter from './routes/vhidRoute.js';
import prescriptionRouter from './routes/prescriptionRoutes.js';
import appointmentPDFRouter from './routes/appointmentPDFRoute.js';
import medicalFilesRouter from './routes/medicalFilesRoute.js';
import autoCancelRouter from './routes/autoCancelRoute.js';
import contactRouter from './routes/contactRoute.js';
import feedbackRouter from './routes/feedbackRoute.js';
import appointmentScheduler from './services/appointmentScheduler.js';
import './tests/keepAlive.js'; // 👈 Auto-ping scheduler to prevent backend sleeping
import couponRouter from './routes/couponRoutes.js';
import sessionRouter from './routes/sessionRoutes.js';

// Trigger restart: final check
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base directory setup for local uploads persistence
const baseDir = process.env.USER_DATA_PATH || __dirname;
const uploadsDir = path.join(baseDir, 'uploads');
process.env.UPLOADS_DIR = uploadsDir;

const blogImagesDir = path.join(uploadsDir, 'blog-images');
const eventBannersDir = path.join(uploadsDir, 'event-banners');
const medicalFilesDir = path.join(uploadsDir, 'medical-files');
const doctorImagesDir = path.join(uploadsDir, 'doctor-images');
const profileImagesDir = path.join(uploadsDir, 'profile-images');
const docVerificationDir = path.join(uploadsDir, 'doctor-verification');
const pdfFilesDir = path.join(uploadsDir, 'pdf-files');

[uploadsDir, blogImagesDir, eventBannersDir, medicalFilesDir, doctorImagesDir, profileImagesDir, docVerificationDir, pdfFilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
// Parse raw body for Stripe & Zoho webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/zoho', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe' || req.originalUrl === '/api/webhooks/zoho') {
    next();
  } else {
    express.json()(req, res, next);
  }
})

// Secure default headers early
app.use(helmet({ contentSecurityPolicy: false }))

// Apply global security middleware (rate limit, sanitize, hpp, xss, logs)
applySecurity(app)

// Define allowed origins based on environment
const getAllowedOrigins = () => {
  // Production origins from environment variables
  const productionOrigins = [
    process.env.PRODUCTION_FRONTEND_URL,
    process.env.PRODUCTION_ADMIN_URL,
    process.env.PRODUCTION_RXMEET_URL,
    'https://krishsatasiya-prescriptosystem.onrender.com',
    'https://krishsatasiya-prescripto.onrender.com',
    'https://prescripto.onrender.com',
    'https://prescripto.live'
  ].filter(Boolean);

  // Development origins
  const developmentOrigins = [
    'http://localhost:5173',  // Frontend Vite default
    'http://localhost:5174',  // Admin Vite default
    'http://localhost:3000',  // Next.js default (RxMeet)
    'http://localhost:4173',  // Vite preview
    'http://localhost:3001'   // Local proxy
  ];

  return process.env.NODE_ENV === 'production' ? productionOrigins : developmentOrigins;
};

// Configure CORS with dynamic origin handling
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.includes('localhost') || origin.includes('192.168.')) {
      // Allow dynamic Vercel deployments and local development networks bypass
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS policy`);
      // Warning instead of outright rejecting, or we just allow it for now to avoid breaking deployments:
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'Accept', 'aToken', 'dToken', 'pToken', 'vToken', 'atoken', 'ptoken', 'vtoken'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}))

// CSRF token endpoint for clients; token is returned and cookie is set
app.get('/csrf-token', csrfProtection, (req, res) => {
  return res.json({ csrfToken: req.csrfToken() })
})

// Log CORS configuration and environment details
if (process.env.NODE_ENV !== 'production') {
  console.log('CORS configured for development with origins:', ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:4173'])
} else {
  console.log('CORS configured for production with origins:', [process.env.PRODUCTION_FRONTEND_URL, process.env.PRODUCTION_ADMIN_URL, process.env.PRODUCTION_RXMEET_URL].filter(Boolean))
  console.log('Production URLs:', {
    frontend: process.env.PRODUCTION_FRONTEND_URL,
    admin: process.env.PRODUCTION_ADMIN_URL,
    rxmeet: process.env.PRODUCTION_RXMEET_URL
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve React production assets
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
} else {
  const localDistPath = path.join(__dirname, 'frontend');
  if (fs.existsSync(localDistPath)) {
    app.use(express.static(localDistPath));
  }
}

// Serve Admin production assets with smart fallback to frontend assets for mixed deployments
app.use('/admin', (req, res, next) => {
  const adminFilePath = path.join(__dirname, '../admin/dist', req.path);
  if (fs.existsSync(adminFilePath) && fs.statSync(adminFilePath).isFile()) {
    return res.sendFile(adminFilePath);
  }
  
  const localAdminFilePath = path.join(__dirname, 'admin', req.path);
  if (fs.existsSync(localAdminFilePath) && fs.statSync(localAdminFilePath).isFile()) {
    return res.sendFile(localAdminFilePath);
  }

  const frontendFilePath = path.join(__dirname, '../frontend/dist', req.path);
  if (fs.existsSync(frontendFilePath) && fs.statSync(frontendFilePath).isFile()) {
    return res.sendFile(frontendFilePath);
  }

  next();
});

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/pharmacy", pharmacyRouter)
app.use('/api/packages', apiPackageRoute);
app.use('/api/medicine', medicineRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/community', communityRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/donation', donationRouter);
app.use('/api/ward', wardRouter);
app.use('/api/sell', saleRouter);
app.use('/api/pharmacy/sell', saleRouter);
app.use('/api/pharmacy/sales', salesRouter);
app.use('/api/pharmacy/sales-history', saleHistoryRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/pharmacy/payment', paymentRouter);
// Expose new Zoho Payments create endpoint under /api/payments
app.use('/api/payments', paymentRouter);
app.use('/api/payments', cashPaymentRouter);
app.use('/api/payment', cashPaymentRouter); // Add this line to support both endpoints
console.log('📝 Registering blog router at /api/admin/blog');
app.use('/api/admin/blog', blogRouter);
console.log('✅ Blog router registered successfully');
app.use('/api/medical-questionnaire', medicalQuestionnaireRouter);
app.use('/api/perioperative-checklist', perioperativeChecklistRouter);
app.use('/api/testimonials', testimonialRouter);
app.use('/api/admin/gps', gpsRouter);
app.use('/api', subscriberRouter);
app.use('/api/bed-allocation', bedAllocationRouter);
app.use('/api/bed-categories', bedCategoryRouter);
app.use('/api/patients', patientRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/notifications', notificationRouter);
app.use("/api/admin/todos", todoRouter);
app.use('/api/admin/google-tasks', googleTasksRouter);
app.use('/api/login-history', loginHistoryRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/captcha', captchaRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/doctor-verification', doctorVerificationRouter);
app.use('/api/coupons', couponRouter);
app.use('/api', sessionRouter);
app.use('/api', driveRouter);
app.use('/api/events', eventRouter);
app.use('/api/family', familyRouter);
app.use('/api/vhid', vhidRouter);
app.use('/api/prescription', prescriptionRouter);
app.use('/api/appointment-pdf', appointmentPDFRouter);
app.use('/api/medical-files', medicalFilesRouter);
app.use('/api/auto-cancel', autoCancelRouter);
app.use('/api/contact', contactRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/ai', aiRouter);
import viewerRouter from './routes/viewerRoute.js';
app.use('/api/viewer', viewerRouter);
import accessUserRouter from './routes/accessUserRoute.js';
import accessAuthRouter from './routes/accessAuthRoute.js';
app.use('/api/admin/access-users', accessUserRouter);
app.use('/api/access', accessAuthRouter);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <title>Prescripto API - System Status</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          /* Colors */
          --primary-color: #0A82FD;
          --primary-dark: #0868CC;
          --primary-light: #E6F0FF;
          --secondary-color: #00C6A2;
          --secondary-dark: #00A386;
          --secondary-light: #E6FFF9;
          --background-color: #F8FAFF;
          --text-color: #333;
          --text-muted: #6B7280;
          --card-bg: #ffffff;
          --shadow-color: rgba(10, 130, 253, 0.1);
          --danger-color: #FF5252;
          --warning-color: #FFB800;
          --success-color: #00C48C;
          --gradient-start: #0A82FD;
          --gradient-end: #00C6A2;
          
          /* Font sizes */
          --font-xs: 0.75rem;    /* 12px */
          --font-sm: 0.875rem;   /* 14px */
          --font-base: 1rem;     /* 16px */
          --font-lg: 1.125rem;   /* 18px */
          --font-xl: 1.25rem;    /* 20px */
          --font-2xl: 1.5rem;    /* 24px */
          --font-3xl: 1.875rem;  /* 30px */
          --font-4xl: 2.25rem;   /* 36px */
          
          /* Font weights */
          --font-light: 300;
          --font-normal: 400;
          --font-medium: 500;
          --font-semibold: 600;
          --font-bold: 700;
          
          /* Spacing */
          --space-1: 0.25rem;   /* 4px */
          --space-2: 0.5rem;    /* 8px */
          --space-3: 0.75rem;   /* 12px */
          --space-4: 1rem;      /* 16px */
          --space-6: 1.5rem;    /* 24px */
          --space-8: 2rem;      /* 32px */
          --space-12: 3rem;     /* 48px */
          --space-16: 4rem;     /* 64px */
          
          /* Border radius */
          --radius-sm: 0.25rem;  /* 4px */
          --radius-md: 0.5rem;   /* 8px */
          --radius-lg: 1rem;     /* 16px */
          --radius-xl: 1.5rem;   /* 24px */
          --radius-full: 100px;
          
          /* Transitions */
          --transition-fast: 150ms ease;
          --transition-normal: 300ms ease;
          --transition-slow: 500ms ease;
          
          /* Shadows */
          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.05);
          
          /* Z-index layers */
          --z-base: 1;
          --z-above: 10;
          --z-modal: 100;
          --z-tooltip: 1000;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: var(--background-color);
          font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: var(--text-color);
          padding: var(--space-4);
          line-height: 1.5;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
          width: 100%;
          max-width: 1200px;
          padding: var(--space-4);
          margin: 0 auto;
        }
        
        .main-card {
          background: var(--card-bg);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          box-shadow: 0 8px 30px var(--shadow-color);
          text-align: center;
          margin-bottom: var(--space-8);
          position: relative;
          overflow: hidden;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        
        .main-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px var(--shadow-color);
        }
        
        .main-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
        }
        
        .logo-container {
          position: relative;
          display: inline-block;
          margin-bottom: var(--space-6);
        }
        
        .logo {
          width: 200px;
          height: auto;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
          transition: transform var(--transition-normal);
        }
        
        .logo-container:hover .logo {
          transform: scale(1.05);
        }
        
        .pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 210px;
          height: 210px;
          border-radius: 50%;
          background: rgba(10, 130, 253, 0.05);
          z-index: -1;
          animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.8;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
        }
        
        .status-container {
          margin-bottom: var(--space-6);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
          color: white;
          padding: var(--space-2) var(--space-6);
          border-radius: var(--radius-full);
          font-weight: var(--font-semibold);
          box-shadow: 0 4px 15px rgba(10, 130, 253, 0.2);
          transition: transform var(--transition-fast);
        }
        
        .status-badge:hover {
          transform: translateY(-2px);
        }
        
        .status-badge .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          background-color: var(--success-color);
          border-radius: 50%;
          margin-right: var(--space-2);
          position: relative;
        }
        
        .status-badge .dot::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          width: 14px;
          height: 14px;
          background-color: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .header {
          margin-bottom: var(--space-6);
        }
        
        .header h1 {
          color: var(--text-color);
          font-size: var(--font-4xl);
          margin-bottom: var(--space-2);
          font-weight: var(--font-bold);
          letter-spacing: -0.025em;
        }
        
        .header h1 span {
          color: var(--primary-color);
          position: relative;
        }
        
        .header h1 span::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
          border-radius: var(--radius-full);
        }
        
        .header p {
          color: var(--text-muted);
          font-size: var(--font-lg);
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .system-stats {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          margin: var(--space-8) 0;
          flex-wrap: wrap;
        }
        
        .stat-card {
          background: var(--primary-light);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          min-width: 180px;
          text-align: center;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(to bottom, var(--gradient-start), var(--gradient-end));
          opacity: 0.7;
        }
        
        .stat-card h3 {
          color: var(--primary-color);
          font-size: var(--font-xl);
          font-weight: var(--font-bold);
          margin-bottom: var(--space-1);
        }
        
        .stat-card p {
          color: var(--text-muted);
          font-size: var(--font-sm);
          font-weight: var(--font-medium);
        }
        
        .endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-8);
        }
        
        .endpoint-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: all var(--transition-normal);
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        
        .endpoint-card:hover {
          transform: translateY(-3px);
          border-color: var(--primary-light);
          box-shadow: 0 8px 25px rgba(10, 130, 253, 0.15);
        }
        
        .endpoint-icon {
          background: var(--primary-light);
          width: 50px;
          height: 50px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-4);
        }
        
        .endpoint-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary-color);
        }
        
        .endpoint-card h3 {
          color: var(--primary-color);
          margin-bottom: var(--space-2);
          font-weight: var(--font-semibold);
          font-size: var(--font-xl);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .endpoint-card p {
          font-size: var(--font-base);
          margin-bottom: var(--space-4);
          color: var(--text-muted);
          line-height: 1.6;
        }
        
        .endpoint-card .endpoint-status {
          margin-top: auto;
          display: flex;
          align-items: center;
          font-size: var(--font-sm);
          color: var(--success-color);
          font-weight: var(--font-medium);
        }
        
        .endpoint-card .endpoint-status::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: var(--success-color);
          border-radius: 50%;
          margin-right: var(--space-2);
        }
        
        .api-version {
          display: inline-block;
          background-color: var(--primary-light);
          color: var(--primary-color);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--font-xs);
          font-weight: var(--font-medium);
          vertical-align: middle;
          margin-left: var(--space-2);
        }
        
        .footer {
          margin-top: var(--space-8);
          text-align: center;
          color: var(--text-muted);
          font-size: var(--font-sm);
          padding: var(--space-4) 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          border-top: 1px solid rgba(107, 114, 128, 0.1);
          padding-top: var(--space-6);
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          margin-bottom: var(--space-2);
        }
        
        .footer-links a {
          color: var(--primary-color);
          text-decoration: none;
          transition: color var(--transition-fast);
          font-weight: var(--font-medium);
        }
        
        .footer-links a:hover {
          color: var(--primary-dark);
          text-decoration: underline;
        }
        
        /* Server Status Section */
        .server-status {
          margin-top: var(--space-8);
          background: var(--card-bg);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        
        .server-status h2 {
          font-size: var(--font-2xl);
          margin-bottom: var(--space-4);
          text-align: center;
          color: var(--text-color);
          position: relative;
          display: inline-block;
          padding-bottom: var(--space-2);
        }
        
        .server-status h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
          border-radius: var(--radius-full);
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        
        .status-item {
          display: flex;
          align-items: center;
          padding: var(--space-3);
          background: var(--primary-light);
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast);
        }
        
        .status-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .status-item.database {
          background: var(--secondary-light);
        }
        
        .status-item.cache {
          background: rgba(255, 184, 0, 0.1);
        }
        
        .status-item.storage {
          background: rgba(255, 82, 82, 0.1);
        }
        
        .status-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--space-3);
        }
        
        .status-text {
          flex: 1;
        }
        
        .status-text h4 {
          margin: 0;
          font-size: var(--font-base);
          color: var(--text-color);
        }
        
        .status-text p {
          margin: 0;
          font-size: var(--font-sm);
          color: var(--text-muted);
        }
        
        .status-indicator {
          width: 50px;
          text-align: right;
        }
        
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--success-color);
        }
        
        .blink {
          animation: blink 2s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        /* API Features Section */
        .features-section {
          margin-top: var(--space-8);
          text-align: center;
        }
        
        .features-section h2 {
          font-size: var(--font-2xl);
          margin-bottom: var(--space-6);
          color: var(--text-color);
          position: relative;
          display: inline-block;
          padding-bottom: var(--space-2);
        }
        
        .features-section h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
          border-radius: var(--radius-full);
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          margin-top: var(--space-6);
        }
        
        .feature-card {
          background: var(--card-bg);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
          text-align: left;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
          opacity: 0.7;
        }
        
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-4);
        }
        
        .feature-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary-color);
        }
        
        .feature-card h3 {
          font-size: var(--font-xl);
          color: var(--text-color);
          margin-bottom: var(--space-2);
          font-weight: var(--font-semibold);
        }
        
        .feature-card p {
          color: var(--text-muted);
          font-size: var(--font-base);
          line-height: 1.6;
        }
        
        /* Version Info Section */
        .version-info {
          margin-top: var(--space-8);
          background: var(--primary-light);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          text-align: center;
        }
        
        .version-info h2 {
          font-size: var(--font-xl);
          color: var(--primary-color);
          margin-bottom: var(--space-4);
          font-weight: var(--font-semibold);
        }
        
        .version-details {
          display: flex;
          justify-content: center;
          gap: var(--space-8);
          flex-wrap: wrap;
        }
        
        .version-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .version-item h4 {
          font-size: var(--font-base);
          color: var(--text-color);
          margin-bottom: var(--space-1);
        }
        
        .version-item p {
          font-size: var(--font-lg);
          color: var(--primary-color);
          font-weight: var(--font-semibold);
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .main-card {
            padding: var(--space-4);
          }
          
          .header h1 {
            font-size: var(--font-3xl);
          }
          
          .header p {
            font-size: var(--font-base);
          }
          
          .logo {
            width: 150px;
          }
          
          .pulse {
            width: 160px;
            height: 160px;
          }
          
          .system-stats {
            flex-direction: column;
            align-items: center;
          }
          
          .stat-card {
            width: 100%;
            max-width: 300px;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .version-details {
            flex-direction: column;
            gap: var(--space-4);
          }
        }
      </style>
    </head>
    <body>
            <div class="container">
        <div class="main-card">
          <div class="logo-container">
            <div class="pulse"></div>
            <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto Logo" class="logo">
          </div>
          
          <div class="status-container">
            <div class="status-badge">
              <span class="dot"></span>
              System Online
            </div>
          </div>
          
          <div class="header">
            <h1>Prescripto <span>API</span></h1>
            <p>Welcome to the Prescripto API server. This is the backend service that powers the Prescripto healthcare system, enabling secure medical appointment booking, prescription management, and healthcare provider coordination.</p>
          </div>
          
          <div class="system-stats">
            <div class="stat-card">
              <h3>99.9%</h3>
              <p>Uptime</p>
            </div>
            <div class="stat-card">
              <h3>45ms</h3>
              <p>Response Time</p>
            </div>
            <div class="stat-card">
              <h3>24/7</h3>
              <p>Monitoring</p>
            </div>
            <div class="stat-card">
              <h3>${new Date().toLocaleDateString()}</h3>
              <p>Last Updated</p>
            </div>
          </div>
        </div>
        
        <div class="server-status">
          <h2>System Status</h2>
          <div class="status-grid">
            <div class="status-item">
              <div class="status-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div class="status-text">
                <h4>API Server</h4>
                <p>Running smoothly</p>
              </div>
              <div class="status-indicator">
                <span class="status-dot blink"></span>
              </div>
            </div>
            
            <div class="status-item database">
              <div class="status-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              </div>
              <div class="status-text">
                <h4>Database</h4>
                <p>Connected</p>
              </div>
              <div class="status-indicator">
                <span class="status-dot"></span>
              </div>
            </div>
            
            <div class="status-item cache">
              <div class="status-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div class="status-text">
                <h4>File Storage</h4>
                <p>Operational</p>
              </div>
              <div class="status-indicator">
                <span class="status-dot"></span>
              </div>
            </div>
            
            <div class="status-item storage">
              <div class="status-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                  <path d="M12 12v9"></path>
                  <path d="m8 17 4 4 4-4"></path>
                </svg>
              </div>
              <div class="status-text">
                <h4>Cloudinary</h4>
                <p>Connected</p>
              </div>
              <div class="status-indicator">
                <span class="status-dot"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="endpoints">
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3>User API <span class="api-version">v5.5</span></h3>
            <p>Authentication, profile management, and appointment booking for patients.</p>
            <div class="endpoint-status">Operational</div>
          </div>
          
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Doctor API <span class="api-version">v5.5</span></h3>
            <p>Doctor authentication, appointment management, and availability settings.</p>
            <div class="endpoint-status">Operational</div>
          </div>
          
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3>Admin API <span class="api-version">v5.5</span></h3>
            <p>System administration, staff management, and analytics dashboard.</p>
            <div class="endpoint-status">Operational</div>
          </div>
          
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3>Medicines API <span class="api-version">v5.5</span></h3>
            <p>Medicine catalog, prescription management, and dosage information.</p>
            <div class="endpoint-status">Operational</div>
          </div>
          
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3>Community API <span class="api-version">v5.5</span></h3>
            <p>Community forums, health tips, and patient support networks.</p>
            <div class="endpoint-status">Operational</div>
          </div>
          
          <div class="endpoint-card">
            <div class="endpoint-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3>Statistics API <span class="api-version">v5.5</span></h3>
            <p>Healthcare analytics, patient demographics, and treatment outcomes.</p>
            <div class="endpoint-status">Operational</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-links">
            <a href="/docs">API Documentation</a>
            <a href="/status">System Status</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p>© ${new Date().getFullYear()} Prescripto Healthcare System. All rights reserved.</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'} | Server Time: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `)
})


// Health check endpoint with detailed information
app.get("/health", (req, res) => {
  res.json({
    status: "up",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origins: process.env.NODE_ENV === 'production'
        ? [process.env.PRODUCTION_FRONTEND_URL, process.env.PRODUCTION_ADMIN_URL, process.env.PRODUCTION_RXMEET_URL, 'https://krishsatasiya-prescriptosystem.onrender.com'].filter(Boolean)
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:4173']
    }
  });
});

// Lightweight ping endpoint for keepAlive functionality
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Wildcard fallback routing to the main index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  if (req.path.startsWith('/admin')) {
    const adminIndex = path.join(__dirname, '../admin/dist/index.html');
    if (fs.existsSync(adminIndex)) {
      return res.sendFile(adminIndex);
    }
    const localAdminIndex = path.join(__dirname, 'admin/index.html');
    if (fs.existsSync(localAdminIndex)) {
      return res.sendFile(localAdminIndex);
    }
    const fallbackAdminIndex = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(fallbackAdminIndex)) {
      return res.sendFile(fallbackAdminIndex);
    }
  }
  const distIndex = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  const localIndex = path.join(__dirname, 'frontend/index.html');
  if (fs.existsSync(localIndex)) {
    return res.sendFile(localIndex);
  }
  res.send('Prescripto Frontend Assets not built. Please run npm run build.');
});

// CSRF error handler (after routes that use csrfProtection)
app.use(csrfErrorHandler)

function startServer(startPort, maxAttempts = 5) {
  let attempts = 0;
  const tryListen = (p) => {
    const server = app.listen(p, () => {
      console.log(`Server started on PORT:${p}`);
      // Initialize appointment auto-cancellation scheduler
      scheduleAppointmentChecks();
      // Initialize auto-cancellation scheduler for no-show appointments
      appointmentScheduler.start();
      console.log('Auto-cancellation scheduler initialized');
    });
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempts < maxAttempts) {
        attempts += 1;
        const nextPort = Number(p) + 1;
        console.warn(`Port ${p} in use, retrying on ${nextPort} (attempt ${attempts}/${maxAttempts})`);
        setTimeout(() => tryListen(nextPort), 300);
      } else {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    });
  };
  tryListen(startPort);
}

startServer(port);
