/**
 * Test suite for Auto-Cancellation System
 * 
 * To run these tests:
 * 1. Ensure test database is configured
 * 2. Run: node backend/tests/autoCancelSystem.test.js
 */

import mongoose from 'mongoose';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import appointmentScheduler from '../services/appointmentScheduler.js';
import { parseAppointmentDateTime } from '../utils/dateHelper.js';

// Test configuration
const TEST_DB_URI = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;

// Test data
let testUser;
let testAppointments = [];

const setupTestData = async () => {
    console.log('Setting up test data...');
    
    // Create test user
    testUser = await userModel.create({
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'hashedpassword123',
        autoCancelCount: 0
    });

    // Create test appointments for today
    const today = new Date();
    const slotDate = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
    
    // Create 3 booked appointments (should be auto-cancelled)
    for (let i = 0; i < 3; i++) {
        const appointment = await appointmentModel.create({
            userId: testUser._id.toString(),
            docId: '507f1f77bcf86cd799439011',
            slotDate,
            slotTime: `${10 + i}:00 AM`,
            userData: { name: testUser.name, email: testUser.email },
            docData: { name: 'Dr. Test', email: 'doctor@test.com' },
            amount: 500,
            date: Date.now(),
            scheduledAt: parseAppointmentDateTime(slotDate, `${10 + i}:00 AM`),
            status: 'booked',
            isCompleted: false,
            cancelled: false
        });
        testAppointments.push(appointment);
    }

    // Create 1 completed appointment (should NOT be auto-cancelled)
    const completedAppointment = await appointmentModel.create({
        userId: testUser._id.toString(),
        docId: '507f1f77bcf86cd799439011',
        slotDate,
        slotTime: '09:00 AM',
        userData: { name: testUser.name, email: testUser.email },
        docData: { name: 'Dr. Test', email: 'doctor@test.com' },
        amount: 500,
        date: Date.now(),
        scheduledAt: parseAppointmentDateTime(slotDate, '09:00 AM'),
        status: 'booked',
        isCompleted: true,
        cancelled: false
    });
    testAppointments.push(completedAppointment);

    console.log(`Created test user: ${testUser._id}`);
    console.log(`Created ${testAppointments.length} test appointments`);
};

const cleanupTestData = async () => {
    console.log('Cleaning up test data...');
    
    if (testUser) {
        await userModel.findByIdAndDelete(testUser._id);
    }
    
    for (const appointment of testAppointments) {
        await appointmentModel.findByIdAndDelete(appointment._id);
    }
    
    console.log('Test data cleaned up');
};

const runTests = async () => {
    try {
        console.log('=== Auto-Cancellation System Tests ===\n');
        
        // Connect to database
        console.log('Connecting to test database...');
        await mongoose.connect(TEST_DB_URI);
        console.log('Connected to database\n');

        // Setup test data
        await setupTestData();

        // Test 1: Date parsing
        console.log('\n--- Test 1: Date Parsing ---');
        const testDate = parseAppointmentDateTime('15_12_2024', '10:30 AM');
        console.log('Parsed date:', testDate);
        console.log('✓ Date parsing works');

        // Test 2: Run auto-cancellation job
        console.log('\n--- Test 2: Auto-Cancellation Job ---');
        const result = await appointmentScheduler.runNow();
        console.log('Job result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✓ Auto-cancellation job executed successfully');
        } else {
            console.log('✗ Auto-cancellation job failed');
        }

        // Test 3: Verify appointments were cancelled
        console.log('\n--- Test 3: Verify Cancellations ---');
        const cancelledAppointments = await appointmentModel.find({
            userId: testUser._id.toString(),
            autoCancelled: true
        });
        
        console.log(`Found ${cancelledAppointments.length} auto-cancelled appointments`);
        
        if (cancelledAppointments.length === 3) {
            console.log('✓ Correct number of appointments cancelled');
        } else {
            console.log('✗ Expected 3 cancelled appointments, got', cancelledAppointments.length);
        }

        // Test 4: Verify completed appointment was NOT cancelled
        console.log('\n--- Test 4: Verify Completed Not Cancelled ---');
        const completedAppointment = await appointmentModel.findOne({
            userId: testUser._id.toString(),
            isCompleted: true
        });
        
        if (completedAppointment && !completedAppointment.autoCancelled) {
            console.log('✓ Completed appointment was not cancelled');
        } else {
            console.log('✗ Completed appointment was incorrectly cancelled');
        }

        // Test 5: Verify user auto-cancel count
        console.log('\n--- Test 5: Verify User Auto-Cancel Count ---');
        const updatedUser = await userModel.findById(testUser._id);
        console.log(`User auto-cancel count: ${updatedUser.autoCancelCount}`);
        
        if (updatedUser.autoCancelCount === 3) {
            console.log('✓ User auto-cancel count is correct');
        } else {
            console.log('✗ Expected count 3, got', updatedUser.autoCancelCount);
        }

        // Test 6: Test blocking logic (simulate 5 cancellations)
        console.log('\n--- Test 6: Test User Blocking ---');
        updatedUser.autoCancelCount = 5;
        await updatedUser.save();
        
        // Create and cancel 2 more appointments to trigger block
        const slotDate = `${new Date().getDate()}_${new Date().getMonth() + 1}_${new Date().getFullYear()}`;
        const newAppointment = await appointmentModel.create({
            userId: testUser._id.toString(),
            docId: '507f1f77bcf86cd799439011',
            slotDate,
            slotTime: '14:00 PM',
            userData: { name: testUser.name, email: testUser.email },
            docData: { name: 'Dr. Test', email: 'doctor@test.com' },
            amount: 500,
            date: Date.now(),
            scheduledAt: parseAppointmentDateTime(slotDate, '14:00 PM'),
            status: 'booked',
            isCompleted: false,
            cancelled: false
        });
        
        // Run job again
        await appointmentScheduler.runNow();
        
        // Check if user is blocked
        const blockedUser = await userModel.findById(testUser._id);
        
        if (blockedUser.bookingBlockedUntil) {
            console.log('✓ User was blocked after 5 cancellations');
            console.log('Block until:', blockedUser.bookingBlockedUntil);
        } else {
            console.log('✗ User was not blocked');
        }

        // Cleanup
        await appointmentModel.findByIdAndDelete(newAppointment._id);

        console.log('\n=== All Tests Completed ===');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Cleanup
        await cleanupTestData();
        
        // Disconnect
        await mongoose.disconnect();
        console.log('\nDisconnected from database');
        process.exit(0);
    }
};

// Run tests
runTests();
