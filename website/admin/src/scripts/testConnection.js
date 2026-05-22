const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB!');
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
}

testConnection(); 