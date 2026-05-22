/**
 * Middleware for custom captcha verification
 */

/**
 * Verify a custom captcha token in the request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyCustomCaptcha = (req, res, next) => {
  try {
    // Get the captcha token from the request body
    const { recaptchaToken } = req.body;
    
    // If no token is provided, return an error
    if (!recaptchaToken) {
      console.log('No captcha token provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Security verification failed. Please try again.' 
      });
    }

    // Check if it's a custom token (starts with 'custom_captcha_')
    if (recaptchaToken.startsWith('custom_captcha_')) {
      console.log('Custom captcha token detected');
      
      // Extract timestamp from token
      const tokenParts = recaptchaToken.split('_');
      if (tokenParts.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid security token format'
        });
      }

      const timestamp = parseInt(tokenParts[2]);
      const currentTime = Date.now();

      // Check if token is expired (older than 5 minutes)
      if (currentTime - timestamp > 5 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: 'Security verification expired. Please try again.'
        });
      }
      
      // Token is valid, proceed to next middleware
      console.log('Custom captcha verification successful');
      
      // Remove recaptchaToken from request body to keep it clean
      delete req.body.recaptchaToken;
      next();
    } else {
      // Not a custom token, might be a Google reCAPTCHA token
      // Pass to the next middleware which might handle Google reCAPTCHA
      console.log('Not a custom captcha token, passing to next middleware');
      next();
    }
  } catch (error) {
    console.error('Error verifying custom captcha:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during security verification' 
    });
  }
};

export default verifyCustomCaptcha;