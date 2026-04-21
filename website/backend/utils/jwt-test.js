import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * This utility script helps diagnose JWT token issues by:
 * 1. Generating a test token with the current JWT_SECRET
 * 2. Verifying the token to ensure the secret works correctly
 * 3. Testing verification with an intentionally wrong secret
 * 
 * Run this script with: node utils/jwt-test.js
 */

const JWT_SECRET = process.env.JWT_SECRET;

console.log('\n=== JWT DIAGNOSTIC TOOL ===');
console.log(`JWT_SECRET exists: ${Boolean(JWT_SECRET)}`);
console.log(`JWT_SECRET length: ${JWT_SECRET ? JWT_SECRET.length : 0}`);
console.log(`JWT_SECRET first 3 chars: ${JWT_SECRET ? JWT_SECRET.substring(0, 3) : 'N/A'}...`);

// Create a test payload
const testPayload = {
  id: 'test-user-123',
  role: 'tester',
  timestamp: Date.now()
};

// Generate a token with the current secret
console.log('\n=== GENERATING TEST TOKEN ===');
const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
console.log(`Generated token: ${token.substring(0, 20)}...`);

// Verify the token with the same secret (should succeed)
console.log('\n=== VERIFYING TOKEN WITH CORRECT SECRET ===');
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Verification successful!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Verification failed with correct secret!');
  console.log('Error:', error.message);
  console.log('Error name:', error.name);
}

// Verify with wrong secret (should fail with 'invalid signature')
console.log('\n=== VERIFYING TOKEN WITH WRONG SECRET (EXPECTED TO FAIL) ===');
try {
  const wrongSecret = 'wrong-secret-for-testing';
  const decoded = jwt.verify(token, wrongSecret);
  console.log('⚠️ Unexpected success with wrong secret!');
} catch (error) {
  console.log('✅ Expected failure with wrong secret: ', error.message);
}

console.log('\n=== RECOMMENDATIONS ===');
console.log('1. Ensure the same JWT_SECRET is used across all environments');
console.log('2. Check that frontend is sending the correct token format');
console.log('3. Verify token header names match between client and server');
console.log('4. Confirm token is not being modified during transmission');