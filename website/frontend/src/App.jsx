import React, { useState, useEffect, useContext } from 'react';

import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Privacy from './pages/Privacy';
import Features from './pages/Features';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Team from './pages/Team';
import Appointment from './pages/Appointment';
import MyAppointments from './pages/MyAppointments';
import MyProfile from './pages/MyProfile';
import Footer from './components/Footer';
import Community from './pages/Community';
import CreatePost from './pages/CreatePost';
import BMICalculator from './pages/BMICalculator';
import MenstrualPeriodCalculator from './pages/MenstrualPeriodCalculator';
import EyeTest from './pages/EyeTest';
import Verify from './pages/Verify';
import Verification from './pages/Verification';
import ApiMarketplace from './pages/ApiMarketplace';
import Medicines from './pages/Medicines';
import MedicineDetails from './pages/MedicineDetails';
import Cosmetics from './pages/Cosmetics';
import CosmeticDetails from './pages/CosmeticDetails';
import SkinAnalysis from './pages/SkinAnalysis';
import NotFound from './pages/NotFound';
import GoogleFitDashboard from './pages/GoogleFitDashboard';
import FitnessAnalysis from './pages/FitnessAnalysis';
import Terms from './pages/Terms';
import ConnectionTroubleshooter from './components/ConnectionTroubleshooter';
import LoadingScreen from './components/LoadingScreen';
import { AppContext } from './context/AppContext';
import Donation from './pages/Donation';
import WritePrescription from './pages/WritePrescription';
import Testimonials from './pages/Testimonials';
import ProtectedRoute from './components/ProtectedRoute';
import MedicalDataDashboard from './pages/MedicalDataDashboard';
import SiteMap from './pages/SiteMap';
import Notifications from './pages/Notifications';

// New calculator pages
import PaceCalculator from './pages/PaceCalculator';
import BACCalculator from './pages/BACCalculator';
import BMRCalculator from './pages/BMRCalculator';

// Events pages
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

// FAQ page
import Faq from './pages/Faq';

// Blog pages
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';

// Family page
import FamilyList from './pages/FamilyList';
import TodoList from './pages/TodoList';
import TestPayment from './pages/TestPayment';
import AppointmentScan from './pages/AppointmentScan';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { doctors, theme } = useContext(AppContext);
  const location = useLocation();

  // Check if current page is login
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <>

      <div className={isLoginPage ? '' : 'mx-4 sm:mx-[10%]'}>
      <LoadingScreen isLoading={isLoading} />
      {!isLoginPage && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/features' element={<Features />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/team' element={<Team />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/faq' element={<Faq />} />
        <Route path='/medicines' element={<Medicines />} />
        <Route path='/medicines/:id' element={<MedicineDetails />} />
        <Route path='/cosmetics' element={<Cosmetics />} />
        <Route path='/cosmetics/:id' element={<CosmeticDetails />} />
        <Route path='/skin-analysis' element={<SkinAnalysis />} />
        <Route path='/bmi-calculator' element={<BMICalculator />} />
        <Route path='/menstrual-period-calculator' element={<MenstrualPeriodCalculator />} />
        <Route path='/eye-test' element={<EyeTest />} />
        <Route path='/todo-list' element={<TodoList />} />
        <Route path='/sitemap' element={<SiteMap />} />
        <Route path='/events' element={<Events />} />
        <Route path='/events/:id' element={<EventDetail />} />
        <Route path='/blogs' element={<Blogs />} />
        <Route path='/blog/:id' element={<BlogDetail />} />
        <Route path='/appointment-scan/:id' element={<AppointmentScan />} />

        {/* New Calculators */}
        <Route path='/pace-calculator' element={<PaceCalculator />} />
        <Route path='/bac-calculator' element={<BACCalculator />} />
        <Route path='/bmr-calculator' element={<BMRCalculator />} />

        {/* Test Payment Page */}
        <Route path='/test-payment' element={<TestPayment />} />

        <Route path='/Community' element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path='/medical-data-dashboard' element={<ProtectedRoute><MedicalDataDashboard /></ProtectedRoute>} />

        {/* Protected Routes */}
        <Route path='/appointment/:docId' element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
        <Route path='/my-appointments' element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path='/my-profile' element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
        <Route path='/notifications' element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path='/family' element={<ProtectedRoute><FamilyList /></ProtectedRoute>} />
        <Route path='/verification' element={<ProtectedRoute><Verification /></ProtectedRoute>} />
        <Route path='/api-marketplace' element={<ProtectedRoute><ApiMarketplace /></ProtectedRoute>} />
        <Route path='/google-fit' element={<ProtectedRoute><GoogleFitDashboard /></ProtectedRoute>} />
        <Route path='/fitness-analysis' element={<ProtectedRoute><FitnessAnalysis /></ProtectedRoute>} />
        <Route path='/donation' element={<ProtectedRoute><Donation /></ProtectedRoute>} />
        <Route path='/write-prescription' element={<ProtectedRoute><WritePrescription /></ProtectedRoute>} />
        <Route path='/testimonials' element={<ProtectedRoute><Testimonials /></ProtectedRoute>} />
        <Route path='/testimonials/:doctorId' element={<ProtectedRoute><Testimonials /></ProtectedRoute>} />

        {/* Not Found */}
        <Route path='*' element={<NotFound />} />
      </Routes>

      {!isLoginPage && <Footer />}
      <ConnectionTroubleshooter />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
    </>
  );
};

export default App;
