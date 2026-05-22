import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';
import { PharmacyContext } from '../context/PharmacyContext';
import { ViewerContext } from '../context/ViewerContext.jsx';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
  Calendar,
  UserPlus,
  Users,
  Truck,
  CalendarDays,
  FileText,
  User,
  Settings,
  ShoppingCart,
  History,
  Package,
  BarChart3,
  Stethoscope,
  Bed
} from 'lucide-react';

const Sidebar = () => {
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const { pToken } = useContext(PharmacyContext);
  const { darkMode } = useTheme();
  const { vToken } = useContext(ViewerContext) || {};
  let allowed = [];
  try {
    const saved = localStorage.getItem('allowedRoutes');
    if (saved) {
      const parsed = JSON.parse(saved);
      allowed = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Error parsing allowedRoutes:', e);
  }

  const APP_VERSION = "v1.3.0";

  const sidebarBaseClasses = `h-screen fixed top-0 ${darkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'
    } border-r flex flex-col w-20 md:w-72 overflow-hidden pt-20 z-40`;

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 py-3 px-3 md:px-6 whitespace-nowrap cursor-pointer transition-all duration-200 ${isActive
      ? darkMode
        ? 'bg-blue-900/20 border-r-4 border-blue-400 text-blue-400'
        : ' #5f6FFF border-r-4 border-blue-600 text-blue-600'
      : darkMode
        ? 'hover:bg-gray-800 text-gray-300'
        : 'hover:bg-gray-50 text-gray-700'
    }`;

  return (
    <div className={sidebarBaseClasses}>
      <div className="flex-1 overflow-y-auto">
        {/* Admin Navigation (Admin or Access Viewer/Editor) */}
        {(aToken || vToken) && (
          <div className="space-y-1 p-2">
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Admin Panel
            </div>

            {(aToken || allowed.includes('admin-dashboard')) && (
              <NavLink to="/admin-dashboard" className={linkClasses}>
                <Home className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Dashboard</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('all-appointments')) && (
              <NavLink to="/all-appointments" className={linkClasses}>
                <Calendar className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Appointments</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('add-doctor')) && (
              <NavLink to="/add-doctor" className={linkClasses}>
                <UserPlus className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Add Doctor</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('doctor-list')) && (
              <NavLink to="/doctor-list" className={linkClasses}>
                <Stethoscope className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Doctors</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('staff-list')) && (
              <NavLink to="/staff-list" className={linkClasses}>
                <Users className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Staff</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('bed-allocation')) && (
              <NavLink to="/bed-allocation" className={linkClasses}>
                <Bed className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Bed Allocation</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('vehicle-management')) && (
              <NavLink to="/vehicle-management" className={linkClasses}>
                <Truck className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Vehicles</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('event-management')) && (
              <NavLink to="/event-management" className={linkClasses}>
                <CalendarDays className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Events</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('logs-download')) && (
              <NavLink to="/logs-download" className={linkClasses}>
                <FileText className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Server Logs</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('assets')) && (
              <NavLink to="/assets" className={linkClasses}>
                <Package className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Assets</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('coupons')) && (
              <NavLink to="/coupons" className={linkClasses}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 min-w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 7h18M3 17h18M6 7v10M18 7v10M10 10l4 4M14 10l-4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="hidden md:block">Coupons</p>
              </NavLink>
            )}

            {(aToken || allowed.includes('support-management')) && (
              <NavLink to="/support-management" className={linkClasses}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 min-w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="hidden md:block">Support Management</p>
              </NavLink>
            )}
            {(aToken || allowed.includes('access-management')) && (
              <NavLink to="/access-management" className={linkClasses}>
                <Settings className="w-5 h-5 min-w-5" />
                <p className="hidden md:block">Access Management</p>
              </NavLink>
            )}
          </div>
        )}

        {/* Doctor Navigation */}
        {dToken && (
          <div className="space-y-1 p-2">
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Doctor Panel
            </div>

            <NavLink to="/doctor-dashboard" className={linkClasses}>
              <Home className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Dashboard</p>
            </NavLink>

            <NavLink to="/doctor-appointments" className={linkClasses}>
              <Calendar className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Appointments</p>
            </NavLink>

            <NavLink to="/doctor-profile" className={linkClasses}>
              <User className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Profile</p>
            </NavLink>

            <NavLink to="/booking-settings" className={linkClasses}>
              <Settings className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Settings</p>
            </NavLink>
          </div>
        )}

        {/* Pharmacy Navigation */}
        {pToken && (
          <div className="space-y-1 p-2">
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pharmacy Panel
            </div>

            <NavLink to="/pharmacy-dashboard" className={linkClasses}>
              <Home className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Dashboard</p>
            </NavLink>

            <NavLink to="/pharmacy/inventory" className={linkClasses}>
              <Package className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Inventory</p>
            </NavLink>

            <NavLink to="/pharmacy/sales" className={linkClasses}>
              <ShoppingCart className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Sales</p>
            </NavLink>

            <NavLink to="/pharmacy/sales-history" className={linkClasses}>
              <History className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">History</p>
            </NavLink>

            <NavLink to="/pharmacy/analysis" className={linkClasses}>
              <BarChart3 className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Analytics</p>
            </NavLink>

            <NavLink to="/pharmacy-profile" className={linkClasses}>
              <User className="w-5 h-5 min-w-5" />
              <p className="hidden md:block">Profile</p>
            </NavLink>
          </div>
        )}
      </div>

      {/* Version Footer */}
      <div className={`px-3 md:px-6 text-xs text-center w-full py-3 border-t ${darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
        Prescripto {APP_VERSION}
      </div>
    </div>
  );
};

export default Sidebar;
