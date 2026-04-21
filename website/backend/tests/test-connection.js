import axios from 'axios';
import 'dotenv/config';

// This script tests the connection to the backend server
// Run with: node test-connection.js

const backendUrl = process.env.NODE_ENV === 'production'
  ? process.env.PRODUCTION_BACKEND_URL || 'http://localhost:4000'
  : 'http://localhost:4000';

console.log(`Testing connection to backend at: ${backendUrl}`);

// Test root endpoint
axios.get(backendUrl)
  .then(response => {
    console.log('Root endpoint response:', response.status, response.data);
  })
  .catch(error => {
    console.error('Error connecting to root endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received. Request details:', {
        method: error.request.method,
        path: error.request.path,
        host: error.request.host,
        protocol: error.request.protocol,
      });
    }
  });

// Test health endpoint
axios.get(`${backendUrl}/health`)
  .then(response => {
    console.log('Health endpoint response:', response.status, response.data);
  })
  .catch(error => {
    console.error('Error connecting to health endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.status, error.response.data);
    }
  });

// Test API endpoint
axios.get(`${backendUrl}/api/doctor/list`)
  .then(response => {
    console.log('API endpoint response:', response.status, response.data.success);
    console.log(`Found ${response.data.doctors?.length || 0} doctors`);
  })
  .catch(error => {
    console.error('Error connecting to API endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.status, error.response.data);
    }
  });