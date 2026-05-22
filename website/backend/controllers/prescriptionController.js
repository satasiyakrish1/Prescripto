import prescriptionModel from "../models/prescriptionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import { uploadFileToDrive, deleteFileFromDrive, listPrescriptionFiles } from "../config/googleDrive.js";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate PDF prescription
const generatePrescriptionPDF = async (prescriptionData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Medical Prescription', pageWidth / 2, 20, { align: 'center' });
    
    // Doctor and Patient Info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Doctor: ${prescriptionData.doctorName}`, 20, 40);
    doc.text(`Patient: ${prescriptionData.patientName}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    
    // Diagnosis
    doc.setFont(undefined, 'bold');
    doc.text('Diagnosis:', 20, 75);
    doc.setFont(undefined, 'normal');
    doc.text(prescriptionData.diagnosis, 20, 85);
    
    // Medications
    doc.setFont(undefined, 'bold');
    doc.text('Medications:', 20, 100);
    doc.setFont(undefined, 'normal');
    
    let yPosition = 110;
    prescriptionData.medications.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.name}`, 25, yPosition);
        yPosition += 7;
        doc.text(`   Dosage: ${med.dosage}`, 25, yPosition);
        yPosition += 7;
        doc.text(`   Frequency: ${med.frequency}`, 25, yPosition);
        yPosition += 7;
        doc.text(`   Duration: ${med.duration}`, 25, yPosition);
        if (med.instructions) {
            yPosition += 7;
            doc.text(`   Instructions: ${med.instructions}`, 25, yPosition);
        }
        yPosition += 10;
        
        // Add new page if needed
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
    });
    
    // Notes
    if (prescriptionData.notes) {
        doc.setFont(undefined, 'bold');
        doc.text('Additional Notes:', 20, yPosition);
        yPosition += 10;
        doc.setFont(undefined, 'normal');
        doc.text(prescriptionData.notes, 20, yPosition, { maxWidth: 170 });
    }
    
    // Follow-up date
    if (prescriptionData.followUpDate) {
        yPosition += 20;
        doc.setFont(undefined, 'bold');
        doc.text(`Follow-up Date: ${new Date(prescriptionData.followUpDate).toLocaleDateString()}`, 20, yPosition);
    }
    
    return doc;
};

