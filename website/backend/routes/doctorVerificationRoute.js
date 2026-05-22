import express from 'express'
import { verifyDoctorIMR, uploadAndOCRDocuments, manualVerificationInstructions, verifyLimiter, parsePortalText } from '../controllers/doctorVerificationController.js'
import authAdmin from '../middleware/authAdmin.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const uploadsDir = 'uploads/doctor-verification'
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname))
  }
})

const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } })

router.post('/imr-lookup', authAdmin, verifyLimiter, verifyDoctorIMR)
router.post('/documents/ocr', authAdmin, upload.fields([
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'degreeCertificate', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'portalScreenshot', maxCount: 1 }
]), uploadAndOCRDocuments)
router.get('/manual-instructions', authAdmin, manualVerificationInstructions)
router.post('/parse', authAdmin, verifyLimiter, parsePortalText)

export default router


