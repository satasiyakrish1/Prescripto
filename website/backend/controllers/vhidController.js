import { v4 as uuidv4 } from 'uuid'
import { validationResult } from 'express-validator'
import userModel from '../models/userModel.js'

// Utility: generate formatted V-HID like VHX-YYYY-XXXXXX
const generateFormattedVhid = async () => {
    const year = new Date().getFullYear()
    let unique = false
    let vhid
    while (!unique) {
        const suffix = uuidv4().split('-')[0].toUpperCase()
        vhid = `VHX-${year}-${suffix}`
        const exists = await userModel.findOne({ vhid })
        if (!exists) unique = true
    }
    return vhid
}

// Ensure current user has a V-HID, create if missing; return card details
export const ensureVhidForUser = async (req, res) => {
    try {
        const userId = req.body.userId
        let user = await userModel.findById(userId).select('-password')
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        if (!user.vhid) {
            user.vhid = await generateFormattedVhid()
            await user.save()
        }
        return res.json({ success: true, vhid: user.vhid })
    } catch (error) {
        console.error('ensureVhidForUser error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Get V-HID card data for current user
export const getVhidCard = async (req, res) => {
    try {
        const userId = req.body.userId
        const user = await userModel.findById(userId).select('name email image vhid bloodGroup authorizedVisitors emergencyContact dob gender')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        if (!user.vhid) {
            return res.status(400).json({ success: false, message: 'V-HID not generated yet' })
        }
        return res.json({ success: true, card: user })
    } catch (error) {
        console.error('getVhidCard error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Add authorized visitor (max 3) for current user
export const addAuthorizedVisitor = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() })
        }

        const userId = req.body.userId
        const { name, relation, idProof, expiry } = req.body

        const user = await userModel.findById(userId).select('authorizedVisitors')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        if (Array.isArray(user.authorizedVisitors) && user.authorizedVisitors.length >= 3) {
            return res.status(400).json({ success: false, message: 'Maximum of 3 authorized visitors reached' })
        }

        const passId = uuidv4()
        const expiryDate = expiry ? new Date(expiry) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        user.authorizedVisitors.push({ name, relation, idProof, passId, expiry: expiryDate })
        await user.save()

        return res.json({ success: true, message: 'Visitor added', authorizedVisitors: user.authorizedVisitors })
    } catch (error) {
        console.error('addAuthorizedVisitor error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Remove authorized visitor by passId
export const removeAuthorizedVisitor = async (req, res) => {
    try {
        const userId = req.body.userId
        const { passId } = req.body
        const user = await userModel.findById(userId).select('authorizedVisitors')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        user.authorizedVisitors = (user.authorizedVisitors || []).filter(v => v.passId !== passId)
        await user.save()
        return res.json({ success: true, message: 'Visitor removed', authorizedVisitors: user.authorizedVisitors })
    } catch (error) {
        console.error('removeAuthorizedVisitor error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Look up user by V-HID
const findUserByVhid = async (vhid) => {
    if (!vhid) return null
    return await userModel.findOne({ vhid }).select('-password')
}

// Doctor view via V-HID (RBAC protected by authDoctor)
export const doctorViewByVhid = async (req, res) => {
    try {
        const { id } = req.params // vhid
        const user = await findUserByVhid(id)
        if (!user) return res.status(404).json({ success: false, message: 'Patient not found' })
        return res.json({
            success: true,
            patient: {
                name: user.name,
                email: user.email,
                image: user.image,
                vhid: user.vhid,
                bloodGroup: user.bloodGroup || '',
                gender: user.gender || 'Not Selected',
                dob: user.dob || '',
                medicalHistory: user.medicalHistory || []
            }
        })
    } catch (error) {
        console.error('doctorViewByVhid error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Pharmacy view via V-HID (RBAC protected by authPharmacy)
export const pharmacyViewByVhid = async (req, res) => {
    try {
        const { id } = req.params
        const user = await findUserByVhid(id)
        if (!user) return res.status(404).json({ success: false, message: 'Patient not found' })
        // If prescription history exists elsewhere, integrate here; for now expose basic profile + placeholder
        return res.json({
            success: true,
            patient: {
                name: user.name,
                email: user.email,
                vhid: user.vhid,
                bloodGroup: user.bloodGroup || ''
            },
            prescriptions: []
        })
    } catch (error) {
        console.error('pharmacyViewByVhid error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Lab/Reception view via V-HID (allow admin or pharmacy via authAdminOrPharmacy or create a dedicated reception auth)
export const labViewByVhid = async (req, res) => {
    try {
        const { id } = req.params
        const user = await findUserByVhid(id)
        if (!user) return res.status(404).json({ success: false, message: 'Patient not found' })
        return res.json({
            success: true,
            patient: {
                name: user.name,
                email: user.email,
                vhid: user.vhid,
                bloodGroup: user.bloodGroup || ''
            },
            admissions: [],
            billing: []
        })
    } catch (error) {
        console.error('labViewByVhid error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}

// Public Emergency Quick Access (minimal fields)
export const emergencyByVhid = async (req, res) => {
    try {
        const { vhid } = req.params
        const user = await findUserByVhid(vhid)
        if (!user) return res.status(404).json({ success: false, message: 'Patient not found' })
        // Log minimal access
        console.log('Emergency access for V-HID:', vhid, 'at', new Date().toISOString())
        return res.json({
            success: true,
            data: {
                name: user.name,
                bloodGroup: user.bloodGroup || '',
                allergies: (user.medicalHistory || []).filter(m => m?.type === 'allergy').map(a => a?.name || a).slice(0, 10),
                emergencyContact: user.emergencyContact || { name: '', phone: '' },
                age: user.dob && user.dob !== 'Not Selected' ? (() => {
                    const dobDate = new Date(user.dob)
                    if (isNaN(dobDate)) return ''
                    const diff = Date.now() - dobDate.getTime()
                    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
                })() : ''
            }
        })
    } catch (error) {
        console.error('emergencyByVhid error:', error)
        return res.status(500).json({ success: false, message: error.message })
    }
}