// Create prescription and save to Google Drive
const createPrescription = async (req, res) => {
    try {
        const { 
            appointmentId, 
            diagnosis, 
            medications, 
            notes, 
            followUpDate,
            accessToken 
        } = req.body;

        // Verify appointment exists
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Get doctor details
        const doctor = await doctorModel.findById(appointment.docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Create prescription data
        const prescriptionData = {
            appointmentId,
            doctorId: appointment.docId,
            patientId: appointment.userId,
            patientName: appointment.userData.name,
            doctorName: doctor.name,
            diagnosis,
            medications,
            notes,
            followUpDate
        };

        // Generate PDF
        const pdfDoc = await generatePrescriptionPDF(prescriptionData);
        
        // Save PDF locally first
        const uploadsDir = path.join(__dirname, '../uploads/prescriptions');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `prescription_${appointmentId}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        
        pdfDoc.save(filePath);

        // Save prescription to database
        const prescription = new prescriptionModel({
            ...prescriptionData,
            localFile: {
                filename: fileName,
                path: filePath,
                mimetype: 'application/pdf'
            }
        });

        await prescription.save();

        // Upload to Google Drive if access token provided
        let driveUploadResult = null;
        if (accessToken) {
            try {
                driveUploadResult = await uploadFileToDrive(
                    accessToken,
                    filePath,
                    fileName,
                    'application/pdf'
                );

                // Update prescription with Google Drive info
                prescription.googleDrive = {
                    fileId: driveUploadResult.fileId,
                    fileUrl: driveUploadResult.fileUrl,
                    folderId: driveUploadResult.folderId,
                    uploadedAt: new Date(),
                    uploadedBy: appointment.docId
                };

                await prescription.save();
            } catch (driveError) {
                console.error('Google Drive upload failed:', driveError);
                // Continue even if Drive upload fails
            }
        }

        res.json({
            success: true,
            message: "Prescription created successfully",
            prescription: {
                id: prescription._id,
                localFile: prescription.localFile,
                googleDrive: prescription.googleDrive
            }
        });

    } catch (error) {
        console.error('Error creating prescription:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get prescription by ID
const getPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        
        const prescription = await prescriptionModel.findById(prescriptionId);
        
        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        res.json({ success: true, prescription });
    } catch (error) {
        console.error('Error getting prescription:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const prescriptions = await prescriptionModel.find({ patientId })
            .sort({ createdAt: -1 });

        res.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Error getting patient prescriptions:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions for a doctor
const getDoctorPrescriptions = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        const prescriptions = await prescriptionModel.find({ doctorId })
            .sort({ createdAt: -1 });

        res.json({ success: true, prescriptions });
    } catch (error) {
        console.error('Error getting doctor prescriptions:', error);
        res.json({ success: false, message: error.message });
    }
};

// Upload existing prescription to Google Drive
const uploadToGoogleDrive = async (req, res) => {
    try {
        const { prescriptionId, accessToken } = req.body;

        const prescription = await prescriptionModel.findById(prescriptionId);
        
        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        if (!prescription.localFile || !prescription.localFile.path) {
            return res.json({ success: false, message: "No local file found" });
        }

        // Check if file exists
        if (!fs.existsSync(prescription.localFile.path)) {
            return res.json({ success: false, message: "Local file not found" });
        }

        // Upload to Google Drive
        const driveUploadResult = await uploadFileToDrive(
            accessToken,
            prescription.localFile.path,
            prescription.localFile.filename,
            prescription.localFile.mimetype
        );

        // Update prescription with Google Drive info
        prescription.googleDrive = {
            fileId: driveUploadResult.fileId,
            fileUrl: driveUploadResult.fileUrl,
            folderId: driveUploadResult.folderId,
            uploadedAt: new Date(),
            uploadedBy: prescription.doctorId
        };

        await prescription.save();

        res.json({
            success: true,
            message: "Prescription uploaded to Google Drive successfully",
            googleDrive: prescription.googleDrive
        });

    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete prescription from Google Drive
const deleteFromGoogleDrive = async (req, res) => {
    try {
        const { prescriptionId, accessToken } = req.body;

        const prescription = await prescriptionModel.findById(prescriptionId);
        
        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        if (!prescription.googleDrive || !prescription.googleDrive.fileId) {
            return res.json({ success: false, message: "No Google Drive file found" });
        }

        // Delete from Google Drive
        await deleteFileFromDrive(accessToken, prescription.googleDrive.fileId);

        // Remove Google Drive info from prescription
        prescription.googleDrive = undefined;
        await prescription.save();

        res.json({
            success: true,
            message: "Prescription deleted from Google Drive successfully"
        });

    } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        res.json({ success: false, message: error.message });
    }
};

// List all prescription files from Google Drive
const listDrivePrescriptions = async (req, res) => {
    try {
        const { accessToken } = req.body;

        const files = await listPrescriptionFiles(accessToken);

        res.json({
            success: true,
            files
        });

    } catch (error) {
        console.error('Error listing Drive prescriptions:', error);
        res.json({ success: false, message: error.message });
    }
};

// Download prescription PDF
const downloadPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const prescription = await prescriptionModel.findById(prescriptionId);
        
        if (!prescription) {
            return res.status(404).json({ success: false, message: "Prescription not found" });
        }

        if (!prescription.localFile || !prescription.localFile.path) {
            return res.status(404).json({ success: false, message: "No local file found" });
        }

        // Check if file exists
        if (!fs.existsSync(prescription.localFile.path)) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        res.download(prescription.localFile.path, prescription.localFile.filename);

    } catch (error) {
        console.error('Error downloading prescription:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    createPrescription,
    getPrescription,
    getPatientPrescriptions,
    getDoctorPrescriptions,
    uploadToGoogleDrive,
    deleteFromGoogleDrive,
    listDrivePrescriptions,
    downloadPrescription
};
