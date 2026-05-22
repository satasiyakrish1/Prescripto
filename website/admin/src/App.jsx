import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { PharmacyContext } from './context/PharmacyContext';
import { ViewerContext } from './context/ViewerContext.jsx';
import StaffContextProvider from './context/StaffContext';
import WardContextProvider from './context/WardContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import StaffList from './pages/Admin/StaffList';
import StaffDetails from './pages/Admin/StaffDetails';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorSalesPage from './pages/Doctor/SalesPage';
import PharmacyDashboard from './pages/Pharmacy/PharmacyDashboard';
import PharmacyInventory from './pages/Pharmacy/PharmacyInventory';
import PharmacyProfile from './pages/Pharmacy/PharmacyProfile';
import Analysis from './pages/Pharmacy/Analysis';
import SalesPage from './pages/Pharmacy/SalesPage';
import SalesHistory from './components/SalesHistory';
import VehicleManagement from './pages/Admin/VehicleManagement';
import LogsDownload from './pages/Admin/LogsDownload';
import Support from './pages/Admin/Support';
import SupportManagement from './pages/Admin/SupportManagement';
import ContactUsManagement from './pages/Admin/ContactUsManagement';
import BugReportsManagement from './pages/Admin/BugReportsManagement';
import FeatureRequestsManagement from './pages/Admin/FeatureRequestsManagement';
import GeneralInquiriesManagement from './pages/Admin/GeneralInquiriesManagement';
import BugsManagement from './pages/Admin/BugsManagement';
import FeaturesManagement from './pages/Admin/FeaturesManagement';
import FeedbackManagement from './pages/Admin/FeedbackManagement';
import ProtectedRoute from './components/ProtectedRoute';
import MarketingAnalysis from './pages/Admin/MarketingAnalysis';
import AdminProfile from './pages/Admin/AdminProfile';
import Notifications from './pages/Admin/Notifications';
import TodoList from './pages/Admin/TodoList';
import { SearchProvider } from './context/SearchContext';
import TodoListDoctor from './pages/Doctor/TodoList';
import BookingSettings from './pages/Doctor/BookingSettings';
import EventManagement from './pages/Admin/EventManagement';
import EventParticipants from './pages/Admin/EventParticipants';
import EventAnalytics from './pages/Admin/EventAnalytics';
import BlogManagement from './pages/Admin/BlogManagement';
import AppContextProvider from './context/AppContext';
import Home from './pages/Home';
import WorldClockPage from './pages/WorldClockPage';
import AppointmentDetails from './pages/Admin/AppointmentDetails';
import Coupons from './pages/Admin/Coupons';
import Assets from './pages/Admin/Assets';
import AccessManagement from './pages/Admin/AccessManagement';
import CreateAccessUser from './pages/Admin/CreateAccessUser';
import BedAllocation from './pages/Admin/BedAllocation';

