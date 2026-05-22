/**
 * Connection Helper Utility for Admin Application
 * 
 * This utility provides functions to help manage connections between the admin frontend
 * and backend, with features for handling connection issues, retries, and environment detection.
 */

import axios from 'axios';

/**
 * Determines the appropriate backend URL based on the current environment
 * @returns {string} - The backend URL to use
 */
export const getBackendUrl = () => {
  // Check if we're in a production environment
  const isProduction = import.meta.env.PROD;
  
  // Always use the configured backend URL from environment variables
  const configuredUrl = import.meta.env.VITE_BACKEND_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  
  // Fallback only if environment variable is not set
  return isProduction ? 'http://localhost:5000' : 'http://localhost:5000'
};

/**
 * Creates an axios instance with retry capability
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} - Axios instance with retry capability
 */
export const createAxiosWithRetry = (maxRetries = 2, timeout = 10000) => {
  const instance = axios.create({
    baseURL: getBackendUrl(),
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor for retry logic
  instance.interceptors.response.use(null, async (error) => {
    const config = error.config;
    
    // Set retry count if not set
    if (!config || !config.retry) {
      config.retry = 0;
    }

    // Check if we should retry
    if (config.retry < maxRetries && (!error.response || error.response.status >= 500)) {
      // Increase retry count
      config.retry += 1;
      
      // Create new promise to handle retry
      const delayRetry = new Promise(resolve => {
        setTimeout(() => {
          console.log(`Retrying request (${config.retry}/${maxRetries})...`);
          resolve();
        }, 1000 * config.retry); // Exponential backoff
      });
      
      // Wait for delay and retry request
      await delayRetry;
      return instance(config);
    }
    
    // If we've run out of retries, reject
    return Promise.reject(error);
  });

  return instance;
};

/**
 * Tests the connection to the backend server
 * @param {string} customBackendUrl - Optional custom URL to test (overrides default)
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} - Connection test results
 */
export const testBackendConnection = async (customBackendUrl, timeout = 10000) => {
  const backendUrl = customBackendUrl || getBackendUrl();
  const results = {
    success: false,
    endpoints: {},
    error: null
  };

  try {
    // Test health endpoint
    try {
      const healthResponse = await axios.get(`${backendUrl}/health`, { timeout });
      results.endpoints.health = {
        success: true,
        status: healthResponse.status,
        data: healthResponse.data
      };
    } catch (error) {
      results.endpoints.health = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    // Test API endpoint
    try {
      const apiResponse = await axios.get(`${backendUrl}/api/admin/dashboard`, { timeout });
      results.endpoints.api = {
        success: true,
        status: apiResponse.status,
        data: apiResponse.data.success
      };
    } catch (error) {
      results.endpoints.api = {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    // Overall success if at least one endpoint is successful
    results.success = Object.values(results.endpoints).some(endpoint => endpoint.success);
    
    return results;
  } catch (error) {
    results.error = error.message;
    return results;
  }
};

// Create a default axios instance with retry for use throughout the app
export const api = createAxiosWithRetry();

// Export a function to add auth token to requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};