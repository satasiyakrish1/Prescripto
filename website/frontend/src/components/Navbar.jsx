import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { Menu, X, User, Calendar, Bell, LogOut, ShieldCheck, ChevronDown, Sun, Moon } from 'lucide-react'
import NotificationMenu from './NotificationMenu'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { token, setToken, userData, theme, toggleTheme } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMenu])

  const navLinks = [
    { to: '/', label: 'HOME' },
    { to: '/doctors', label: 'DOCTORS' },
    { to: '/medicines', label: 'MEDICINES' },
    { to: '/cosmetics', label: 'COSMETICS' },
    { to: '/blogs', label: 'BLOG' },
    { to: '/about', label: 'ABOUT' },
    { to: '/contact', label: 'CONTACT' },
    { to: '/donation', label: 'DONATE' },
    { to: '/events', label: 'EVENTS' },
  ]

  return (
    <nav className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-all duration-300 ${isScrolled ? 'shadow-md dark:shadow-gray-900/20' : 'border-b border-gray-200 dark:border-gray-700'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              onClick={() => navigate('/')}
              className="h-7 md:h-8 w-auto cursor-pointer transition-transform hover:scale-105 dark:brightness-0 dark:invert"
              src={assets.logo}
              alt="Prescripto Logo"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isActive
                    ? 'text-primary bg-primary/5 dark:bg-primary/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://prescripto-appointmentbooking.onrender.com/"
              className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Admin Panel
            </a>
          </div>

          {/* Right Side - User Profile / Login */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {token && userData && <NotificationMenu />}

            {token && userData ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="relative">
                    <img
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      src={userData.image}
                      alt="Profile"
                    />
                    {userData.isVerified && (
                      <img
                        className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 bg-white rounded-full"
                        src={assets.verified_icon}
                        alt="Verified"
                        title={`Verified ${userData.verifiedPlan} Plan`}
                      />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 hidden md:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userData.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userData.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate('/my-profile')
                            setShowProfileMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/my-appointments')
                            setShowProfileMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          My Appointments
                        </button>
                        {!userData.isVerified && (
                          <button
                            onClick={() => {
                              navigate('/verification')
                              setShowProfileMenu(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary dark:text-primary-400 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Get Verified
                          </button>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                        <button
                          onClick={() => {
                            logout()
                            setShowProfileMenu(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:block bg-primary text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Create account
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 z-50 ${showMenu ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          onClick={() => setShowMenu(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showMenu ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Slide-out Menu */}
        <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-out ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <img src={assets.logo} className="h-8 w-auto dark:brightness-0 dark:invert" alt="Prescripto" />
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* User Info (Mobile) */}
          {token && userData && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                    src={userData.image}
                    alt="Profile"
                  />
                  {userData.isVerified && (
                    <img
                      className="w-4 h-4 absolute -bottom-0.5 -right-0.5 bg-white rounded-full"
                      src={assets.verified_icon}
                      alt="Verified"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userData.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userData.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="overflow-y-auto h-[calc(100vh-180px)] px-4 py-4">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMenu(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                      ? 'text-primary bg-primary/10 dark:bg-primary/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {/* User Menu Items (Mobile) */}
              {token && userData && (
                <>
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                  <NavLink
                    to="/my-profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/my-appointments"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    My Appointments
                  </NavLink>
                  {!userData.isVerified && (
                    <NavLink
                      to="/verification"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      Get Verified
                    </NavLink>
                  )}
                </>
              )}

              {/* Admin Panel Link */}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://prescripto-appointmentbooking.onrender.com/"
                className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-center mt-4"
              >
                Admin Panel
              </a>
            </nav>
          </div>

          {/* Bottom Action */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {token && userData ? (
              <button
                onClick={() => {
                  logout()
                  setShowMenu(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/login')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm"
              >
                Create account
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar