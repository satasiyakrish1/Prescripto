import express from 'express';
import { saveAppointmentToDrive, downloadAppointmentPDF } from '../controllers/appointmentPDFController.js';
import authUser from '../middleware/authUser.js';

const appointmentPDFRouter = express.Router();

// Save appointment details to Google Drive
appointmentPDFRouter.post('/save-to-drive', authUser, saveAppointmentToDrive);

// Download appointment PDF
appointmentPDFRouter.get('/download/:appointmentId', authUser, downloadAppointmentPDF);

export default appointmentPDFRouter;
