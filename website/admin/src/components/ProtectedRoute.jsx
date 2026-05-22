import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { PharmacyContext } from '../context/PharmacyContext';
import { ViewerContext } from '../context/ViewerContext';

const ProtectedRoute = ({ requiredRole = 'any', allow, children }) => {
    const { aToken } = useContext(AdminContext);
    const { dToken } = useContext(DoctorContext);
    const { pToken } = useContext(PharmacyContext);
    const { vToken } = useContext(ViewerContext) || {};

    const isAuthenticated = () => {
        switch (requiredRole) {
            case 'admin':
                return !!(aToken || vToken);
            case 'doctor':
                return !!dToken;
            case 'pharmacy':
                return !!pToken;
            case 'any':
                return !!(aToken || dToken || pToken || vToken);
            default:
                return false;
        }
    };

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // If viewer/editor token is used for admin area, enforce allowedRoutes
    if (requiredRole === 'admin' && !aToken && vToken) {
        try {
            const stored = localStorage.getItem('allowedRoutes');
            if (!stored) {
                // No granular permissions stored; allow by default for legacy viewer
                return children;
            }
            const allowed = JSON.parse(stored || '[]');
            if (Array.isArray(allowed) && allow) {
                if (!allowed.includes(allow)) {
                    const fallback = allowed.length ? allowed[0] : '/';
                    return <Navigate to={`/${allowToPath(fallback)}`} replace />;
                }
            }
        } catch {
            // If parsing fails, deny and go home
            return <Navigate to="/" replace />;
        }
    }

    if (requiredRole === 'doctor' && !dToken) {
        return <Navigate to={aToken ? "/admin-dashboard" : pToken ? "/pharmacy-dashboard" : "/login"} replace />;
    }

    if (requiredRole === 'pharmacy' && !pToken) {
        return <Navigate to={aToken ? "/admin-dashboard" : dToken ? "/doctor-dashboard" : "/login"} replace />;
    }

    return children;
};

const allowToPath = (key) => {
    const map = {
        'admin-dashboard': 'admin-dashboard',
        'all-appointments': 'all-appointments',
        'add-doctor': 'add-doctor',
        'doctor-list': 'doctor-list',
        'staff-list': 'staff-list',
        'bed-allocation': 'bed-allocation',
        'vehicle-management': 'vehicle-management',
        'event-management': 'event-management',
        'marketing-analysis': 'marketing-analysis',
        'notifications': 'notifications',
        'todo-list': 'todo-list',
        'blog-management': 'blog-management',
        'assets': 'assets',
        'coupons': 'coupons',
        'support': 'support',
        'support-management': 'support-management',
        'logs-download': 'logs-download',
        'access-management': 'access-management'
    };
    return map[key] || '';
}

export default ProtectedRoute;
