#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

console.log('💳 Zoho Payment Status Check');
console.log('============================\n');

const nodeEnv = process.env.NODE_ENV;
const testMode = process.env.ZOHO_PAYMENTS_TEST_MODE;
const isTestMode = testMode === 'true';

console.log('📊 Current Configuration:');
console.log(`   NODE_ENV: ${nodeEnv}`);
console.log(`   ZOHO_PAYMENTS_TEST_MODE: ${testMode}`);
console.log(`   Frontend URL: ${process.env.DEVELOPMENT_FRONTEND_URL || process.env.FRONTEND_URL}`);

console.log('\n🔍 Payment Mode:');
if (isTestMode) {
    console.log('   🧪 TEST MODE ACTIVE');
    console.log('   - Payments will be simulated');
    console.log('   - No real money processed');
    console.log('   - Redirects to: http://localhost:5173/test-payment');
} else {
    console.log('   🔥 REAL PAYMENT MODE ACTIVE');
    console.log('   - Real Zoho payments enabled');
    console.log('   - Actual money will be charged');
    console.log('   - Redirects to: https://payments.zoho.in/...');
}

console.log('\n⚙️  CORS Configuration:');
if (nodeEnv === 'development') {
    console.log('   ✅ Development CORS - localhost allowed');
    console.log('   - Frontend: http://localhost:5173 ✅');
    console.log('   - Admin: http://localhost:5174 ✅');
} else {
    console.log('   🚫 Production CORS - localhost blocked');
    console.log('   - Only production URLs allowed');
}

console.log('\n🎯 Recommendations:');
if (nodeEnv !== 'development') {
    console.log('   ⚠️  Set NODE_ENV=development for local testing');
}

if (isTestMode) {
    console.log('   💡 To enable real payments: node switch-payment-mode.js real');
} else {
    console.log('   💡 To enable test mode: node switch-payment-mode.js test');
    console.log('   ⚠️  Real payments are active - test with small amounts!');
}

console.log('\n🔧 Quick Commands:');
console.log('   Test Mode:  node switch-payment-mode.js test');
console.log('   Real Mode:  node switch-payment-mode.js real');
console.log('   Status:     node payment-status.js');