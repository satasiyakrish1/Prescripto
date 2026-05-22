import jwt from "jsonwebtoken";

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        // Check for token in different formats
        let token = req.headers.authorization?.split(' ')[1] // Bearer token format
            || req.headers.atoken 
            || req.headers.aToken;

        if (!token) {
            // No token provided - continue without authentication
            req.user = null;
            return next();
        }
        
        try {
            // Verify the token signature and decode it
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Store the decoded admin info in the request object
            req.user = {
                _id: decoded.id || decoded._id,
                name: decoded.name,
                email: decoded.email,
                isAdmin: true,
                profileImage: decoded.profileImage
            };
            
            next();
        } catch (tokenError) {
            // Token is invalid - continue without authentication
            req.user = null;
            next();
        }
    } catch (error) {
        // Any other error - continue without authentication
        req.user = null;
        next();
    }
};

export default optionalAuth;
