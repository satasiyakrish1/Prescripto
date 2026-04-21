const mongoose = require('mongoose');

// List of possible MongoDB URIs to try
const mongoURIs = [
  'mongodb://localhost:27017/doctor',
  'mongodb://127.0.0.1:27017/doctor',
  'mongodb://localhost:27017/prescripto',
  'mongodb://127.0.0.1:27017/prescripto'
];

async function tryConnection(uri) {
  try {
    console.log('\nTrying to connect to:', uri);
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB at:', uri);
    
    // Get the Doctor collection
    const Doctor = mongoose.model('Doctor', new mongoose.Schema({}, { strict: false }));
    
    // Fetch all doctors
    const doctors = await Doctor.find({});
    console.log('\nFound Doctors:', doctors.length);
    doctors.forEach(doc => {
      console.log('\nDoctor Details:');
      console.log('Name:', doc.name);
      console.log('Email:', doc.email);
      console.log('Specialization:', doc.specialization);
      console.log('------------------------');
    });

    await mongoose.connection.close();
    console.log('Connection closed');
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

async function tryAllConnections() {
  for (const uri of mongoURIs) {
    const success = await tryConnection(uri);
    if (success) {
      process.exit(0);
    }
  }
  console.error('Failed to connect to any MongoDB instance');
  process.exit(1);
}

tryAllConnections(); 