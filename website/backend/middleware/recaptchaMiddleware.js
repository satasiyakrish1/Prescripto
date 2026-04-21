import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Middleware to verify Google reCAPTCHA token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyRecaptcha = async (req, res, next) => {
  try {
    // Get the reCAPTCHA token from the request body
    const { recaptchaToken } = req.body;
    
    // If no token is provided, return an error
    if (!recaptchaToken) {
      console.log('No reCAPTCHA token provided');
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA verification failed. Please try again.' 
      });
    }

    // Log verification attempt
    console.log(`Attempting to verify reCAPTCHA token: ${recaptchaToken.substring(0, 10)}...`);
    console.log(`Using secret key: ${process.env.RECAPTCHA_SECRET_KEY ? process.env.RECAPTCHA_SECRET_KEY.substring(0, 5) + '...' : 'Not available'}`);
    console.log(`Site key from environment: ${process.env.RECAPTCHA_SITE_KEY ? process.env.RECAPTCHA_SITE_KEY.substring(0, 5) + '...' : 'Not available'}`);
    
    // Verify the token with Google reCAPTCHA API
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(
      verificationURL,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      }
    );

    // Log verification response
    console.log('reCAPTCHA verification response:', JSON.stringify(response.data));

    // Check if verification was successful
    if (response.data.success) {
      console.log('reCAPTCHA verification successful');
      console.log('Score:', response.data.score); // If using v3
      
      // Remove recaptchaToken from request body to keep it clean
      delete req.body.recaptchaToken;
      next();
    } else {
      console.log('reCAPTCHA verification failed:', response.data['error-codes']);
      return res.status(400).json({ 
        success: false, 
        message: 'reCAPTCHA verification failed. Please try again.' 
      });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error.message);
    console.error('Error details:', error.response?.data || 'No response data');
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during reCAPTCHA verification' 
    });
  }
};

export default verifyRecaptcha;