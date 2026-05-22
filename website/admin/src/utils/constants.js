// API Configuration
export const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Authentication Token Keys
export const AUTH_TOKEN_KEY = 'auth_token';
export const DOCTOR_TOKEN_KEY = 'dToken';
export const ADMIN_TOKEN_KEY = 'aToken';

// API Endpoints
export const ENDPOINTS = {
    // Admin endpoints
    ADMIN_LOGIN: '/api/admin/login',
    ADMIN_VERIFY: '/api/admin/verify',
    
    // Doctor endpoints
    DOCTOR_LOGIN: '/api/doctor/login',
    DOCTOR_VERIFY: '/api/doctor/verify',
    
    // Staff endpoints
    STAFF_LIST: '/api/admin/staff/all',
    STAFF_ADD: '/api/admin/staff/add',
    STAFF_UPDATE: '/api/admin/staff/update',
    STAFF_DELETE: '/api/admin/staff/delete'
};

// Status Codes
export const STATUS = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
};
