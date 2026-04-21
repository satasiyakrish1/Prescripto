import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { PharmacyContext } from '../context/PharmacyContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiBriefcase, FiBox } from 'react-icons/fi';
import Lottie from 'react-lottie';
import hashtagAnimation from '../assets/People surfing on social networks on hashtag.json';

const roleIcons = {
  Admin: <FiBriefcase className="inline w-7 h-7 text-blue-600 mb-1 mr-2" />,
  Doctor: <FiUser className="inline w-7 h-7 text-green-600 mb-1 mr-2" />,
  Pharmacy: <FiBox className="inline w-7 h-7 text-purple-600 mb-1 mr-2" />,
};

const Home = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);
  const { pToken } = useContext(PharmacyContext);
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let userRole = '';
  if (aToken) userRole = 'Admin';
  if (dToken) userRole = 'Doctor';
  if (pToken) userRole = 'Pharmacy';

  const lottieOptions = {
    loop: true,
    autoplay: true,
    animationData: hashtagAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet'
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      { text: "Every moment is a fresh beginning", author: "T.S. Eliot" },
      { text: "The future belongs to those who believe", author: "Eleanor Roosevelt" },
      { text: "Progress, not perfection", author: "Unknown" },
      { text: "Small steps lead to big changes", author: "Unknown" },
      { text: "Believe you can and you're halfway there", author: "Theodore Roosevelt" }
    ];
    const index = Math.floor(currentTime.getDate() % quotes.length);
    return quotes[index];
  };

  const quote = getMotivationalQuote();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 overflow-hidden">
      {/* Animated grid dot pattern background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-1000"
        style={{
          backgroundImage: 'radial-gradient(circle, #9ca3af 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-gray-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-24 h-24 border border-gray-200 rotate-45 opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/3 right-10 w-20 h-20 border border-gray-200 opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>

      {/* Top bar with date and time */}
      <div className={`absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-4 border-b border-gray-100 backdrop-blur-sm bg-white/50 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-light text-gray-500 tracking-wider uppercase">
            {userRole ? `${userRole} Portal` : 'Dashboard'}
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xs font-light text-gray-400 tracking-wider uppercase">
              {formatDate(currentTime)}
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-gray-700 tracking-wider">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`w-full max-w-3xl flex flex-col items-center justify-center z-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Greeting with creative typography */}
        <div className="mb-4 text-center">
          <div className="inline-block relative">
            <h1 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-2 tracking-tighter">
              {getGreeting()}
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
          {userRole && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              {roleIcons[userRole]}
              <span className="text-base font-light text-gray-600 tracking-wide">
                Welcome back, <span className="font-normal text-gray-800">{userRole}</span>
              </span>
            </div>
          )}
        </div>

        {/* Lottie Animation Container */}
        <div className="w-full max-w-md mx-auto my-8">
          <div className="relative w-full" style={{paddingBottom: '70%'}}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lottie 
                options={lottieOptions} 
                style={{width: '100%', height: '100%', maxWidth: '380px', maxHeight: '320px'}} 
              />
            </div>
          </div>
        </div>
        
        {/* Quote of the day */}
        <div className="max-w-2xl mx-auto text-center mb-8 px-6 py-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
          <div className="text-xs font-light text-gray-400 tracking-widest uppercase mb-3">
            Daily Inspiration
          </div>
          <p className="text-lg md:text-xl font-light text-gray-700 italic mb-3 leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-xs font-light text-gray-500 tracking-wider">
            — {quote.author}
          </p>
        </div>

        {/* Tagline with creative styling */}
        <div className="flex items-center space-x-4 text-gray-400">
          <div className="w-12 h-px bg-gray-300"></div>
          <p className="text-xs tracking-widest uppercase font-extralight">
            Stay Connected · Stay Inspired
          </p>
          <div className="w-12 h-px bg-gray-300"></div>
        </div>
      </div>

      {/* Bottom decorative element */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default Home;