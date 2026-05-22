#!/usr/bin/env node

/**
 * Authentication Test Script
 * This script tests the authentication system
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.log('❌ JWT_SECRET not found in environment variables');
    process.exit(1);
}

// Test JWT token generation and verification
function testJWT() {
    console.log('🧪 Testing JWT Authentication...');
    
    try {
        // Create a test token
        const testPayload = {
            pharmacyId: 'test-pharmacy-id',
            role: 'pharmacy',
            iat: Math.floor(Date.now() / 1000)
        };
        
        const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ JWT token generated successfully');
        console.log('📄 Token:', token.substring(0, 20) + '...');
        
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ JWT token verified successfully');
        console.log('📋 Decoded payload:', decoded);
        
        // Test token format validation
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
            console.log('✅ Token format is valid (3 parts)');
        } else {
            console.log('❌ Token format is invalid');
        }
        
        return true;
    } catch (error) {
        console.log('❌ JWT test failed:', error.message);
        return false;
    }
}

// Test environment variables
function testEnvironment() {
    console.log('🧪 Testing Environment Variables...');
    
    const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
    const optionalVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'STRIPE_SECRET_KEY'];
    
    let allRequired = true;
    
    console.log('📋 Required Variables:');
    requiredVars.forEach(varName => {
        const exists = !!process.env[varName];
        console.log(`  ${exists ? '✅' : '❌'} ${varName}: ${exists ? 'Set' : 'Missing'}`);
        if (!exists) allRequired = false;
    });
    
    console.log('📋 Optional Variables:');
    optionalVars.forEach(varName => {
        const exists = !!process.env[varName];
        console.log(`  ${exists ? '✅' : '⚠️'} ${varName}: ${exists ? 'Set' : 'Not set (optional)'}`);
    });
    
    return allRequired;
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Authentication Tests...\n');
    
    // Test 1: Environment Variables
    const envTest = testEnvironment();
    console.log('');
    
    if (!envTest) {
        console.log('❌ Environment test failed. Please set required variables.');
        return;
    }
    
    // Test 2: JWT Authentication
    const jwtTest = testJWT();
    console.log('');
    
    if (jwtTest) {
        console.log('✅ All authentication tests passed!');
        console.log('');
        console.log('📝 Next Steps:');
        console.log('1. Make sure your backend server is running');
        console.log('2. Check that the pharmacy is logged in');
        console.log('3. Verify the token is being sent in requests');
        console.log('4. Check browser console for any errors');
    } else {
        console.log('❌ Authentication tests failed.');
        console.log('💡 Check your JWT_SECRET and try again.');
    }
}

// Run tests
runTests().catch(console.error);
