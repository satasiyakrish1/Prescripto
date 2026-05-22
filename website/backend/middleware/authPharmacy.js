import jwt from 'jsonwebtoken';
import Pharmacy from '../models/pharmacyModel.js';

// Pharmacy authentication middleware
const authPharmacy = async (req, res, next) => {
    // Check for token in both lowercase and camelCase format
    const ptoken = req.headers.ptoken || req.headers.pToken;
    
    if (!ptoken) {
        console.log('No pharmacy token provided in request headers');
        return res.json({ success: false, message: 'Not Authorized. Please login again.' });
    }
    
    try {
        // Log the token for debugging (remove in production)
        console.log('Received pharmacy token:', ptoken.substring(0, 10) + '...');
        console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret missing');
        
        // Verify the token signature and decode it
        const decoded = jwt.verify(ptoken, process.env.JWT_SECRET);
        
        // Check if the token is for a pharmacy role
        if (decoded.role !== 'pharmacy') {
            return res.json({ success: false, message: 'Invalid token for pharmacy access' });
        }
        
        // Add pharmacy ID to request object for use in controllers
        req.pharmacyId = decoded.pharmacyId;
        req.pharmacy = { id: decoded.pharmacyId };
        
        // Check if pharmacy exists in database
        const pharmacy = await Pharmacy.findById(decoded.pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({ success: false, message: 'Pharmacy not found' });
        }
        
        // Token is valid, proceed to the next middleware or route handler
        console.log('Pharmacy token verified successfully');
        next();
    } catch (error) {
        console.log('Pharmacy token verification failed:', error.message);
        res.json({ success: false, message: 'Authentication failed. Please login again.' });
    }
};

export default authPharmacy;