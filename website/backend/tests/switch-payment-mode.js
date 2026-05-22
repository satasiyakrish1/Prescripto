#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const mode = args[0];

if (!mode || !['test', 'real'].includes(mode)) {
    console.log('🔧 Zoho Payment Mode Switcher');
    console.log('============================\n');
    console.log('Usage: node switch-payment-mode.js [test|real]');
    console.log('');
    console.log('Modes:');
    console.log('  test - Enable test mode (mock payments)');
    console.log('  real - Enable real mode (actual Zoho payments)');
    console.log('');
    console.log('Examples:');
    console.log('  node switch-payment-mode.js test');
    console.log('  node switch-payment-mode.js real');
    process.exit(1);
}

const envPath = '.env';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    console.log(`🔧 Switching to ${mode.toUpperCase()} payment mode...\n`);
    
    if (mode === 'test') {
        // Enable test mode
        envContent = envContent.replace(
            /ZOHO_PAYMENTS_TEST_MODE="?false"?/g,
            'ZOHO_PAYMENTS_TEST_MODE="true"'
        );
        
        console.log('✅ Test mode enabled');
        console.log('   - Payments will be simulated');
        console.log('   - No real money will be processed');
        console.log('   - Redirects to local test payment page');
        
    } else if (mode === 'real') {
        // Enable real mode
        envContent = envContent.replace(
            /ZOHO_PAYMENTS_TEST_MODE="?true"?/g,
            'ZOHO_PAYMENTS_TEST_MODE="false"'
        );
        
        console.log('✅ Real payment mode enabled');
        console.log('   - Real Zoho payments will be processed');
        console.log('   - Actual money will be charged');
        console.log('   - Redirects to Zoho payment pages');
    }
    
    // Write the updated content
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n📝 Configuration updated in .env file');
    console.log('🔄 Please restart your server for changes to take effect');
    
    // Show current configuration
    console.log('\n📊 Current Configuration:');
    const isTestMode = envContent.includes('ZOHO_PAYMENTS_TEST_MODE="true"');
    console.log(`   Test Mode: ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Real Payments: ${!isTestMode ? 'ENABLED' : 'DISABLED'}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart your server: npm start');
    console.log('   2. Test the payment flow in your application');
    if (mode === 'real') {
        console.log('   3. ⚠️  Start with small amounts (₹1-10) for testing');
        console.log('   4. Monitor your Zoho Payments dashboard');
    }
    
} catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
}