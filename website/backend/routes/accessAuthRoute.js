import express from 'express';
import jwt from 'jsonwebtoken';
import AccessUser from '../models/accessUserModel.js';
import { authRateLimiter } from '../security/security.js';

const router = express.Router();

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await AccessUser.findOne({ email, active: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const payload = { id: user._id, email: user.email, role: user.role, allowedRoutes: user.allowedRoutes || [], isViewer: true };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[accessAuth] JWT_SECRET is not set. Authentication cannot proceed.');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    res.json({ success: true, token, allowedRoutes: user.allowedRoutes || [], role: user.role });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

export default router;
