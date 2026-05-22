import jwt from 'jsonwebtoken';
import Pharmacy from '../models/pharmacyModel.js';

// Middleware to allow either admin or pharmacy authentication
const authAdminOrPharmacy = async (req, res, next) => {
    // Try admin token first
    let adminToken = req.headers.authorization?.split(' ')[1] || req.headers.atoken || req.headers.aToken;
    let pharmacyToken = req.headers.ptoken || req.headers.pToken;
    
    // If Authorization header exists but admin token wasn't found, it might be a pharmacy token
    if (!adminToken && req.headers.authorization?.startsWith('Bearer ')) {
        pharmacyToken = req.headers.authorization.split(' ')[1];
    }
    let jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing' });
    }

    // Try admin authentication
    if (adminToken) {
        try {
            const decoded = jwt.verify(adminToken, jwtSecret);
            if (decoded && (decoded.isAdmin || decoded.role === 'admin')) {
                req.admin = decoded;
                req.user = {
                    _id: decoded.id || decoded._id,
                    name: decoded.name,
                    email: decoded.email,
                    isAdmin: true,
                    profileImage: decoded.profileImage
                };
                // For admin, set req.pharmacy to the first pharmacy in the database (or a default one)
                try {
                    const pharmacy = await Pharmacy.findOne();
                    if (!pharmacy) {
                        return res.status(404).json({ success: false, message: 'No pharmacy found in the database for admin context.' });
                    }
                    req.pharmacy = { id: pharmacy._id.toString() };
                } catch (dbError) {
                    return res.status(500).json({ success: false, message: 'Database error', error: dbError.message });
                }
                return next();
            }
        } catch (err) {
            // If token is present but invalid, treat as not authenticated
        }
    }

    // Try pharmacy authentication
    if (pharmacyToken) {
        try {
            const decoded = jwt.verify(pharmacyToken, jwtSecret);
            if (decoded && decoded.role === 'pharmacy' && decoded.pharmacyId) {
                req.pharmacy = { id: decoded.pharmacyId };
                // Optionally check if pharmacy exists
                try {
                    const pharmacy = await Pharmacy.findById(decoded.pharmacyId);
                    if (!pharmacy) {
                        return res.status(404).json({ success: false, message: 'Pharmacy not found' });
                    }
                } catch (dbError) {
                    return res.status(500).json({ success: false, message: 'Database error', error: dbError.message });
                }
                return next();
            }
        } catch (err) {
            // If token is present but invalid, treat as not authenticated
        }
    }

    // If neither token is valid
    return res.status(401).json({ success: false, message: 'Not authorized as admin or pharmacy. Please login again.' });
};

export default authAdminOrPharmacy;