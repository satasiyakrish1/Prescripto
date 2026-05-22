#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🔧 Zoho Payments Auto-Fix Tool');
console.log('==============================\n');

async function fixZohoPayments() {
    const fixes = [];
    const warnings = [];

    // Check and fix .env file
    const envPath = '.env';
    let envContent = '';

    try {
        envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
        console.log('❌ .env file not found');
        return;
    }

    console.log('🔍 Analyzing current configuration...\n');

    // Check required variables
    const requiredVars = {
        'ZOHO_PAYMENTS_OAUTH_TOKEN': process.env.ZOHO_PAYMENTS_OAUTH_TOKEN,
        'ZOHO_PAYMENTS_ACCOUNT_ID': process.env.ZOHO_PAYMENTS_ACCOUNT_ID,
        'ZOHO_PAYMENTS_API_ROOT': process.env.ZOHO_PAYMENTS_API_ROOT
    };

    // Check if test mode is properly configured
    const nodeEnv = process.env.NODE_ENV;
    const testMode = process.env.ZOHO_PAYMENTS_TEST_MODE;

    console.log('📋 Current Status:');
    Object.entries(requiredVars).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value ? 'SET' : 'MISSING'}`);
    });

    // Fix 1: Ensure test mode is enabled for development
    if (nodeEnv === 'development' && testMode !== 'true') {
        if (!envContent.includes('ZOHO_PAYMENTS_TEST_MODE')) {
            envContent += '\n# Zoho Payments Test Mode\nZOHO_PAYMENTS_TEST_MODE=true\n';
            fixes.push('Added ZOHO_PAYMENTS_TEST_MODE=true for development');
        } else {
            envContent = envContent.replace(
                /ZOHO_PAYMENTS_TEST_MODE=.*/,
                'ZOHO_PAYMENTS_TEST_MODE=true'
            );
            fixes.push('Updated ZOHO_PAYMENTS_TEST_MODE to true');
        }
    }

    // Fix 2: Set default API root if missing
    if (!process.env.ZOHO_PAYMENTS_API_ROOT) {
        if (!envContent.includes('ZOHO_PAYMENTS_API_ROOT')) {
            envContent += '\n# Zoho Payments API Root\nZOHO_PAYMENTS_API_ROOT=https://payments.zoho.in/api/v1\n';
            fixes.push('Added default ZOHO_PAYMENTS_API_ROOT');
        }
    }

    // Fix 3: Add NODE_ENV if missing
    if (!nodeEnv) {
        if (!envContent.includes('NODE_ENV')) {
            envContent += '\n# Environment\nNODE_ENV=development\n';
            fixes.push('Added NODE_ENV=development');
        }
    }

    // Apply fixes
    if (fixes.length > 0) {
        try {
            fs.writeFileSync(envPath, envContent);
            console.log('\n🔧 Applied Fixes:');
            fixes.forEach(fix => console.log(`   ✅ ${fix}`));
        } catch (error) {
            console.log('\n❌ Failed to update .env file:', error.message);
            return;
        }
    } else {
        console.log('\n✅ No automatic fixes needed');
    }

    // Check for remaining issues
    console.log('\n🔍 Remaining Issues:');

    if (!process.env.ZOHO_PAYMENTS_OAUTH_TOKEN) {
        warnings.push('ZOHO_PAYMENTS_OAUTH_TOKEN is required - get this from Zoho API Console');
    }

    if (!process.env.ZOHO_PAYMENTS_ACCOUNT_ID) {
        warnings.push('ZOHO_PAYMENTS_ACCOUNT_ID is required - get this from Zoho Payments dashboard');
    }

    if (warnings.length > 0) {
        warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));

        console.log('\n📝 Manual Steps Required:');
        console.log('   1. Get OAuth token from https://api-console.zoho.in/');
        console.log('   2. Get Account ID from Zoho Payments dashboard');
        console.log('   3. Add these values to your .env file');
        console.log('   4. Restart your application');
    } else {
        console.log('   ✅ All configuration looks good!');
    }

    // Test the configuration
    console.log('\n🧪 Testing Configuration...');

    try {
        // Import and test the configuration
        const { getZohoPaymentsConfig } = await import('../config/zohoPaymentsConfig.js');
        const config = getZohoPaymentsConfig();

        if (config.apiRoot && config.accountId && (config.staticToken || (config.clientId && config.clientSecret))) {
            console.log('   ✅ Configuration is valid');

            // Test payment link creation in test mode
            if (nodeEnv === 'development' && testMode === 'true') {
                console.log('   🧪 Test mode is active - ready for testing');
            }
        } else {
            console.log('   ❌ Configuration is incomplete');
        }
    } catch (error) {
        console.log('   ❌ Configuration test failed:', error.message);
    }

    console.log('\n🎯 Summary:');
    if (fixes.length > 0) {
        console.log(`   Applied ${fixes.length} automatic fixes`);
    }
    if (warnings.length > 0) {
        console.log(`   ${warnings.length} manual steps required`);
    } else {
        console.log('   ✅ Zoho Payments is ready to use!');
    }

    console.log('\n📚 Resources:');
    console.log('   - Setup Guide: ZOHO_PAYMENTS_SETUP.md');
    console.log('   - Test Configuration: node quick-zoho-test.js');
    console.log('   - Integration Test: node test-zoho-integration.js');
}

fixZohoPayments().catch(error => {
    console.error('Fix script failed:', error);
    process.exit(1);
});