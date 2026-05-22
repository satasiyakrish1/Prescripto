# Medical Files Upload System - Implementation Guide

## Overview
This implementation provides a complete medical file management system with:
- ✅ **Google Drive Integration** - Files uploaded to Google Drive with structured folder organization
- ✅ **AI Analysis** - Automatic AI-powered analysis of medical documents using Google Gemini
- ✅ **MongoDB Storage** - File metadata and AI analysis results stored in MongoDB
- ✅ **Sharing Capabilities** - Share files with doctors via email
- ✅ **PDF Only** - Restricted to PDF files as requested

## Architecture

### Backend Components

#### 1. Database Model (`models/medicalFileModel.js`)
```javascript
{
  userId: ObjectId,              // Reference to user
  fileName: String,               // Original file name
  googleDriveFileId: String,      // Google Drive file ID
  webViewLink: String,            // Link to view file in Drive
  webContentLink: String,         // Link to download file
  mimeType: String,               // File MIME type
  aiAnalysis: String,             // AI-generated analysis
  uploadDate: Date                // Upload timestamp
}
```

#### 2. Controller (`controllers/medicalFilesController.js`)
**Operations:**
- `uploadMedicalFile` - Uploads to Drive, analyzes with AI, saves to MongoDB
- `listMedicalFiles` - Lists all user's medical files
- `deleteMedicalFile` - Deletes from both Drive and MongoDB
- `shareMedicalFile` - Shares file with doctor via email
- `getFileDetails` - Retrieves file details

**Upload Flow:**
1. Validates PDF file (max 10MB)
2. Uploads to Google Drive in organized folders: `.prescripto/@appointments/user-{userId}/`
3. Uploads to Gemini AI for analysis
4. Generates structured medical document analysis
5. Saves metadata and AI analysis to MongoDB
6. Returns success response with file details

#### 3. Routes (`routes/medicalFilesRoute.js`)
```javascript
POST   /api/medical-files/upload       - Upload new medical file
GET    /api/medical-files/list         - List all medical files
GET    /api/medical-files/:fileId      - Get file details
DELETE /api/medical-files/:fileId      - Delete medical file
POST   /api/medical-files/:fileId/share - Share file with doctor
```

### Frontend Components

#### Medical Files Section (`components/MedicalFilesSection.jsx`)
**Features:**
- File upload with drag-and-drop
- Real-time upload progress
- File list with preview
- AI analysis modal viewer
- Share with doctor functionality
- Download and view options

**UI Elements:**
- 📤 Upload section with file validation
- 📄 File cards with metadata
- 🤖 AI Analysis button (when available)
- 👁️ View button (opens in Google Drive)
- ⬇️ Download button
- 📤 Share button
- 🗑️ Delete button

## Setup Instructions

### 1. Backend Configuration

#### Google Drive Setup:
1. Create a service account in Google Cloud Console
2. Download `service-account.json` and place in `backend/` directory
3. Enable Google Drive API for your project

#### Environment Variables (`.env.local`):
```env
# Already configured in your .env.local
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

#### MongoDB:
- Model is auto-created on first use
- No additional setup needed

### 2. File Upload Directory
```bash
# Already created
backend/uploads/medical-files/
```

### 3. API Integration

#### Upload File (Frontend Example):
```javascript
const formData = new FormData();
formData.append('file', selectedFile);

const { data } = await axios.post(
    '/api/medical-files/upload',
    formData,
    {
        headers: {
            token: userToken,
            'Content-Type': 'multipart/form-data'
        }
    }
);
```

#### List Files:
```javascript
const { data } = await axios.get(
    '/api/medical-files/list',
    { headers: { token: userToken } }
);
```

## AI Analysis

### Gemini AI Integration
The system uses Google's Gemini 1.5 Pro model to analyze medical documents:

**Analysis includes:**
1. **Document Type** - Lab Report, Prescription, etc.
2. **Key Findings/Diagnosis** - Important medical findings
3. **Prescribed Medications** - List of medications (if any)
4. **Important Dates** - Test dates, follow-up dates
5. **Doctor/Hospital Name** - Healthcare provider information

**Output Format:** Clean Markdown for easy reading

### AI Analysis Prompt:
```text
Analyze this medical document. Provide a structured summary including:
1. Document Type (e.g., Lab Report, Prescription)
2. Key Findings/Diagnosis
3. Prescribed Medications (if any)
4. Important Dates
5. Doctor/Hospital Name
Format the output as clean Markdown.
```

## Google Drive Folder Structure

```
Google Drive Root
└── .prescripto/
    └── @appointments/
        └── user-{userId}/
            ├── 1732471234567_medical-report.pdf
            ├── 1732471345678_blood-test.pdf
            └── ...
