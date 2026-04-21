import jwt from 'jsonwebtoken';

const authAdminOrViewer = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.split(' ')[1];
    const aToken = req.headers.atoken || req.headers.aToken;
    const vToken = req.headers.vtoken || req.headers.vToken;
    const token = bearer || aToken || vToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const isAdmin = decoded?.isAdmin || decoded?.role === 'admin';
    const isViewer = decoded?.role === 'viewer' || decoded?.isViewer;

    if (!isAdmin && !isViewer) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    req.user = {
      _id: decoded.id || decoded._id,
      name: decoded.name,
      email: decoded.email,
      isAdmin,
      isViewer
    };

    if (isAdmin) {
      req.admin = decoded;
    }

    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Authentication failed: Token expired. Please login again.' : 'Invalid token. Please login again.';
    return res.status(401).json({ success: false, message });
  }
};

export default authAdminOrViewer;
