import mongoose from 'mongoose';
import dotenv from 'dotenv';
import appointmentModel from '../models/appointmentModel.js';
import autoUploadPDFToDrive from '../utils/autoUploadToDrive.js';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Test appointment PDF generation and upload
async function testAppointmentPDFUpload() {
    try {
        console.log('🚀 Starting Appointment PDF Upload Test...\n');

        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get a sample appointment
        console.log('🔍 Fetching sample appointment...');
        const appointment = await appointmentModel.findOne().limit(1);

        if (!appointment) {
            console.log('❌ No appointments found in database');
            console.log('💡 Please create an appointment first');
            process.exit(1);
        }

        console.log('✅ Found appointment:', appointment._id);
        console.log('   Patient:', appointment.userData.name);
        console.log('   Doctor:', appointment.docData.name);
        console.log('   Date:', appointment.slotDate);
        console.log('   Time:', appointment.slotTime);
        console.log('');

        // Generate PDF
        console.log('📄 Generating PDF...');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('Prescripto', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.text('Appointment Details', pageWidth / 2, 30, { align: 'center' });

        // Content
        let yPos = 50;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Patient: ${appointment.userData.name}`, 20, yPos);
        yPos += 10;
        doc.text(`Doctor: ${appointment.docData.name}`, 20, yPos);
        yPos += 10;
        doc.text(`Date: ${appointment.slotDate}`, 20, yPos);
        yPos += 10;
        doc.text(`Time: ${appointment.slotTime}`, 20, yPos);
        yPos += 10;
        doc.text(`Amount: ${appointment.amount} ${process.env.CURRENCY || 'INR'}`, 20, yPos);

        // Save PDF temporarily
        const uploadsDir = path.join(__dirname, 'uploads', 'pdf-files');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const fileName = `test-appointment-${timestamp}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        doc.save(filePath);
        console.log('✅ PDF generated:', fileName);
        console.log('   Location:', filePath);
        console.log('');

        // Check if service account exists
        const serviceAccountPath = path.join(__dirname, 'service-account.json');
        if (!fs.existsSync(serviceAccountPath)) {
            console.log('❌ service-account.json not found!');
            console.log('💡 Please add your Google service account credentials');
            console.log('   Expected location:', serviceAccountPath);

            // Clean up
            fs.unlinkSync(filePath);
            process.exit(1);
        }

        // Upload to Google Drive
        console.log('☁️  Uploading to Google Drive...');
        const driveFileName = `appointment_${appointment.userData.name}_${appointment.slotDate}_${timestamp}.pdf`;

        const result = await autoUploadPDFToDrive(filePath, driveFileName, true);

        console.log('✅ Successfully uploaded to Google Drive!');
        console.log('   File ID:', result.googleDrive.fileId);
        console.log('   File URL:', result.googleDrive.fileUrl);
        console.log('   File Name:', result.googleDrive.fileName);
        console.log('');

        console.log('🎉 Test completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log('   ✓ MongoDB connection');
        console.log('   ✓ Appointment retrieval');
        console.log('   ✓ PDF generation');
        console.log('   ✓ Google Drive upload');
        console.log('   ✓ Local file cleanup');
        console.log('');
        console.log('🔗 View your file at:', result.googleDrive.fileUrl);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('');
        console.error('Error details:', error);

        if (error.message.includes('service account')) {
            console.log('');
            console.log('💡 Troubleshooting:');
            console.log('   1. Make sure service-account.json exists in backend/');
            console.log('   2. Verify the JSON format is correct');
            console.log('   3. Check that Google Drive API is enabled');
            console.log('   4. Ensure the service account has proper permissions');
        }
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('');
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the test
testAppointmentPDFUpload();
