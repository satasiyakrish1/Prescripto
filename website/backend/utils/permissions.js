export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff'
  };
  
  export const PERMISSIONS = {
    // Dashboard permissions
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ALL_APPOINTMENTS: 'view_all_appointments',
    
    // Doctor management
    ADD_DOCTOR: 'add_doctor',
    VIEW_DOCTORS: 'view_doctors',
    EDIT_DOCTOR: 'edit_doctor',
    DELETE_DOCTOR: 'delete_doctor',
    
    // Staff management
    VIEW_STAFF: 'view_staff',
    MANAGE_STAFF: 'manage_staff',
    
    // Reception
    ACCESS_RECEPTION: 'access_reception',
    
    // Ward management
    MANAGE_WARDS: 'manage_wards',
    
    // Vehicle management
    MANAGE_VEHICLES: 'manage_vehicles',
    
    // Blog management
    MANAGE_BLOGS: 'manage_blogs',
    
    // System admin
    DOWNLOAD_LOGS: 'download_logs',
    VIEW_MARKETING: 'view_marketing',
    MANAGE_ADMIN_PROFILE: 'manage_admin_profile',
    
    // Support
    ACCESS_SUPPORT: 'access_support'
  };
  
  // Role-permission mapping
  export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_ALL_APPOINTMENTS,
      PERMISSIONS.ADD_DOCTOR,
      PERMISSIONS.VIEW_DOCTORS,
      PERMISSIONS.EDIT_DOCTOR,
      PERMISSIONS.DELETE_DOCTOR,
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.MANAGE_STAFF,
      PERMISSIONS.ACCESS_RECEPTION,
      PERMISSIONS.MANAGE_WARDS,
      PERMISSIONS.MANAGE_VEHICLES,
      PERMISSIONS.MANAGE_BLOGS,
      PERMISSIONS.DOWNLOAD_LOGS,
      PERMISSIONS.VIEW_MARKETING,
      PERMISSIONS.MANAGE_ADMIN_PROFILE,
      PERMISSIONS.ACCESS_SUPPORT
    ],
    [ROLES.ADMIN]: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_ALL_APPOINTMENTS,
      PERMISSIONS.ADD_DOCTOR,
      PERMISSIONS.VIEW_DOCTORS,
      PERMISSIONS.EDIT_DOCTOR,
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.ACCESS_RECEPTION,
      PERMISSIONS.MANAGE_WARDS,
      PERMISSIONS.ACCESS_SUPPORT
    ],
    [ROLES.MANAGER]: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_ALL_APPOINTMENTS,
      PERMISSIONS.VIEW_DOCTORS,
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.ACCESS_RECEPTION,
      PERMISSIONS.ACCESS_SUPPORT
    ],
    [ROLES.STAFF]: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.ACCESS_RECEPTION,
      PERMISSIONS.ACCESS_SUPPORT
    ]
  };
  
  // Email-based role mapping (you can also store this in database)
  export const EMAIL_ROLES = {
    'admin@prescripto.com': ROLES.SUPER_ADMIN,
    'manager@prescripto.com': ROLES.ADMIN,
    'staff@prescripto.com': ROLES.MANAGER,
    'reception@prescripto.com': ROLES.STAFF
  };
  
  // 2. Create permission utilities
  // utils/permissionUtils.js
  import { ROLE_PERMISSIONS, EMAIL_ROLES, PERMISSIONS } from './permissions.js';
  
  export const getUserRole = (email) => {
    return EMAIL_ROLES[email] || null;
  };
  
  export const hasPermission = (userEmail, permission) => {
    const role = getUserRole(userEmail);
    if (!role) return false;
    
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  };
  
  export const getUserPermissions = (userEmail) => {
    const role = getUserRole(userEmail);
    if (!role) return [];
    
    return ROLE_PERMISSIONS[role] || [];
  };
  
  // 3. Create a Permission Context
  // context/PermissionContext.js
  import React, { createContext, useContext, useState, useEffect } from 'react';
  import { getUserRole, getUserPermissions, hasPermission } from '../utils/permissionUtils';
  
  const PermissionContext = createContext();
  
  export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
      throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
  };
  
  export const PermissionProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [userEmail, setUserEmail] = useState('');
  
    useEffect(() => {
      // Get user email from your auth context or localStorage
      const email = localStorage.getItem('adminEmail') || '';
      setUserEmail(email);
      
      const role = getUserRole(email);
      const permissions = getUserPermissions(email);
      
      setUserRole(role);
      setUserPermissions(permissions);
    }, []);
  
    const checkPermission = (permission) => {
      return hasPermission(userEmail, permission);
    };
  
    return (
      <PermissionContext.Provider value={{
        userRole,
        userPermissions,
        userEmail,
        checkPermission,
        hasPermission: checkPermission
      }}>
        {children}
      </PermissionContext.Provider>
    );
  };
  
  // 4. Create Protected Route Component
  // components/ProtectedRoute.js (Updated)
  import React from 'react';
  import { Navigate } from 'react-router-dom';
  import { usePermissions } from '../context/PermissionContext';
  
  const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
    const { checkPermission, userRole } = usePermissions();
  
    // If specific permission is required
    if (requiredPermission && !checkPermission(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  
    // If specific role is required
    if (requiredRole && requiredRole !== "any" && userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  
    return children;
  };
  
  export default ProtectedRoute;
  
  // 5. Create Permission-based Component Wrapper
  // components/PermissionWrapper.js
  import React from 'react';
  import { usePermissions } from '../context/PermissionContext';
  
  const PermissionWrapper = ({ permission, fallback = null, children }) => {
    const { checkPermission } = usePermissions();
  
    if (!checkPermission(permission)) {
      return fallback;
    }
  
    return children;
  };
  
  export default PermissionWrapper;
  
  // 6. Updated Sidebar Component (example)
  // components/Sidebar.js
  import React from 'react';
  import { Link } from 'react-router-dom';
  import { usePermissions } from '../context/PermissionContext';
  import { PERMISSIONS } from '../utils/permissions';
  import PermissionWrapper from './PermissionWrapper';
  
  const Sidebar = () => {
    const { userRole, userEmail } = usePermissions();
  
    const menuItems = [
      {
        name: 'Dashboard',
        path: '/admin-dashboard',
        permission: PERMISSIONS.VIEW_DASHBOARD,
        icon: '🏠'
      },
      {
        name: 'All Appointments',
        path: '/all-appointments',
        permission: PERMISSIONS.VIEW_ALL_APPOINTMENTS,
        icon: '📅'
      },
      {
        name: 'Add Doctor',
        path: '/add-doctor',
        permission: PERMISSIONS.ADD_DOCTOR,
        icon: '👨‍⚕️'
      },
      {
        name: 'Doctors List',
        path: '/doctor-list',
        permission: PERMISSIONS.VIEW_DOCTORS,
        icon: '👥'
      },
      {
        name: 'Staff List',
        path: '/staff-list',
        permission: PERMISSIONS.VIEW_STAFF,
        icon: '👷'
      },
      {
        name: 'Reception Desk',
        path: '/reception-desk',
        permission: PERMISSIONS.ACCESS_RECEPTION,
        icon: '🏥'
      },
      {
        name: 'Ward Management',
        path: '/ward-management',
        permission: PERMISSIONS.MANAGE_WARDS,
        icon: '🏨'
      },
      {
        name: 'Vehicle Management',
        path: '/vehicle-management',
        permission: PERMISSIONS.MANAGE_VEHICLES,
        icon: '🚗'
      },
      {
        name: 'Blog Management',
        path: '/blog-management',
        permission: PERMISSIONS.MANAGE_BLOGS,
        icon: '📝'
      },
      {
        name: 'Logs Download',
        path: '/logs-download',
        permission: PERMISSIONS.DOWNLOAD_LOGS,
        icon: '📊'
      },
      {
        name: 'Marketing Analysis',
        path: '/marketing-analysis',
        permission: PERMISSIONS.VIEW_MARKETING,
        icon: '📈'
      },
      {
        name: 'Admin Profile',
        path: '/admin-profile',
        permission: PERMISSIONS.MANAGE_ADMIN_PROFILE,
        icon: '👤'
      },
      {
        name: 'Support',
        path: '/support',
        permission: PERMISSIONS.ACCESS_SUPPORT,
        icon: '💬'
      }
    ];
  
    return (
      <div className="w-64 bg-white shadow-lg h-screen">
        <div className="p-4">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-sm text-gray-600">Role: {userRole}</p>
          <p className="text-xs text-gray-500">{userEmail}</p>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <PermissionWrapper key={item.path} permission={item.permission}>
              <Link
                to={item.path}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </PermissionWrapper>
          ))}
        </nav>
      </div>
    );
  };
  
  export default Sidebar;
  
  // 7. Unauthorized Page Component
  // pages/Unauthorized.js
  import React from 'react';
  import { Link } from 'react-router-dom';
  
  const Unauthorized = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <Link
            to="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  };
  
export default Unauthorized;