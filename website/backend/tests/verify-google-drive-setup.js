import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Google Drive Setup...\n');

// Check 1: Service account file exists
const serviceAccountPath = path.join(__dirname, 'service-account.json');
console.log('📁 Checking service account file...');
if (!fs.existsSync(serviceAccountPath)) {
    console.log('❌ ERROR: service-account.json not found!');
    console.log('📍 Expected location:', serviceAccountPath);
    console.log('\n📖 Please follow the setup guide:');
    console.log('   1. Go to https://console.cloud.google.com/');
    console.log('   2. Create a service account');
    console.log('   3. Download the JSON key');
    console.log('   4. Save it as backend/service-account.json');
    console.log('\n📄 See SETUP_GOOGLE_DRIVE.md for detailed instructions');
    process.exit(1);
}
console.log('✅ Service account file found\n');

// Check 2: Validate JSON structure
console.log('🔍 Validating service account JSON...');
try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const requiredFields = [
        'type',
        'project_id',
        'private_key_id',
        'private_key',
        'client_email',
        'client_id'
    ];
    
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
        console.log('❌ ERROR: Invalid service account JSON');
        console.log('Missing fields:', missingFields.join(', '));
        process.exit(1);
    }
    
    console.log('✅ Service account JSON is valid');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    console.log('');
} catch (error) {
    console.log('❌ ERROR: Failed to parse service account JSON');
    console.log('   Error:', error.message);
    process.exit(1);
}

// Check 3: Test Google Drive API authentication
console.log('🔐 Testing Google Drive API authentication...');
try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Try to list files (this will verify authentication)
    console.log('📡 Connecting to Google Drive...');
    const response = await drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
    });
    
    console.log('✅ Successfully authenticated with Google Drive API');
    console.log('   Connection test passed!\n');
    
} catch (error) {
    console.log('❌ ERROR: Failed to authenticate with Google Drive API');
    console.log('   Error:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('   1. Enable Google Drive API in Google Cloud Console');
    console.log('   2. Check service account permissions');
    console.log('   3. Generate a new service account key');
    console.log('   4. Verify the JSON file is not corrupted');
    process.exit(1);
}

// Check 4: Test folder creation
console.log('📂 Testing folder creation...');
try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Search for .prescripto folder
    const response = await drive.files.list({
        q: `name='.prescripto-test' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
    });
    
    let folderId;
    
    if (response.data.files && response.data.files.length > 0) {
        folderId = response.data.files[0].id;
        console.log('✅ Test folder already exists');
    } else {
        // Create test folder
        const folderMetadata = {
            name: '.prescripto-test',
            mimeType: 'application/vnd.google-apps.folder'
        };
        
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name, webViewLink'
        });
        
        folderId = folder.data.id;
        console.log('✅ Successfully created test folder');
        console.log('   Folder ID:', folderId);
        console.log('   View at:', folder.data.webViewLink);
    }
    
    // Clean up test folder
    await drive.files.delete({ fileId: folderId });
    console.log('✅ Successfully deleted test folder\n');
    
} catch (error) {
    console.log('❌ ERROR: Failed to create/delete test folder');
    console.log('   Error:', error.message);
    console.log('\n💡 This might be a permissions issue');
    process.exit(1);
}

// All checks passed!
console.log('═══════════════════════════════════════════════════');
console.log('🎉 SUCCESS! Google Drive setup is complete!');
console.log('═══════════════════════════════════════════════════');
console.log('\n✅ All checks passed:');
console.log('   • Service account file exists');
console.log('   • JSON structure is valid');
console.log('   • Google Drive API authentication works');
console.log('   • Folder creation/deletion works');
console.log('\n🚀 You can now upload medical files!');
console.log('\n📝 Next steps:');
console.log('   1. Start your backend server: npm start');
console.log('   2. Go to your profile page');
console.log('   3. Click "Medical Files" tab');
console.log('   4. Upload a test file');
console.log('\n═══════════════════════════════════════════════════\n');
