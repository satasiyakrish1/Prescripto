import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadFile from '../utils/uploadToDrive.js';

const router = express.Router();

// Get the directory name using ES module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'pdf-files');
    
    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Created upload directory: ${uploadDir}`);
      }
    } catch (err) {
      console.error(`Error creating upload directory: ${err.message}`);
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ storage: storage });

// Route to handle PDF upload to Google Drive
router.post('/upload-to-drive', upload.single('pdfFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { path: filePath, originalname } = req.file;
    
    // Upload file to Google Drive
    const result = await uploadFile(filePath, originalname || 'appointment-details.pdf');

    // Clean up - remove the temporary file
    fs.unlinkSync(filePath);

    // Return success response with the Google Drive link
    res.json({ 
      success: true, 
      link: result.webViewLink,
      fileId: result.id
    });
  } catch (err) {
    console.error('Error in upload-to-drive route:', err);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Provide more specific error messages based on the error type
    if (err.message && err.message.includes('DECODER')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid service account credentials. Please check your service-account.json file.' 
      });
    } else if (err.code === 'ENOENT') {
      return res.status(500).json({ 
        success: false, 
        error: 'File not found. The temporary file may have been deleted or not created properly.' 
      });
    } else if (err.message && err.message.includes('Authentication failed')) {
      return res.status(401).json({
        success: false,
        error: err.message
      });
    } else if (err.message && err.message.includes('invalid_grant')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Invalid JWT Signature. Please check if the service account key is valid and not expired.'
      });
    } else {
      return res.status(500).json({ success: false, error: err.message || 'Unknown error occurred' });
    }
  }
});

export default router;