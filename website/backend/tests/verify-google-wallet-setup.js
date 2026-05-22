/**
 * Google Wallet Setup Verification Script
 * 
 * This script verifies that Google Wallet integration is properly configured
 * and tests the connection to Google Cloud APIs.
 */

import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✓ ${message}`, 'green');
}

function error(message) {
    log(`✗ ${message}`, 'red');
}

function info(message) {
    log(`ℹ ${message}`, 'cyan');
}

function warning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function header(message) {
    log(`\n${'='.repeat(60)}`, 'bright');
    log(message, 'bright');
    log('='.repeat(60), 'bright');
}

async function verifyGoogleWalletSetup() {
    header('Google Wallet Setup Verification');

    let allChecksPassed = true;

    // Check 1: Environment Variables
    info('\n[1/6] Checking environment variables...');

    const requiredEnvVars = [
        'GOOGLE_APPLICATION_CREDENTIALS',
        'PRODUCTION_FRONTEND_URL'
    ];

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            success(`${envVar} is set`);
        } else {
            error(`${envVar} is not set`);
            allChecksPassed = false;
        }
    }

    // Check 2: Service Account File
    info('\n[2/6] Checking service account file...');

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath) {
        error('GOOGLE_APPLICATION_CREDENTIALS is not set');
        allChecksPassed = false;
    } else {
        const fullPath = path.resolve(credentialsPath);

        if (fs.existsSync(fullPath)) {
            success(`Service account file found at: ${fullPath}`);

            try {
                const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

                if (credentials.type === 'service_account') {
                    success('Valid service account JSON file');
                    info(`  Service account email: ${credentials.client_email}`);
                    info(`  Project ID: ${credentials.project_id}`);
                } else {
                    error('Invalid service account file format');
                    allChecksPassed = false;
                }
            } catch (err) {
                error(`Failed to parse service account file: ${err.message}`);
                allChecksPassed = false;
            }
        } else {
            error(`Service account file not found at: ${fullPath}`);
            allChecksPassed = false;
        }
    }

    // Check 3: Google Authentication
    info('\n[3/6] Testing Google Cloud authentication...');

    try {
        const auth = new GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        const client = await auth.getClient();
        success('Successfully created Google Auth client');

        const accessToken = await client.getAccessToken();

        if (accessToken && accessToken.token) {
            success('Successfully obtained access token');
            info(`  Token preview: ${accessToken.token.substring(0, 20)}...`);
        } else {
            error('Failed to obtain access token');
            allChecksPassed = false;
        }
    } catch (err) {
        error(`Authentication failed: ${err.message}`);
        allChecksPassed = false;
    }

    // Check 4: Google Wallet API Access
    info('\n[4/6] Testing Google Wallet API access...');

    try {
        const auth = new GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        // Try to list generic classes (this will work even if there are no classes)
        const response = await axios.get(
            'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        success('Google Wallet API is accessible');

        if (response.data && response.data.resources) {
            info(`  Found ${response.data.resources.length} existing wallet classes`);
        }
    } catch (err) {
        if (err.response) {
            if (err.response.status === 403) {
                error('Google Wallet API access denied');
                warning('  Make sure the Google Wallet API is enabled in Google Cloud Console');
                warning('  Verify service account has "Google Wallet API Admin" role');
            } else if (err.response.status === 404) {
                warning('No wallet classes found (this is normal for new setups)');
            } else {
                error(`API request failed: ${err.response.status} ${err.response.statusText}`);
            }
        } else {
            error(`API request failed: ${err.message}`);
        }
        allChecksPassed = false;
    }

    // Check 5: Test Class Creation
    info('\n[5/6] Testing wallet class creation...');

    try {
        const auth = new GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const testClassId = 'prescripto.test-setup-verification';

        // Try to create a test class
        try {
            const createResponse = await axios.post(
                'https://walletobjects.googleapis.com/walletobjects/v1/genericClass',
                {
                    id: testClassId,
                    issuerName: 'Prescripto Test',
                    reviewStatus: 'UNDER_REVIEW',
                    genericType: 'GENERIC_TYPE_UNSPECIFIED'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            success('Successfully created test wallet class');
            info(`  Class ID: ${testClassId}`);

            // Clean up: delete the test class
            try {
                await axios.delete(
                    `https://walletobjects.googleapis.com/walletobjects/v1/genericClass/${testClassId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken.token}`
                        }
                    }
                );
                info('  Test class cleaned up');
            } catch (deleteErr) {
                warning('  Could not delete test class (you may need to delete it manually)');
            }
        } catch (createErr) {
            if (createErr.response && createErr.response.status === 409) {
                warning('Test class already exists (this is okay)');
            } else {
                throw createErr;
            }
        }
    } catch (err) {
        error(`Class creation test failed: ${err.response?.data?.error?.message || err.message}`);
        allChecksPassed = false;
    }

    // Check 6: Database Connection
    info('\n[6/6] Checking database configuration...');

    if (process.env.MONGODB_URI || process.env.MONGO_URI) {
        success('MongoDB URI is configured');
    } else {
        warning('MongoDB URI not found in environment variables');
        warning('  Make sure MONGODB_URI or MONGO_URI is set');
    }

    // Final Summary
    header('Verification Summary');

    if (allChecksPassed) {
        log('\n✅ All checks passed! Google Wallet integration is properly configured.', 'green');
        log('\nNext steps:', 'bright');
        log('  1. Start your backend server: npm start');
        log('  2. Test pass generation from the frontend');
        log('  3. Check the database for created passes');
    } else {
        log('\n❌ Some checks failed. Please review the errors above.', 'red');
        log('\nRecommended actions:', 'bright');
        log('  1. Review the GOOGLE_WALLET_SETUP.md documentation');
        log('  2. Verify Google Cloud Console configuration');
        log('  3. Check environment variables in .env file');
        log('  4. Ensure service account has proper permissions');
    }

    log('\n');
}

// Run verification
verifyGoogleWalletSetup().catch(err => {
    error(`\nVerification script failed: ${err.message}`);
    console.error(err);
    process.exit(1);
});
