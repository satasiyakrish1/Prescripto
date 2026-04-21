import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Quick Zoho Configuration Check');
console.log('=================================\n');

// Check environment variables
const requiredVars = [
    'ZOHO_PAYMENTS_OAUTH_TOKEN',
    'ZOHO_PAYMENTS_ACCOUNT_ID',
    'ZOHO_PAYMENTS_API_ROOT'
];

const optionalVars = [
    'ZOHO_PAYMENTS_SIGNING_KEY',
    'ZOHO_PAYMENTS_TEST_MODE',
    'NODE_ENV'
];

console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const display = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'NOT SET';
    console.log(`   ${status} ${varName}: ${display}`);
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚪';
    const display = value || 'NOT SET';
    console.log(`   ${status} ${varName}: ${display}`);
});

// Check test mode
const nodeEnv = process.env.NODE_ENV;
const testMode = process.env.ZOHO_PAYMENTS_TEST_MODE;

console.log('\n🧪 Test Mode Status:');
if (nodeEnv === 'development' && testMode === 'true') {
    console.log('   ✅ Test mode is properly configured for development');
} else if (nodeEnv === 'production' && testMode !== 'true') {
    console.log('   ✅ Production mode is properly configured');
} else {
    console.log('   ⚠️  Environment configuration may need adjustment');
    console.log(`      NODE_ENV: ${nodeEnv || 'not set'}`);
    console.log(`      ZOHO_PAYMENTS_TEST_MODE: ${testMode || 'not set'}`);
}

// Basic validation
const hasRequiredVars = requiredVars.every(varName => process.env[varName]);

console.log('\n📊 Summary:');
if (hasRequiredVars) {
    console.log('✅ All required variables are set');
    console.log('✅ Ready to test Zoho Payments integration');
} else {
    console.log('❌ Missing required variables');
    console.log('❌ Please check your .env file');
}

console.log('\n💡 Next Steps:');
if (hasRequiredVars) {
    console.log('   1. Test payment link creation in your app');
    console.log('   2. Try the test payment flow');
    console.log('   3. Verify webhook handling (if using webhooks)');
} else {
    console.log('   1. Add missing variables to your .env file');
    console.log('   2. Refer to ZOHO_PAYMENTS_SETUP.md for guidance');
    console.log('   3. Run this test again after configuration');
}