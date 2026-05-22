import express from 'express';
import { verifyCustomCaptcha, generateCaptchaChallenge } from '../controllers/captchaController.js';

const router = express.Router();

/**
 * @route POST /api/captcha/verify
 * @desc Verify a custom captcha token
 * @access Public
 */
router.post('/verify', verifyCustomCaptcha);

/**
 * @route GET /api/captcha/challenge
 * @desc Generate a new captcha challenge
 * @access Public
 */
router.get('/challenge', generateCaptchaChallenge);

export default router;