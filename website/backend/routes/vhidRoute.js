import express from 'express'
import { body } from 'express-validator'
import authUser from '../middleware/authUser.js'
import authDoctor from '../middleware/authDoctor.js'
import authPharmacy from '../middleware/authPharmacy.js'
import authAdminOrPharmacy from '../middleware/authAdminOrPharmacy.js'
import {
  ensureVhidForUser,
  getVhidCard,
  addAuthorizedVisitor,
  removeAuthorizedVisitor,
  doctorViewByVhid,
  pharmacyViewByVhid,
  labViewByVhid,
  emergencyByVhid
} from '../controllers/vhidController.js'

const router = express.Router()

// User-owned endpoints
router.post('/ensure', authUser, ensureVhidForUser)
router.get('/card', authUser, getVhidCard)
router.post(
  '/authorized/add',
  authUser,
  body('name').isString().trim().isLength({ min: 2 }),
  body('relation').isString().trim().isLength({ min: 2 }),
  body('idProof').isString().trim().isLength({ min: 3 }),
  body('expiry').optional().isISO8601().toDate(),
  addAuthorizedVisitor
)
router.post('/authorized/remove', authUser, body('passId').isString().notEmpty(), removeAuthorizedVisitor)

// RBAC views via V-HID
router.get('/doctor/:id', authDoctor, doctorViewByVhid)
router.get('/pharmacy/:id', authPharmacy, pharmacyViewByVhid)
router.get('/lab/:id', authAdminOrPharmacy, labViewByVhid)

// Public emergency access (minimal)
router.get('/emergency/:vhid', emergencyByVhid)

export default router


