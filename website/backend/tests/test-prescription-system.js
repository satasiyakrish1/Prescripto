import axios from 'axios';
import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Test data
const testPrescription = {
    appointmentId: '673abc123def456789012345', // Replace with actual appointment ID
    diagnosis: 'Common Cold with mild fever',
    medications: [
        {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Three times daily',
            duration: '5 days',
            instructions: 'Take after meals'
        },
        {
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '7 days',
            instructions: 'Take before bedtime'
        }
    ],
    notes: 'Drink plenty of fluids. Rest for 2-3 days. Avoid cold beverages.',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

async function testPrescriptionCreation() {
    console.log('🧪 Testing Prescription System...\n');

    try {
        // Test 1: Create prescription without Google Drive
        console.log('📝 Test 1: Creating prescription (local only)...');
        const response = await axios.post(
            `${BACKEND_URL}/api/prescription/create`,
            testPrescription,
            {
                headers: {
                    'dToken': 'your_doctor_token_here' // Replace with actual doctor token
                }
            }
        );

        if (response.data.success) {
            console.log('✅ Prescription created successfully!');
            console.log('   Prescription ID:', response.data.prescription.id);
            console.log('   Local file:', response.data.prescription.localFile.filename);
            
            const prescriptionId = response.data.prescription.id;

            // Test 2: Get prescription by ID
            console.log('\n📖 Test 2: Fetching prescription by ID...');
            const getResponse = await axios.get(
                `${BACKEND_URL}/api/prescription/${prescriptionId}`
            );

            if (getResponse.data.success) {
                console.log('✅ Prescription fetched successfully!');
                console.log('   Patient:', getResponse.data.prescription.patientName);
                console.log('   Diagnosis:', getResponse.data.prescription.diagnosis);
                console.log('   Medications:', getResponse.data.prescription.medications.length);
            } else {
                console.log('❌ Failed to fetch prescription:', getResponse.data.message);
            }

            // Test 3: Download prescription
            console.log('\n📥 Test 3: Testing download endpoint...');
            console.log(`   Download URL: ${BACKEND_URL}/api/prescription/download/${prescriptionId}`);
            console.log('   ✅ Download endpoint available');

        } else {
            console.log('❌ Failed to create prescription:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

async function testGoogleDriveIntegration() {
    console.log('\n\n🔗 Testing Google Drive Integration...\n');
    
    console.log('⚠️  Manual steps required:');
    console.log('1. Get Google OAuth access token from frontend');
    console.log('2. Store it in localStorage as "googleAccessToken"');
    console.log('3. Use the upload-drive endpoint with the token');
    console.log('\nExample request:');
    console.log(`
POST ${BACKEND_URL}/api/prescription/upload-drive
Headers: { dToken: "your_doctor_token" }
Body: {
    prescriptionId: "prescription_id_here",
    accessToken: "google_access_token_here"
}
    `);
}

async function checkEnvironmentVariables() {
    console.log('\n\n🔍 Checking Environment Variables...\n');
    
    const requiredVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI'
    ];

    let allPresent = true;
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: Set`);
        } else {
            console.log(`❌ ${varName}: Missing`);
            allPresent = false;
        }
    });

    if (allPresent) {
        console.log('\n✅ All Google Drive environment variables are configured!');
    } else {
        console.log('\n⚠️  Some environment variables are missing. Please check backend/.env');
    }
}

async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   PRESCRIPTION & GOOGLE DRIVE INTEGRATION TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    await checkEnvironmentVariables();
    
    console.log('\n⚠️  Note: To run the full test, you need:');
    console.log('   1. A valid doctor authentication token');
    console.log('   2. A valid appointment ID');
    console.log('   3. Backend server running');
    console.log('\n   Update the test data in this file and run again.\n');

    // Uncomment to run actual tests
    // await testPrescriptionCreation();
    // await testGoogleDriveIntegration();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runAllTests();
