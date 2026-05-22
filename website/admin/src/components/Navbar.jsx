import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { PharmacyContext } from '../context/PharmacyContext'
import { ViewerContext } from '../context/ViewerContext.jsx'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSearch } from '../context/SearchContext'
import SettingsModal from './SettingsModal'
import AIAssistantModal from './AIAssistantModal'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import {
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  Bot
} from 'lucide-react'
import AdminNotificationMenu from './AdminNotificationMenu'

const Navbar = () => {
  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const { pToken, setPToken } = useContext(PharmacyContext)
  const { vToken, setVToken, vRole, setVRole } = useContext(ViewerContext) || {}
  const { backendUrl } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()

  // State management with local storage persistence
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [notificationCount] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')
  const [adminProfile, setAdminProfile] = useState(null)
  const { darkMode, toggleDarkMode } = useTheme()
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'english')
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem('notifications')
    return savedNotifications ? JSON.parse(savedNotifications) : {
      email: true,
      app: true,
      updates: false
    }
  })

  const isAdmin = Boolean(aToken || vToken)
  const isDoctor = Boolean(dToken)
  const isPharmacy = Boolean(pToken)

  const userType = isAdmin ? 'Admin' : isDoctor ? 'Doctor' : 'Pharmacy'

  // Navigation links based on user type
  const navLinks = isAdmin ? [
  ]
    : isDoctor ? [

    ]
      : isPharmacy ? [
        { name: 'Dashboard', path: '/pharmacy-dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Inventory', path: '/pharmacy/inventory', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { name: 'Sales', path: '/pharmacy/sales', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Profile', path: '/pharmacy/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
      ]
        : []

  // Fetch admin profile when token is available
  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (isAdmin && aToken && backendUrl) {
        try {
          const response = await axios.get(`${backendUrl}/api/admin/profile`, {
            headers: { aToken }
          })
          if (response.data.success) {
            setAdminProfile(response.data.profile)
          }
        } catch (error) {
          console.error('Error fetching admin profile:', error)
        }
      }
    }
    fetchAdminProfile()
  }, [isAdmin, aToken, backendUrl])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown || showSettings || showAIModal) {
        if (!event.target.closest('.user-dropdown') && !event.target.closest('.settings-panel') && !event.target.closest('.fixed')) {
          if (!showSettings && !showAIModal) {
            setShowDropdown(false)
          }
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown, showSettings, showAIModal])

  // Apply settings effects
  useEffect(() => {
    // Apply font size
    document.body.className = `font-${fontSize}`
    localStorage.setItem('fontSize', fontSize)

    // Save language preference
    localStorage.setItem('language', language)

    // Save notifications settings
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [fontSize, language, notifications])

  const logout = () => {
    localStorage.removeItem('aToken')
    localStorage.removeItem('dToken')
    localStorage.removeItem('pToken')
    localStorage.removeItem('vToken')
    localStorage.removeItem('vRole')
    localStorage.removeItem('tokenExpiry')
    localStorage.removeItem('allowedRoutes')

    setAToken('')
    setDToken('')
    setPToken('')
    if (setVToken) {
      setVToken('')
      if (setVRole) setVRole('')
    }

    setShowDropdown(false)
    setShowSettings(false)
    setShowAIModal(false)
    navigate('/login')
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
    if (showSettings) setShowSettings(false)
  }

  const openSettings = () => {
    setShowSettings(true)
    setShowDropdown(false)
  }

  const handleFontSizeChange = (size) => {
    setFontSize(size)
    document.body.className = `font-${size}`
  }

  const { translate, setCurrentLanguage, availableLanguages } = useLanguage()

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCurrentLanguage(lang)
  }

  const toggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  // Simple local debounce implementation
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced search handler
  const debouncedSearch = debounce((query) => {
    console.log('Searching for:', query)
  }, 300)

  const { searchResults, isSearching, searchError, search, clearSearch } = useSearch()
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim()) {
      search(query, aToken)
      setShowSearchResults(true)
    } else {
      clearSearch()
      setShowSearchResults(false)
    }
  }

  // Add click outside handler for search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  return (
    <>
      <div className={`shadow-md sticky top-0 z-50 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className={`flex justify-between items-center px-4 sm:px-10 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Logo and user type */}
          <div className='flex items-center gap-2 text-xs'>
            <img
              onClick={() => navigate('/')}
              className='w-36 sm:w-40 cursor-pointer transition-transform hover:scale-105'
              src={darkMode ? assets.admin_logo_dark || assets.admin_logo : assets.admin_logo}
              alt="Logo"
            />
            <p className={`border px-2.5 py-0.5 rounded-full ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-500 text-gray-600'
              } font-medium`}>
              {userType}
            </p>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className='hidden md:flex items-center gap-6'>
            {navLinks.map((link) => (
              <div
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 cursor-pointer text-sm font-medium transition-colors ${location.pathname === link.path
                  ? darkMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-primary border-b-2 border-primary'
                  : darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-primary'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                {link.name}
              </div>
            ))}
          </div>

          {/* User actions area */}
          <div className='flex items-center gap-3'>
            {/* Search Bar - Hidden on mobile */}
            <div className='relative search-container hidden md:block'>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <input
                  type='text'
                  placeholder='Search anything...'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                  className={`w-80 pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-96 ${darkMode
                    ? 'bg-gray-800/50 text-gray-200 border border-gray-700 placeholder-gray-400'
                    : 'bg-gray-50 text-gray-900 border border-gray-200 placeholder-gray-500'
                    }`}
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (searchQuery.trim() || isSearching) && (
                <div className={`absolute top-full left-0 mt-1 w-96 rounded-lg shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                  <div className="p-2">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : searchError ? (
                      <div className="text-center py-4 text-gray-500">
                        {searchError}
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => {
                              navigate(result.path)
                              setShowSearchResults(false)
                              setSearchQuery('')
                              clearSearch()
                            }}
                            className={`p-3 hover:bg-gray-100 cursor-pointer rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.icon} />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-medium">{result.title}</h4>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {result.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No results found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>



            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAIModal(true)}
              className={`p-2 rounded-lg transition-all duration-200 ${darkMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              title="Ask AI Assistant"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 107 114"
                className="h-4 w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.1972 15.537L22.9296 -1.66022H32.8908L38.6232 15.537L55.8204 21.2694V31.2306L38.6232 36.963L32.8908 54.1602H22.9296L17.1972 36.963L0 31.2306V21.2694L17.1972 15.537ZM27.9102 16.6019L26.3283 21.3477L23.0079 24.6681L18.2622 26.25L23.0079 27.8319L26.3283 31.1523L27.9102 35.898L29.4921 31.1523L32.8125 27.8319L37.5582 26.25L32.8125 24.6681L29.4921 21.3477L27.9102 16.6019ZM86.1272 31.6972C83.7642 31.5041 80.7072 31.5 76.2101 31.5H69.9101V21H76.4269C80.653 21 84.1409 20.9999 86.9822 21.232C89.9332 21.4731 92.6459 21.9906 95.1939 23.2889C99.1453 25.3022 102.358 28.5148 104.371 32.4662C105.67 35.0142 106.187 37.7269 106.428 40.6779C106.66 43.5192 106.66 47.007 106.66 51.2331V69.5141C106.66 73.7401 106.66 77.2279 106.428 80.0692C106.187 83.0202 105.67 85.7329 104.371 88.2809C102.358 92.2323 99.1453 95.4449 95.1939 97.4582C92.6459 98.7565 89.9332 99.274 86.9822 99.5151C84.1409 99.7472 80.6531 99.7471 76.4271 99.7471H75.3251L63.3965 113.666L55.4237 113.666L43.4952 99.7471H42.3932C38.1671 99.7471 34.6793 99.7472 31.838 99.5151C28.887 99.274 26.1743 98.7565 23.6263 97.4582C19.6749 95.4449 16.4623 92.2323 14.449 88.2809C13.1507 85.7329 12.6332 83.0202 12.3921 80.0692C12.16 77.2279 12.16 73.74 12.1601 69.5139L12.1601 65.6236H22.6601V69.2971C22.6601 73.7941 22.6642 76.8512 22.8573 79.2141C23.0453 81.5158 23.3862 82.6929 23.8045 83.514C24.8112 85.4897 26.4175 87.096 28.3932 88.1026C29.2143 88.521 30.3914 88.8619 32.6931 89.0499C35.056 89.243 38.1131 89.2471 42.6101 89.2471H48.3251L59.4101 102.182L70.4952 89.2471H76.2101C80.7072 89.2471 83.7642 89.243 86.1272 89.0499C88.4288 88.8619 89.6059 88.521 90.427 88.1026C92.4027 87.096 94.009 85.4897 95.0157 83.514C95.434 82.6929 95.7749 81.5158 95.963 79.2141C96.156 76.8512 96.1601 73.7941 96.1601 69.2971V51.45C96.1601 46.953 96.156 43.8959 95.963 41.533C95.7749 39.2313 95.434 38.0542 95.0157 37.2331C94.009 35.2574 92.4027 33.6511 90.427 32.6445C89.6059 32.2261 88.4288 31.8852 86.1272 31.6972Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M52.9824 56.5722L56.4218 46.2539H62.3985L65.838 56.5722L76.1563 60.0116V65.9883L65.838 69.4278L62.3985 79.7461H56.4218L52.9824 69.4278L42.6641 65.9883V60.0116L52.9824 56.5722Z"
                  fill="currentColor"
                />
              </svg>
            </button>


            <AdminNotificationMenu />


            {/* User Profile Dropdown */}
            <div className='relative user-dropdown'>
              <button
                onClick={toggleDropdown}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${showDropdown
                  ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
              >
                {/* Profile Avatar - Show image if available for admin, otherwise show initial */}
                {isAdmin && adminProfile?.image ? (
                  <img
                    src={adminProfile.image}
                    alt="Admin Profile"
                    className="w-9 h-9 rounded-xl object-cover shadow-lg"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-300 ${userType === 'Admin'
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
                    : userType === 'Doctor'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    }`}>
                    {userType[0]}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userType}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Online
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''
                  } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`px-4 py-2 text-sm border-b ${darkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                    Signed in as <span className='font-medium'>{userType}{vToken && ` (${vRole?.charAt(0).toUpperCase() + vRole?.slice(1) || 'Staff'})`}</span>
                  </div>
                  <div
                    onClick={() => {
                      navigate(isAdmin ? '/admin-profile' : '/doctor-profile');
                      setShowDropdown(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </div>
                  <div
                    onClick={openSettings}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </div>
                  <div
                    onClick={() => {
                      navigate('/support');
                      setShowDropdown(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & Support
                  </div>
                </div>
              )}

            </div>

            {/* Mobile menu button - Shown only on mobile */}
            <div className='md:hidden'>
              <button className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-primary'} focus:outline-none`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Logout button - Hidden on mobile */}
            <button
              onClick={logout}
              className={`hidden sm:block text-sm px-8 py-2 rounded-full transition-colors ${darkMode
                ? 'bg-primary-600 text-white hover:bg-blue-700'
                : 'bg-primary text-white hover:bg-opacity-90'
                }`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Shown conditionally */}
        <div className='md:hidden border-b'>
          <div className={`flex overflow-x-auto py-2 px-4 gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {navLinks.map((link) => (
              <div
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1 cursor-pointer text-xs whitespace-nowrap py-1 px-3 rounded-full ${location.pathname === link.path
                  ? darkMode ? 'bg-primary-600 text-white' : 'bg-primary text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                {link.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AIAssistantModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
    </>
  )
}

export default Navbar
