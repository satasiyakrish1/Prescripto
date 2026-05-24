import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const state = req.query.electron === 'true' ? 'electron' : 'web';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err || !user) return res.redirect('/login');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const isElectron = req.query.state === 'electron';
    if (isElectron) {
      return res.redirect(`prescripto://login?token=${token}&status=success`);
    }
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  })(req, res, next);
});

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  const state = req.query.electron === 'true' ? 'electron' : 'web';
  passport.authenticate('github', { 
    scope: ['user:email'],
    state: state
  })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { failureRedirect: '/login' }, (err, user) => {
    if (err || !user) return res.redirect('/login');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const isElectron = req.query.state === 'electron';
    if (isElectron) {
      return res.redirect(`prescripto://login?token=${token}&status=success`);
    }
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  })(req, res, next);
});

export default router; 