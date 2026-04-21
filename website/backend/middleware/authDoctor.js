import jwt from 'jsonwebtoken'
import doctorModel from '../models/doctorModel.js'

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    // Accept Authorization header (Bearer format) or direct dToken/dtoken headers
    const dtoken = req.headers.authorization?.split(' ')[1] || req.headers.dtoken || req.headers.dToken;
    if (!dtoken) {
        console.log('No doctor token provided in request headers')
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    
    try {
        // Log the token for debugging (remove in production)
        console.log('Received doctor token:', dtoken.substring(0, 10) + '...')
        console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
        
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        console.log('Doctor token verified successfully for ID:', token_decode.id)
        req.body.docId = token_decode.id
        // Fetch doctor from DB and attach to req.doctor
        const doctor = await doctorModel.findById(token_decode.id)
        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Doctor not found' })
        }
        req.doctor = doctor;
        next()
    } catch (error) {
        console.log('Doctor token verification failed:', error.message)
        res.json({ success: false, message: error.message })
    }
}

export default authDoctor;