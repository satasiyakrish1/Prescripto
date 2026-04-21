import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req, res, next) => {
    // Check for token in Authorization header (Bearer format) or direct token header
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
    if (!token) {
        console.log('No user token provided in request headers')
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    
    try {
        // Log the token for debugging (remove in production)
        console.log('Received user token:', token.substring(0, 10) + '...')
        console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        console.log('User token verified successfully for ID:', token_decode.id)
        
        // Set userId in multiple places for compatibility
        req.body.userId = token_decode.id
        req.userId = token_decode.id
        req.user = { _id: token_decode.id }
        
        next()
    } catch (error) {
        console.log('User token verification failed:', error.message)
        res.json({ success: false, message: 'Authentication failed. Please login again.' })
    }
}

export default authUser;