```

**Benefits:**
- Organized by user
- Easy to manage
- Scalable structure
- Automatic folder creation

## Security Features

### File Validation:
- ✅ PDF files only
- ✅ Max file size: 10MB
- ✅ MIME type validation on both frontend and backend

### Authentication:
- ✅ JWT token required for all operations
- ✅ User can only access their own files
- ✅ Middleware validates user identity

### Google Drive Permissions:
- ✅ Files have "anyone with link" read permission
- ✅ Can share with specific email addresses
- ✅ Owner maintains full control

## Error Handling

### Upload Errors:
- Invalid file type → "Only PDF files are allowed"
- File too large → "File size must be less than 10MB"
- Network error → Cleanup local file, show error message
- Drive upload fails but DB succeeds → Rollback Drive file

### AI Analysis Errors:
- If AI analysis fails → File still uploaded, analysis marked as unavailable
- Non-blocking: Upload succeeds even if analysis fails

## Testing the Implementation

### 1. Upload a File:
```bash
# Navigate to http://localhost:5173/profile
# Go to "Medical Files" section
# Click "Choose File" and select a PDF
# Click "Upload"
# Wait for success message
```

### 2. View AI Analysis:
```bash
# Click "🤖 AI Analysis" button on any uploaded file
# Modal will show the AI-generated analysis
```

### 3. Share with Doctor:
```bash
# Click "Share" button
# Enter doctor's email
# Click "Share"
# Doctor will receive email notification
```

### 4. View/Download:
```bash
# Click "View" to open in Google Drive
# Click "Download" to download file
```

## Troubleshooting

### Issue: "Error uploading file: AxiosError"
**Solutions:**
1. Check if backend server is running on port 4000
2. Verify token is valid
3. Check browser console for detailed error
4. Verify `service-account.json` exists in backend directory
5. Check Google Drive API is enabled

### Issue: "AI Analysis not available"
**Solutions:**
1. Verify `GOOGLE_AI_API_KEY` is set in `.env.local`
2. Check Gemini API quota/limits
3. Review backend logs for specific AI errors

### Issue: "File not found in Google Drive"
**Solutions:**
1. Check Google Drive service account permissions
2. Verify Drive API is enabled
3. Check service account has access to create folders

## File Size & Format Limits

| Property | Limit |
|----------|-------|
| File Type | PDF only |
| Max Size | 10MB |
| Concurrent Uploads | 1 at a time |
| Storage | Google Drive (unlimited with Google Workspace) |

## API Response Examples

### Upload Success:
```json
{
  "success": true,
  "message": "Medical file uploaded and analyzed successfully",
  "file": {
    "_id": "674397eb...",
    "userId": "673e8c...",
    "fileName": "medical-report.pdf",
    "googleDriveFileId": "1abc...",
    "webViewLink": "https://drive.google.com/file/d/1abc.../view",
    "webContentLink": "https://drive.google.com/uc?id=1abc...",
    "mimeType": "application/pdf",
    "aiAnalysis": "# Medical Document Analysis\n\n## Document Type\nLab Report...",
    "uploadDate": "2025-11-24T18:20:00.000Z"
  }
}
```

### List Files Success:
```json
{
  "success": true,
  "files": [
    {
      "id": "674397eb...",
      "name": "medical-report.pdf",
      "mimeType": "application/pdf",
      "size": 0,
      "viewLink": "https://drive.google.com/...",
      "downloadLink": "https://drive.google.com/...",
      "uploadedAt": "2025-11-24T18:20:00.000Z",
      "aiAnalysis": "# Medical Document Analysis..."
    }
  ]
}
```

## Future Enhancements

### Potential Improvements:
1. **OCR Integration** - Extract text from scanned documents
2. **Multi-file Upload** - Upload multiple files at once
3. **File Versioning** - Track document versions
4. **Categorization** - Auto-categorize medical documents
5. **Search Functionality** - Search within AI analysis
6. **Appointment Linking** - Link files to specific appointments
7. **Insurance Integration** - Submit to insurance automatically

## Conclusion

This implementation provides a robust, scalable medical file management system with:
- Secure Google Drive storage
- Intelligent AI analysis
- Easy sharing capabilities
- Clean user interface
- Comprehensive error handling

All files are safely stored in Google Drive, analyzed by AI, and easily accessible through the web interface.
