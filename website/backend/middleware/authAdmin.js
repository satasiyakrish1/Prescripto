import jwt from "jsonwebtoken"
import ActiveSession from "../models/activeSessionModel.js"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        // Check for token in different formats
        let token = req.headers.authorization?.split(' ')[1] // Bearer token format
            || req.headers.atoken 
            || req.headers.aToken;

        if (!token) {
            console.log('No token provided in request headers')
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        try {
            // Log the token for debugging (remove in production)
            console.log('Received token:', token.substring(0, 10) + '...')
            console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing')
            
            // Verify the token signature and decode it
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            
            // Log successful verification
            console.log('Token verified successfully for:', decoded.email)
            
            // Verify active session (if present in token)
            if (decoded.sessionId) {
                try {
                    const session = await ActiveSession.findOne({ sessionId: decoded.sessionId, adminId: decoded.id || decoded._id });
                    if (!session || session.revoked) {
                        return res.status(401).json({ success: false, message: 'Session revoked. Please login again.' });
                    }
                    // Update lastSeen
                    session.lastSeen = new Date();
                    await session.save();
                    req.session = { id: session.sessionId, db: session };
                } catch (e) {
                    console.error('Session check failed:', e.message);
                    return res.status(401).json({ success: false, message: 'Session invalid. Please login again.' });
                }
            }
            
            // Store the decoded admin info in the request object for use in route handlers
            req.admin = decoded
            // Also set req.user for compatibility with user-based operations
            req.user = {
                _id: decoded.id || decoded._id,
                name: decoded.name,
                email: decoded.email,
                isAdmin: true,
                profileImage: decoded.profileImage
            }
            
            // If verification passes, proceed to next middleware
            next()
        } catch (tokenError) {
            console.log('Admin token verification failed:', tokenError.message)
            console.log('Token error name:', tokenError.name)
            
            // Provide more specific error message based on the error type
            let errorMessage = 'Invalid token. Please login again.';
            let statusCode = 401;
            
            if (tokenError.name === 'JsonWebTokenError' && tokenError.message === 'invalid signature') {
                console.log('JWT signature verification failed - possible causes:')
                console.log('1. Token was tampered with')
                console.log('2. JWT_SECRET mismatch between token generation and verification')
                console.log('3. Token from different environment (dev/prod)')
                errorMessage = 'Authentication failed: Token signature invalid. Please login again.';
            } else if (tokenError.name === 'TokenExpiredError') {
                console.log('Token has expired')
                errorMessage = 'Authentication failed: Token expired. Please login again.';
            }
            
            return res.status(statusCode).json({ success: false, message: errorMessage })
        }
    } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export default authAdmin;
