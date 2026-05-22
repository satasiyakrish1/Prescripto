import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appointmentModel from '../models/appointmentModel.js';
import autoUploadPDFToDrive from '../utils/autoUploadToDrive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate appointment details PDF
 */
const generateAppointmentPDF = (appointmentData) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Prescripto', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Appointment Details', pageWidth / 2, 30, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);
    
    let yPos = 50;
    
    // Patient Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Patient Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${appointmentData.userData.name}`, 25, yPos);
    yPos += 8;
    
    if (appointmentData.userData.email) {
        doc.text(`Email: ${appointmentData.userData.email}`, 25, yPos);
        yPos += 8;
    }
    
    if (appointmentData.userData.phone) {
        doc.text(`Phone: ${appointmentData.userData.phone}`, 25, yPos);
        yPos += 8;
    }
    
    yPos += 5;
    
    // Doctor Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Doctor Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Doctor: ${appointmentData.docData.name}`, 25, yPos);
    yPos += 8;
    
    if (appointmentData.docData.speciality) {
        doc.text(`Speciality: ${appointmentData.docData.speciality}`, 25, yPos);
        yPos += 8;
    }
    
    if (appointmentData.docData.email) {
        doc.text(`Email: ${appointmentData.docData.email}`, 25, yPos);
        yPos += 8;
    }
    
    yPos += 5;
    
    // Appointment Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Appointment Details', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${appointmentData.slotDate}`, 25, yPos);
    yPos += 8;
    
    doc.text(`Time: ${appointmentData.slotTime}`, 25, yPos);
    yPos += 8;
    
    doc.text(`Booking Mode: ${appointmentData.bookingMode || 'Regular'}`, 25, yPos);
    yPos += 8;
    
    if (appointmentData.isEmergency) {
        doc.setTextColor(255, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('EMERGENCY APPOINTMENT', 25, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        yPos += 8;
    }
    
    doc.text(`Amount: ${appointmentData.amount} ${process.env.CURRENCY || 'INR'}`, 25, yPos);
    yPos += 8;
    
    doc.text(`Payment Status: ${appointmentData.payment ? 'Paid' : 'Pending'}`, 25, yPos);
    yPos += 8;
    
    doc.text(`Status: ${appointmentData.cancelled ? 'Cancelled' : appointmentData.isCompleted ? 'Completed' : 'Scheduled'}`, 25, yPos);
    yPos += 15;
    
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('Prescripto is dedicated to advancing healthcare technology', pageWidth / 2, 270, { align: 'center' });
        doc.text('with a commitment to quality and innovation.', pageWidth / 2, 277, { align: 'center' });
        
        return doc;
    } catch (error) {
        console.error('[generateAppointmentPDF] Error generating PDF:', error);
        console.error('[generateAppointmentPDF] Appointment data:', JSON.stringify(appointmentData, null, 2));
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};

/**
 * Save appointment details as PDF and auto-upload to Google Drive
 */
export const saveAppointmentToDrive = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        console.log(`[AppointmentPDF] Request received for appointmentId:`, appointmentId);
        
        if (!appointmentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Appointment ID is required' 
            });
        }
        
        // Get appointment details
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            console.log(`[AppointmentPDF] Appointment not found:`, appointmentId);
            return res.status(404).json({ 
                success: false, 
                message: 'Appointment not found' 
            });
        }
        
        console.log(`[AppointmentPDF] Found appointment:`, {
            id: appointment._id,
            hasUserData: !!appointment.userData,
            hasDocData: !!appointment.docData,
            userName: appointment.userData?.name,
            docName: appointment.docData?.name
        });
        
        // Generate PDF
        console.log(`[AppointmentPDF] Starting PDF generation...`);
        const pdfDoc = generateAppointmentPDF(appointment);
        console.log(`[AppointmentPDF] PDF generation completed`);
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../uploads/pdf-files');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000000);
        const fileName = `pdfFile-${timestamp}-${randomNum}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Save PDF temporarily (Node.js way)
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`[AppointmentPDF] PDF generated: ${filePath}`);
        
        // Auto-upload to Google Drive and delete local file
        try {
            const driveFileName = `appointment_${appointment.userData.name}_${appointment.slotDate}_${timestamp}.pdf`;
            const uploadResult = await autoUploadPDFToDrive(filePath, driveFileName, true);
            
            console.log(`[AppointmentPDF] Successfully uploaded to Google Drive`);
            
            return res.json({
                success: true,
                message: 'Appointment details saved to Google Drive successfully',
                googleDrive: uploadResult.googleDrive
            });
            
        } catch (uploadError) {
            console.error(`[AppointmentPDF] Google Drive upload failed:`, uploadError);
            
            // If upload fails, keep the local file and return its path
            return res.json({
                success: false,
                message: 'Failed to upload to Google Drive. Please check your service account configuration.',
                error: uploadError.message,
                localFile: filePath
            });
        }
        
    } catch (error) {
        console.error('[AppointmentPDF] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating appointment PDF',
            error: error.message
        });
    }
};

/**
 * Download appointment details as PDF (without uploading to Drive)
 */
export const downloadAppointmentPDF = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        if (!appointmentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Appointment ID is required' 
            });
        }
        
        // Get appointment details
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Appointment not found' 
            });
        }
        
        // Generate PDF
        const pdfDoc = generateAppointmentPDF(appointment);
        
        // Send PDF as download
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
        const fileName = `appointment_${appointment.userData.name}_${appointment.slotDate}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('[AppointmentPDF] Download error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error downloading appointment PDF',
            error: error.message
        });
    }
};

export default {
    saveAppointmentToDrive,
    downloadAppointmentPDF
};
