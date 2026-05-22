/**
 * Controller for custom captcha verification
 * Provides a simple verification mechanism for custom captcha tokens
 */

/**
 * Verify a custom captcha token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyCustomCaptcha = (req, res) => {
  try {
    const { token } = req.body;

    // Check if token exists
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Captcha token is required'
      });
    }

    // Validate token format (should start with 'custom_captcha_')
    if (!token.startsWith('custom_captcha_')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid captcha token format'
      });
    }

    // Extract timestamp from token
    const tokenParts = token.split('_');
    if (tokenParts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid captcha token structure'
      });
    }

    const timestamp = parseInt(tokenParts[2]);
    const currentTime = Date.now();

    // Check if token is expired (older than 5 minutes)
    if (currentTime - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Captcha token expired'
      });
    }

    // Token is valid
    return res.status(200).json({
      success: true,
      message: 'Captcha verification successful'
    });
  } catch (error) {
    console.error('Error verifying custom captcha:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during captcha verification'
    });
  }
};

/**
 * Generate a new captcha challenge
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateCaptchaChallenge = (req, res) => {
  try {
    // Determine challenge type (math, pattern, or color)
    const challengeTypes = ['math', 'pattern', 'color'];
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    let challenge;
    
    switch (challengeType) {
      case 'math':
        challenge = generateMathChallenge();
        break;
      case 'pattern':
        challenge = generatePatternChallenge();
        break;
      case 'color':
        challenge = generateColorChallenge();
        break;
      default:
        challenge = generateMathChallenge();
    }
    
    // Don't send the answer to the client
    const { answer, ...challengeData } = challenge;
    
    // Store the answer in the session or a temporary storage
    // This is a simplified example - in production, you would use a more secure method
    // such as storing in Redis with a challenge ID that's sent to the client
    
    return res.status(200).json({
      success: true,
      challenge: challengeData
    });
  } catch (error) {
    console.error('Error generating captcha challenge:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during captcha generation'
    });
  }
};

// Helper functions to generate different types of challenges

const generateMathChallenge = () => {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let num1, num2, answer;
  
  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 10) + 5;
      num2 = Math.floor(Math.random() * num1);
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 5) + 1;
      num2 = Math.floor(Math.random() * 5) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
  }
  
  return {
    question: `What is ${num1} ${operation} ${num2}?`,
    answer: answer.toString(),
    type: 'math'
  };
};

const generatePatternChallenge = () => {
  const patterns = [
    { sequence: [2, 4, 6, 8], next: 10, question: 'What is the next number in the sequence: 2, 4, 6, 8, ?' },
    { sequence: [1, 3, 5, 7], next: 9, question: 'What is the next number in the sequence: 1, 3, 5, 7, ?' },
    { sequence: [1, 2, 4, 8], next: 16, question: 'What is the next number in the sequence: 1, 2, 4, 8, ?' },
    { sequence: [3, 6, 9, 12], next: 15, question: 'What is the next number in the sequence: 3, 6, 9, 12, ?' },
    { sequence: [1, 4, 9, 16], next: 25, question: 'What is the next number in the sequence: 1, 4, 9, 16, ?' },
  ];
  
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  return {
    question: selectedPattern.question,
    answer: selectedPattern.next.toString(),
    type: 'pattern'
  };
};

const generateColorChallenge = () => {
  const colors = [
    { name: 'red', hex: '#FF0000' },
    { name: 'blue', hex: '#0000FF' },
    { name: 'green', hex: '#00FF00' },
    { name: 'yellow', hex: '#FFFF00' },
    { name: 'purple', hex: '#800080' },
    { name: 'orange', hex: '#FFA500' },
  ];
  
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  const options = [selectedColor.name];
  
  // Add 3 more random colors as options
  while (options.length < 4) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)].name;
    if (!options.includes(randomColor)) {
      options.push(randomColor);
    }
  }
  
  // Shuffle options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
  return {
    question: 'What color is this?',
    colorHex: selectedColor.hex,
    options: shuffledOptions,
    answer: selectedColor.name,
    type: 'color'
  };
};