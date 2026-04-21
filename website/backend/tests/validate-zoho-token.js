import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔑 Zoho OAuth Token Validation');
console.log('==============================\n');

async function validateToken() {
    const token = process.env.ZOHO_PAYMENTS_OAUTH_TOKEN;
    const apiRoot = process.env.ZOHO_PAYMENTS_API_ROOT;
    
    if (!token) {
        console.log('❌ ZOHO_PAYMENTS_OAUTH_TOKEN is missing');
        return;
    }
    
    if (!apiRoot) {
        console.log('❌ ZOHO_PAYMENTS_API_ROOT is missing');
        return;
    }
    
    console.log('📋 Configuration:');
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log(`API Root: ${apiRoot}`);
    
    try {
        console.log('\n🔍 Testing token with accounts endpoint...');
        
        const response = await axios.get(`${apiRoot}/accounts`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log('✅ Token is valid!');
        console.log('Response status:', response.status);
        console.log('Available accounts:', response.data?.accounts?.length || 0);
        
        if (response.data?.accounts) {
            console.log('\n📊 Available Accounts:');
            response.data.accounts.forEach(acc => {
                const isConfigured = acc.account_id === process.env.ZOHO_PAYMENTS_ACCOUNT_ID;
                console.log(`   ${isConfigured ? '→' : ' '} ${acc.account_name} (ID: ${acc.account_id})`);
            });
        }
        
    } catch (error) {
        console.log('❌ Token validation failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Token appears to be expired or invalid');
            console.log('   1. Generate a new OAuth token from Zoho API Console');
            console.log('   2. Update ZOHO_PAYMENTS_OAUTH_TOKEN in .env file');
            console.log('   3. Restart your server');
        }
        
        if (error.response?.status === 403) {
            console.log('\n💡 Token lacks required permissions');
            console.log('   1. Ensure token has ZohoPayments.payments.ALL scope');
            console.log('   2. Ensure token has ZohoPayments.accounts.READ scope');
        }
    }
}

validateToken();