/**
 * Google Wallet Setup Helper
 * 
 * This script helps you set up the Google Wallet credentials file
 * and provides step-by-step instructions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    log(`\n${'='.repeat(70)}`, 'bright');
    log(message, 'bright');
    log('='.repeat(70), 'bright');
}

console.clear();
header('Google Wallet Credentials Setup Helper');

log('\n📋 Checking your current setup...\n', 'cyan');

// Check 1: Environment variable
const envCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!envCredPath) {
    log('❌ GOOGLE_APPLICATION_CREDENTIALS is NOT set in .env file', 'red');
    log('\n📝 SOLUTION:', 'yellow');
    log('Add this line to your backend/.env file:', 'yellow');
    log('GOOGLE_APPLICATION_CREDENTIALS=./config/google-wallet-service-account.json', 'bright');
} else {
    log(`✓ GOOGLE_APPLICATION_CREDENTIALS is set to: ${envCredPath}`, 'green');
}

// Check 2: File existence
const configDir = path.join(__dirname, 'config');
const possiblePaths = [
    envCredPath,
    './config/google-wallet-service-account.json',
    './config/google-wallet-key.json',
    path.join(configDir, 'google-wallet-service-account.json'),
    path.join(configDir, 'google-wallet-key.json')
];

log('\n🔍 Checking for credentials file in possible locations...\n', 'cyan');

let foundFile = null;
for (const filePath of possiblePaths) {
    if (!filePath) continue;

    const fullPath = path.resolve(filePath);
    const exists = fs.existsSync(fullPath);

    if (exists) {
        log(`✓ Found: ${fullPath}`, 'green');
        foundFile = fullPath;
    } else {
        log(`✗ Not found: ${fullPath}`, 'red');
    }
}

// Check 3: Config directory
if (!fs.existsSync(configDir)) {
    log('\n❌ Config directory does not exist!', 'red');
    log('Creating config directory...', 'yellow');
    fs.mkdirSync(configDir, { recursive: true });
    log('✓ Config directory created', 'green');
} else {
    log('\n✓ Config directory exists', 'green');
}

// List files in config directory
log('\n📁 Files in config directory:', 'cyan');
const configFiles = fs.readdirSync(configDir);
configFiles.forEach(file => {
    log(`  - ${file}`, 'bright');
});

// Final recommendations
header('Setup Instructions');

if (!foundFile) {
    log('\n❌ Google Wallet credentials file NOT FOUND', 'red');
    log('\n📝 TO FIX THIS ISSUE, FOLLOW THESE STEPS:\n', 'yellow');

    log('STEP 1: Get your Google Cloud service account key', 'bright');
    log('  1. Go to https://console.cloud.google.com/', 'cyan');
    log('  2. Select your project', 'cyan');
    log('  3. Go to "IAM & Admin" → "Service Accounts"', 'cyan');
    log('  4. Find your service account (or create one)', 'cyan');
    log('  5. Click on it → "Keys" tab → "Add Key" → "Create new key"', 'cyan');
    log('  6. Choose "JSON" format', 'cyan');
    log('  7. Download the JSON file', 'cyan');

    log('\nSTEP 2: Place the file in the correct location', 'bright');
    const targetPath = path.join(configDir, 'google-wallet-service-account.json');
    log(`  Copy the downloaded JSON file to:`, 'cyan');
    log(`  ${targetPath}`, 'green');

    log('\nSTEP 3: Update your .env file', 'bright');
    log('  Add this line to backend/.env:', 'cyan');
    log('  GOOGLE_APPLICATION_CREDENTIALS=./config/google-wallet-service-account.json', 'green');

    log('\nSTEP 4: Verify the setup', 'bright');
    log('  Run this command:', 'cyan');
    log('  node verify-google-wallet-setup.js', 'green');

    log('\n💡 QUICK FIX:', 'yellow');
    log('If you already have the JSON file downloaded, just copy it to:', 'yellow');
    log(targetPath, 'green');

} else {
    log('\n✅ Credentials file found!', 'green');
    log(`Location: ${foundFile}`, 'bright');

    // Verify it's valid JSON
    try {
        const content = fs.readFileSync(foundFile, 'utf8');
        const json = JSON.parse(content);

        if (json.type === 'service_account') {
            log('\n✓ File is a valid service account JSON', 'green');
            log(`  Project ID: ${json.project_id}`, 'cyan');
            log(`  Client Email: ${json.client_email}`, 'cyan');

            // Check if .env points to the right file
            if (envCredPath && path.resolve(envCredPath) !== foundFile) {
                log('\n⚠️  WARNING: .env points to a different file!', 'yellow');
                log(`  .env points to: ${path.resolve(envCredPath)}`, 'yellow');
                log(`  Found file at: ${foundFile}`, 'yellow');
                log('\n  Update your .env file to point to the correct location.', 'yellow');
            } else {
                log('\n✅ Everything looks good!', 'green');
                log('\nNext steps:', 'bright');
                log('  1. Restart your backend server', 'cyan');
                log('  2. Try generating a Google Wallet pass again', 'cyan');
            }
        } else {
            log('\n❌ File is not a valid service account JSON', 'red');
            log('  The file should have "type": "service_account"', 'yellow');
        }
    } catch (error) {
        log('\n❌ Error reading credentials file:', 'red');
        log(`  ${error.message}`, 'red');
    }
}

// Additional checks
header('Additional Checks');

log('\n🔐 Checking other required environment variables:\n', 'cyan');

const requiredVars = [
    'GOOGLE_WALLET_ISSUER_ID',
    'PRODUCTION_FRONTEND_URL'
];

requiredVars.forEach(varName => {
    if (process.env[varName]) {
        log(`✓ ${varName} is set`, 'green');
    } else {
        log(`✗ ${varName} is NOT set`, 'red');
    }
});

log('\n');
header('Summary');

if (foundFile && envCredPath && path.resolve(envCredPath) === foundFile) {
    log('\n✅ Your Google Wallet setup is COMPLETE!', 'green');
    log('\nYou can now:', 'bright');
    log('  • Restart your backend server', 'cyan');
    log('  • Generate Google Wallet passes', 'cyan');
} else {
    log('\n⚠️  Your Google Wallet setup is INCOMPLETE', 'yellow');
    log('\nFollow the instructions above to complete the setup.', 'yellow');
}

log('\n📚 For detailed instructions, see:', 'cyan');
log('  docs/GOOGLE_WALLET_SETUP.md', 'bright');
log('\n');
