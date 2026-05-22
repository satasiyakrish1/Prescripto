// Check Zoho environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('=== ZOHO PAYMENTS CONFIGURATION CHECK ===\n');

const configs = {
  'ZOHO_PAYMENTS_OAUTH_TOKEN': process.env.ZOHO_PAYMENTS_OAUTH_TOKEN,
  'ZOHO_PAYMENTS_SIGNING_KEY': process.env.ZOHO_PAYMENTS_SIGNING_KEY,
  'ZOHO_PAYMENTS_API_ROOT': process.env.ZOHO_PAYMENTS_API_ROOT,
  'ZOHO_PAYMENTS_ACCOUNT_ID': process.env.ZOHO_PAYMENTS_ACCOUNT_ID
};

Object.entries(configs).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log('\n=== END CHECK ===');
