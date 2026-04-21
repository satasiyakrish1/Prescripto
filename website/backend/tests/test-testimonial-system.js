/**
 * Test script for Patient Testimonials System
 * 
 * This script helps verify that the testimonial system is working correctly.
 * Run this after starting your backend server.
 * 
 * Usage: node test-testimonial-system.js
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Test configuration
const testConfig = {
    userToken: '', // Add a valid user token here
    adminToken: '', // Add a valid admin token here
    doctorId: '', // Add a valid doctor ID here
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testSubmitTestimonial() {
    log('\n📝 Testing: Submit Testimonial', colors.blue);
    
    try {
        const response = await axios.post(
            `${BACKEND_URL}/api/testimonials/submit`,
            {
                doctorId: testConfig.doctorId,
                content: 'This is a test review. The doctor was very professional and helpful!',
                rating: 5
            },
            {
                headers: { token: testConfig.userToken }
            }
        );
        
        if (response.data.success) {
            log('✅ Testimonial submitted successfully', colors.green);
            log(`   Status: ${response.data.testimonial.status}`, colors.yellow);
            return response.data.testimonial._id;
        } else {
            log('❌ Failed to submit testimonial', colors.red);
            log(`   Message: ${response.data.message}`, colors.yellow);
        }
    } catch (error) {
        log('❌ Error submitting testimonial', colors.red);
        log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    }
}

async function testGetDoctorTestimonials() {
    log('\n📋 Testing: Get Doctor Testimonials', colors.blue);
    
    try {
        const response = await axios.get(
            `${BACKEND_URL}/api/testimonials/doctor/${testConfig.doctorId}?page=1&limit=10`
        );
        
        if (response.data.success) {
            log('✅ Doctor testimonials retrieved successfully', colors.green);
            log(`   Total Reviews: ${response.data.totalReviews}`, colors.yellow);
            log(`   Average Rating: ${response.data.averageRating}`, colors.yellow);
            log(`   Reviews on this page: ${response.data.results}`, colors.yellow);
        } else {
            log('❌ Failed to get doctor testimonials', colors.red);
        }
    } catch (error) {
        log('❌ Error getting doctor testimonials', colors.red);
        log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    }
}

async function testGetUserTestimonials() {
    log('\n👤 Testing: Get User Testimonials', colors.blue);
    
    try {
        const response = await axios.get(
            `${BACKEND_URL}/api/testimonials/user/my-testimonials`,
            {
                headers: { token: testConfig.userToken }
            }
        );
        
        if (response.data.success) {
            log('✅ User testimonials retrieved successfully', colors.green);
            log(`   Total Reviews: ${response.data.results}`, colors.yellow);
            
            if (response.data.data.length > 0) {
                log('\n   Your Reviews:', colors.yellow);
                response.data.data.forEach((review, index) => {
                    log(`   ${index + 1}. Rating: ${review.rating}/5 | Status: ${review.status}`, colors.yellow);
                });
            }
        } else {
            log('❌ Failed to get user testimonials', colors.red);
        }
    } catch (error) {
        log('❌ Error getting user testimonials', colors.red);
        log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    }
}

async function testGetAllTestimonials() {
    log('\n🔐 Testing: Get All Testimonials (Admin)', colors.blue);
    
    try {
        const response = await axios.get(
            `${BACKEND_URL}/api/testimonials/all?page=1&limit=20&status=all`,
            {
                headers: { token: testConfig.adminToken }
            }
        );
        
        if (response.data.success) {
            log('✅ All testimonials retrieved successfully', colors.green);
            log(`   Total: ${response.data.total}`, colors.yellow);
            log(`   Page: ${response.data.page}/${response.data.totalPages}`, colors.yellow);
            
            // Count by status
            const statusCounts = response.data.data.reduce((acc, review) => {
                acc[review.status] = (acc[review.status] || 0) + 1;
                return acc;
            }, {});
            
            log('\n   Status Breakdown:', colors.yellow);
            Object.entries(statusCounts).forEach(([status, count]) => {
                log(`   - ${status}: ${count}`, colors.yellow);
            });
        } else {
            log('❌ Failed to get all testimonials', colors.red);
        }
    } catch (error) {
        log('❌ Error getting all testimonials', colors.red);
        log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    }
}

async function testUpdateTestimonialStatus(testimonialId) {
    log('\n✏️  Testing: Update Testimonial Status (Admin)', colors.blue);
    
    try {
        const response = await axios.put(
            `${BACKEND_URL}/api/testimonials/${testimonialId}/status`,
            { status: 'approved' },
            {
                headers: { token: testConfig.adminToken }
            }
        );
        
        if (response.data.success) {
            log('✅ Testimonial status updated successfully', colors.green);
            log(`   New Status: ${response.data.testimonial.status}`, colors.yellow);
        } else {
            log('❌ Failed to update testimonial status', colors.red);
        }
    } catch (error) {
        log('❌ Error updating testimonial status', colors.red);
        log(`   ${error.response?.data?.message || error.message}`, colors.yellow);
    }
}

async function runTests() {
    log('='.repeat(60), colors.blue);
    log('🧪 Patient Testimonials System - Test Suite', colors.blue);
    log('='.repeat(60), colors.blue);
    
    // Check configuration
    if (!testConfig.userToken || !testConfig.doctorId) {
        log('\n⚠️  Warning: Please configure test tokens and IDs in the script', colors.yellow);
        log('   Edit testConfig object at the top of this file', colors.yellow);
        return;
    }
    
    // Run tests
    const testimonialId = await testSubmitTestimonial();
    await testGetDoctorTestimonials();
    await testGetUserTestimonials();
    
    if (testConfig.adminToken) {
        await testGetAllTestimonials();
        
        if (testimonialId) {
            await testUpdateTestimonialStatus(testimonialId);
        }
    } else {
        log('\n⚠️  Skipping admin tests (no admin token provided)', colors.yellow);
    }
    
    log('\n' + '='.repeat(60), colors.blue);
    log('✅ Test suite completed', colors.green);
    log('='.repeat(60), colors.blue);
}

// Run the tests
runTests().catch(error => {
    log('\n❌ Test suite failed', colors.red);
    console.error(error);
    process.exit(1);
});
