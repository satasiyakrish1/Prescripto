import express from 'express';
import jwt from 'jsonwebtoken';
import adminModel from '../models/adminModel.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const viewerEmail = process.env.VIEWER_EMAIL && process.env.VIEWER_EMAIL.trim();
    const viewerPassword = process.env.VIEWER_PASSWORD && process.env.VIEWER_PASSWORD.trim();

    if (!viewerEmail || !viewerPassword) {
      return res.status(500).json({ success: false, message: 'Viewer access is not configured' });
    }

    if (email.trim() !== viewerEmail || password.trim() !== viewerPassword) {
      return res.json({ success: false, message: 'Invalid viewer credentials' });
    }

    let adminProfile = await adminModel.findOne({ email: viewerEmail });
    if (!adminProfile) {
      adminProfile = await adminModel.create({
        email: viewerEmail,
        lastLogin: new Date(),
        role: 'viewer'
      });
    }

    const payload = {
      id: adminProfile._id,
      email: viewerEmail,
      name: 'Viewer',
      role: 'viewer',
      isViewer: true,
      isAdmin: false
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      token,
      lastLogin: adminProfile.lastLogin || null
    });
  } catch (error) {
    console.error('Viewer login error:', error);
    res.status(500).json({ success: false, message: 'Viewer login failed' });
  }
});

export default router;