const App = () => {
    const { dToken } = useContext(DoctorContext)
    const { aToken } = useContext(AdminContext)
    const { pToken } = useContext(PharmacyContext)
    const { vToken } = useContext(ViewerContext) || {}

    return dToken || aToken || pToken || vToken ? (
        <LanguageProvider>
            <ThemeProvider>
                <SearchProvider>
                    <WardContextProvider>
                        <StaffContextProvider>
                            <div className='bg-[#F8F9FD] min-h-screen'>
                                <Toaster position="top-right" toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: '#363636',
                                        color: '#fff',
                                    },
                                }} />
                                <Navbar />
                                <div className='flex items-start w-full'>
                                    <Sidebar />
                                    <div className='flex-grow w-full ml-20 md:ml-72'>
                                        <Routes>
                                            {/* Default route for all authenticated users: World Clock */}
                                            <Route path='/' element={<ProtectedRoute requiredRole="any"><WorldClockPage /></ProtectedRoute>} />
                                            {/* Admin Routes */}
                                            <Route path='/admin-dashboard' element={<ProtectedRoute requiredRole="admin" allow="admin-dashboard"><Dashboard /></ProtectedRoute>} />
                                            <Route path='/all-appointments' element={<ProtectedRoute requiredRole="admin" allow="all-appointments"><AllAppointments /></ProtectedRoute>} />
                                            <Route path='/add-doctor' element={<ProtectedRoute requiredRole="admin" allow="add-doctor"><AddDoctor /></ProtectedRoute>} />
                                            <Route path='/doctor-list' element={<ProtectedRoute requiredRole="admin" allow="doctor-list"><DoctorsList /></ProtectedRoute>} />
                                            <Route path='/staff-list' element={<ProtectedRoute requiredRole="admin" allow="staff-list"><StaffList /></ProtectedRoute>} />
                                            <Route path='/staff/:staffId' element={<ProtectedRoute requiredRole="admin" allow="staff-list"><StaffDetails /></ProtectedRoute>} />
                                            <Route path='/vehicle-management' element={<ProtectedRoute requiredRole="admin" allow="vehicle-management"><VehicleManagement /></ProtectedRoute>} />
                                            <Route path='/logs-download' element={<ProtectedRoute requiredRole="admin" allow="logs-download"><LogsDownload /></ProtectedRoute>} />
                                            <Route path='/support' element={<ProtectedRoute requiredRole="admin" allow="support"><Support /></ProtectedRoute>} />
                                            <Route path='/support-management' element={<ProtectedRoute requiredRole="admin" allow="support-management"><SupportManagement /></ProtectedRoute>} />
                                            <Route path='/support/contact-us' element={<ProtectedRoute requiredRole="admin" allow="support"><ContactUsManagement /></ProtectedRoute>} />
                                            <Route path='/support/bug-reports' element={<ProtectedRoute requiredRole="admin" allow="support"><BugReportsManagement /></ProtectedRoute>} />
                                            <Route path='/support/feature-requests' element={<ProtectedRoute requiredRole="admin" allow="support"><FeatureRequestsManagement /></ProtectedRoute>} />
                                            <Route path='/support/general-inquiries' element={<ProtectedRoute requiredRole="admin" allow="support"><GeneralInquiriesManagement /></ProtectedRoute>} />
                                            <Route path='/support/bugs' element={<ProtectedRoute requiredRole="admin" allow="support"><BugsManagement /></ProtectedRoute>} />
                                            <Route path='/support/features' element={<ProtectedRoute requiredRole="admin" allow="support"><FeaturesManagement /></ProtectedRoute>} />
                                            <Route path='/support/feedback' element={<ProtectedRoute requiredRole="admin" allow="support"><FeedbackManagement /></ProtectedRoute>} />
                                            <Route path='/blog-management' element={<ProtectedRoute requiredRole="admin" allow="blog-management"><BlogManagement /></ProtectedRoute>} />
                                            <Route path='/coupons' element={<ProtectedRoute requiredRole="admin" allow="coupons"><Coupons /></ProtectedRoute>} />
                                            <Route path='/assets' element={<ProtectedRoute requiredRole="admin" allow="assets"><Assets /></ProtectedRoute>} />
                                            <Route path='/marketing-analysis' element={<ProtectedRoute requiredRole="admin" allow="marketing-analysis"><MarketingAnalysis /></ProtectedRoute>} />
                                            <Route path='/admin-profile' element={<ProtectedRoute requiredRole="admin"><AdminProfile /></ProtectedRoute>} />
                                            <Route path='/notifications' element={<ProtectedRoute requiredRole="admin" allow="notifications"><Notifications /></ProtectedRoute>} />
                                            <Route path='/todo-list' element={<ProtectedRoute requiredRole="admin" allow="todo-list"><TodoList /></ProtectedRoute>} />
                                            <Route path='/bed-allocation' element={<ProtectedRoute requiredRole="admin" allow="bed-allocation"><BedAllocation /></ProtectedRoute>} />
                                            <Route path='/bed-allocation/ward/:wardId' element={<ProtectedRoute requiredRole="admin" allow="bed-allocation"><BedAllocation /></ProtectedRoute>} />
                                            <Route path='/event-management' element={<ProtectedRoute requiredRole="admin" allow="event-management"><EventManagement /></ProtectedRoute>} />
                                            <Route path='/access-management' element={<ProtectedRoute requiredRole="admin" allow="access-management"><AccessManagement /></ProtectedRoute>} />
                                            <Route path='/access-management/new' element={<ProtectedRoute requiredRole="admin" allow="access-management"><CreateAccessUser /></ProtectedRoute>} />
                                            <Route path='/event-participants/:eventId' element={<ProtectedRoute requiredRole="admin"><EventParticipants /></ProtectedRoute>} />
                                            <Route path='/event-analytics/:eventId' element={<ProtectedRoute requiredRole="admin"><EventAnalytics /></ProtectedRoute>} />
                                            {/* Redirect /event-analytics to /event-management */}
                                            <Route path='/event-analytics' element={<Navigate to="/event-management" replace />} />
                                            <Route path='/appointments/:appointmentId' element={<ProtectedRoute requiredRole="admin" allow="all-appointments"><AppointmentDetails /></ProtectedRoute>} />
                                            {/* Catch-all route for unmatched URLs */}
                                            <Route path='*' element={<Navigate to="/event-management" replace />} />
                                            {/* Doctor Routes */}
                                            <Route path='/doctor-dashboard' element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
                                            <Route path='/doctor-appointments' element={<ProtectedRoute requiredRole="doctor"><DoctorAppointments /></ProtectedRoute>} />
                                            <Route path='/doctor-profile' element={<ProtectedRoute requiredRole="doctor"><DoctorProfile /></ProtectedRoute>} />
                                            <Route path='/booking-settings' element={<ProtectedRoute requiredRole="doctor"><BookingSettings /></ProtectedRoute>} />
                                            <Route path='/doctor/todos' element={<ProtectedRoute requiredRole="doctor"><TodoListDoctor /></ProtectedRoute>} />
                                            <Route path='/doctor/sales' element={<ProtectedRoute requiredRole="doctor"><DoctorSalesPage /></ProtectedRoute>} />
                                            {/* Pharmacy Routes */}
                                            <Route path='/pharmacy-dashboard' element={<ProtectedRoute requiredRole="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
                                            <Route path='/pharmacy/inventory' element={<ProtectedRoute requiredRole="pharmacy"><PharmacyInventory /></ProtectedRoute>} />
                                            <Route path='/pharmacy/sales' element={<ProtectedRoute requiredRole="pharmacy"><SalesPage /></ProtectedRoute>} />
                                            <Route path='/pharmacy/sales-history' element={<ProtectedRoute requiredRole="pharmacy"><SalesHistory /></ProtectedRoute>} />
                                            <Route path='/pharmacy-profile' element={<ProtectedRoute requiredRole="pharmacy"><PharmacyProfile /></ProtectedRoute>} />
                                            <Route path='/pharmacy/analysis' element={<ProtectedRoute requiredRole="pharmacy"><Analysis /></ProtectedRoute>} />
                                        </Routes>
                                    </div>
                                </div>
                            </div>
                        </StaffContextProvider>
                    </WardContextProvider>
                </SearchProvider>
            </ThemeProvider>
        </LanguageProvider>
    ) : (
        <div className='bg-[#F8F9FD] min-h-screen'>
            <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },
            }} />
            <Routes>
                <Route path='*' element={<Login />} />
            </Routes>
        </div>
    );
}

export default App
