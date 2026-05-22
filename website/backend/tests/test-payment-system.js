#!/usr/bin/env node

/**
 * Payment System Test Script
 * This script tests the payment system functionality
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_PHARMACY_TOKEN = process.env.TEST_PHARMACY_TOKEN || 'test-token';

// Test data
const testSaleData = {
    items: [
        {
            medicine_id: null,
            quantity: 2,
            isCustom: true,
            custom_medicine: {
                medicine_name: 'Test Medicine',
                price: 100
            }
        }
    ],
    discount: 0,
    discountType: 'amount',
    gst: 10,
    payment_method: 'cash',
    customer: 'Test Customer',
    customer_details: {
        name: 'Test Customer',
        age: '30',
        gender: 'Male',
        contact: '1234567890',
        address: 'Test Address'
    },
    note: 'Test sale',
    updateInventory: false
};

async function testCashPayment() {
    console.log('🧪 Testing Cash Payment...');
    
    try {
        const response = await axios.post(`${BACKEND_URL}/api/payment/cash`, testSaleData, {
            headers: {
                'Content-Type': 'application/json',
                'pToken': TEST_PHARMACY_TOKEN
            }
        });
        
        if (response.data.success) {
            console.log('✅ Cash payment test passed');
            console.log('📄 Sale ID:', response.data.data._id);
            console.log('💰 Total Amount:', response.data.data.total_amount);
            return response.data.data;
        } else {
            console.log('❌ Cash payment test failed:', response.data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Cash payment test error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testRazorpayOrderCreation() {
    console.log('🧪 Testing Razorpay Order Creation...');
    
    try {
        const response = await axios.post(`${BACKEND_URL}/api/payment/razorpay/create-order`, testSaleData, {
            headers: {
                'Content-Type': 'application/json',
                'pToken': TEST_PHARMACY_TOKEN
            }
        });
        
        if (response.data.success) {
            console.log('✅ Razorpay order creation test passed');
            console.log('🆔 Order ID:', response.data.data.id);
            console.log('💰 Amount:', response.data.data.amount);
            return response.data.data;
        } else {
            console.log('❌ Razorpay order creation test failed:', response.data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Razorpay order creation test error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testEnvironmentVariables() {
    console.log('🧪 Testing Environment Variables...');
    
    const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET'
    ];
    
    const optionalVars = [
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'STRIPE_SECRET_KEY'
    ];
    
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
    
    if (!allRequired) {
        console.log('❌ Some required environment variables are missing');
        return false;
    }
    
    console.log('✅ Environment variables test passed');
    return true;
}

async function testBackendConnection() {
    console.log('🧪 Testing Backend Connection...');
    
    try {
        const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
        console.log('✅ Backend connection test passed');
        return true;
    } catch (error) {
        console.log('❌ Backend connection test failed:', error.message);
        console.log('💡 Make sure the backend server is running on', BACKEND_URL);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Payment System Tests...\n');
    
    // Test 1: Environment Variables
    const envTest = await testEnvironmentVariables();
    console.log('');
    
    // Test 2: Backend Connection
    const connectionTest = await testBackendConnection();
    console.log('');
    
    if (!envTest || !connectionTest) {
        console.log('❌ Prerequisites failed. Please fix the issues above before running payment tests.');
        return;
    }
    
    // Test 3: Cash Payment
    const cashTest = await testCashPayment();
    console.log('');
    
    // Test 4: Razorpay Order Creation (if configured)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const razorpayTest = await testRazorpayOrderCreation();
        console.log('');
    } else {
        console.log('⚠️ Razorpay not configured - skipping Razorpay tests');
        console.log('');
    }
    
    console.log('🏁 Payment System Tests Completed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Set up environment variables in backend/.env');
    console.log('2. Set up environment variables in admin/.env');
    console.log('3. Start the backend server: npm start');
    console.log('4. Start the admin panel: npm run dev');
    console.log('5. Test the payment flow in the admin interface');
}

// Run tests
runAllTests().catch(console.error);
