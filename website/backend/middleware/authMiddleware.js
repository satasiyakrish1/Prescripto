// authMiddleware.js
import jwt from 'jsonwebtoken'

// General user authentication middleware
const authUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] // Extract token from Bearer format
    
    if (!token) {
        console.log('No token provided in request headers')
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    
    try {
        // Log the token for debugging (remove in production)
        console.log('Received token:', token.substring(0, 10) + '...')
        console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log('Token verified successfully for:', decoded.id)
        
        // Store the decoded user info in the request object
        req.user = decoded
        next()
    } catch (error) {
        console.log('Token verification failed:', error.message)
        res.json({ success: false, message: error.message })
    }
}

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        // Check for token in both lowercase and camelCase format
        const atoken = req.headers.authorization?.split(' ')[1] || req.headers.atoken || req.headers.aToken
        if (!atoken) {
            console.log('No admin token provided in request headers')
            return res.status(401).json({ success: false, message: 'Not Authorized - Admin token required' })
        }
        
        try {
            // Log the token for debugging (remove in production)
            console.log('Received admin token:', atoken.substring(0, 10) + '...')
            console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
            
            // Verify the token signature and decode it
            const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
            
            // Log successful verification
            console.log('Admin token verified successfully for:', decoded.email)
            
            // Store the decoded admin info in the request object
            req.admin = decoded
            next()
        } catch (error) {
            console.log('Admin token verification failed:', error.message)
            res.json({ success: false, message: error.message })
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error during authentication' })
    }
}

// Pharmacy authentication middleware
const verifyPharmacyToken = async (req, res, next) => {
    try {
        // Check for token in authorization header
        const token = req.headers.authorization?.split(' ')[1]
        if (!token) {
            console.log('No pharmacy token provided in request headers')
            return res.status(401).json({ success: false, message: 'Not Authorized - Pharmacy token required' })
        }
        
        try {
            // Log the token for debugging (remove in production)
            console.log('Received pharmacy token:', token.substring(0, 10) + '...')
            console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
            
            // Verify the token signature and decode it
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            
            // Log successful verification
            console.log('Pharmacy token verified successfully for:', decoded.id)
            
            // Store the decoded pharmacy info in the request object
            req.pharmacy = decoded
            next()
        } catch (error) {
            console.log('Pharmacy token verification failed:', error.message)
            res.json({ success: false, message: error.message })
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error during authentication' })
    }
}

export { authUser, authAdmin, verifyPharmacyToken }