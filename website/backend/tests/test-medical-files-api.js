import axios from 'axios';

const backendUrl = 'http://localhost:4000';

console.log('🧪 Testing Medical Files API...\n');

// Test 1: Check if server is running
async function testServerRunning() {
    try {
        console.log('Test 1: Checking if server is running...');
        const response = await axios.get(backendUrl);
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        console.error('❌ Server is not running');
        console.error('   Please start the backend server: cd backend && npm start');
        return false;
    }
}

// Test 2: Check if medical files route exists
async function testMedicalFilesRoute() {
    try {
        console.log('\nTest 2: Checking if medical files route exists...');
        // This will fail with 401 (unauthorized) but that's OK - it means the route exists
        const response = await axios.get(`${backendUrl}/api/medical-files/list`);
        console.log('✅ Medical files route exists');
        return true;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ Medical files route exists (requires authentication)');
            return true;
        } else if (error.response && error.response.status === 404) {
            console.error('❌ Medical files route not found (404)');
            console.error('   The route is not registered. Check server.js');
            return false;
        } else {
            console.error('❌ Error checking route:', error.message);
            return false;
        }
    }
}

// Test 3: Check if uploads directory exists
async function testUploadsDirectory() {
    try {
        console.log('\nTest 3: Checking if uploads directory exists...');
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        const uploadsDir = path.join(__dirname, 'uploads', 'medical-files');
        
        if (fs.existsSync(uploadsDir)) {
            console.log('✅ Uploads directory exists:', uploadsDir);
            return true;
        } else {
            console.log('⚠️  Uploads directory does not exist (will be auto-created)');
            return true; // Not critical, will be created automatically
        }
    } catch (error) {
        console.error('❌ Error checking uploads directory:', error.message);
        return false;
    }
}

// Test 4: Check if service account exists
async function testServiceAccount() {
    try {
        console.log('\nTest 4: Checking if service account exists...');
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        const serviceAccountPath = path.join(__dirname, 'service-account.json');
        
        if (fs.existsSync(serviceAccountPath)) {
            console.log('✅ Service account file exists');
            
            // Try to parse it
            const content = fs.readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(content);
            
            if (serviceAccount.type === 'service_account') {
                console.log('✅ Service account file is valid');
                return true;
            } else {
                console.error('❌ Service account file is invalid');
                return false;
            }
        } else {
            console.error('❌ Service account file not found');
            console.error('   Please add service-account.json to backend/ directory');
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking service account:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Medical Files API Test Suite');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const results = {
        serverRunning: await testServerRunning(),
        routeExists: false,
        uploadsDir: false,
        serviceAccount: false
    };
    
    if (results.serverRunning) {
        results.routeExists = await testMedicalFilesRoute();
        results.uploadsDir = await testUploadsDirectory();
        results.serviceAccount = await testServiceAccount();
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Test Results Summary');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`Server Running:     ${results.serverRunning ? '✅' : '❌'}`);
    console.log(`Route Exists:       ${results.routeExists ? '✅' : '❌'}`);
    console.log(`Uploads Directory:  ${results.uploadsDir ? '✅' : '⚠️'}`);
    console.log(`Service Account:    ${results.serviceAccount ? '✅' : '❌'}`);
    
    const allPassed = results.serverRunning && results.routeExists && results.serviceAccount;
    
    console.log('\n═══════════════════════════════════════════════════════');
    if (allPassed) {
        console.log('  🎉 All tests passed! Medical Files API is ready!');
    } else {
        console.log('  ⚠️  Some tests failed. Please fix the issues above.');
    }
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (!results.serverRunning) {
        console.log('💡 Next step: Start the backend server');
        console.log('   cd backend && npm start\n');
    } else if (!results.routeExists) {
        console.log('💡 Next step: Restart the backend server');
        console.log('   Press Ctrl+C in the backend terminal, then run: npm start\n');
    } else if (!results.serviceAccount) {
        console.log('💡 Next step: Add service account credentials');
        console.log('   Download from Google Cloud Console and save as backend/service-account.json\n');
    } else {
        console.log('💡 Next step: Test in the browser');
        console.log('   Go to My Profile > Medical Files tab\n');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
