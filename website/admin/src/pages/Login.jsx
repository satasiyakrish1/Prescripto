import { useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { PharmacyContext } from '../context/PharmacyContext'
import { ViewerContext } from '../context/ViewerContext.jsx'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle, X, Mail } from 'lucide-react'
import logo from '../assets/logo.svg'
import { API_URL } from '../utils/constants'

const Login = () => {
  const navigate = useNavigate()
  const [role, setRole] = useState('Admin') // Options: 'Admin', 'Doctor', 'Pharmacy', 'Viewer'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  const backendUrl = API_URL

  // Background images for the slider
  const backgroundImages = [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ]

  const { setDToken } = useContext(DoctorContext);
  const { setAToken } = useContext(AdminContext);
  const { setPToken } = useContext(PharmacyContext);
  const { setVToken } = useContext(ViewerContext);

  useEffect(() => {
    const aToken = localStorage.getItem('aToken');
    const dToken = localStorage.getItem('dToken');
    const pToken = localStorage.getItem('pToken');

    if (aToken) {
      navigate('/');
    } else if (dToken) {
      navigate('/doctor-dashboard');
    } else if (pToken) {
      navigate('/pharmacy-dashboard');
    } else if (localStorage.getItem('vToken')) {
      navigate('/');
    }
  }, [navigate]); // Run only once on mount or when navigate changes

  // Image slider effect - change image every 5 seconds
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change every 5 seconds

    return () => clearInterval(imageInterval)
  }, [backgroundImages.length])

  const attemptKey = (r, e) => {
    const rr = String(r || '').toLowerCase()
    const ee = String(e || '').toLowerCase().trim()
    return `${rr}::${ee}`
  }

  // Check if account is locked for current role/email
  useEffect(() => {
    const key = attemptKey(role, email)
    const storedLockTime = localStorage.getItem(`accountLockTime::${key}`)
    if (storedLockTime) {
      const lockTime = parseInt(storedLockTime)
      const currentTime = new Date().getTime()
      const remainingTime = Math.ceil((lockTime - currentTime) / 1000)

      if (remainingTime > 0) {
        setIsLocked(true)
        setLockTimer(remainingTime)
        startCountdown(remainingTime)
      } else {
        localStorage.removeItem(`accountLockTime::${key}`)
        localStorage.removeItem(`loginAttempts::${key}`)
      }
    }

    const storedAttempts = localStorage.getItem(`loginAttempts::${key}`)
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts))
    }
  }, [role, email])

  // Start countdown timer when account is locked
  const startCountdown = (seconds) => {
    let timeLeft = seconds
    const countdownInterval = setInterval(() => {
      timeLeft -= 1
      setLockTimer(timeLeft)

      if (timeLeft <= 0) {
        clearInterval(countdownInterval)
        setIsLocked(false)
        setLoginAttempts(0)
        const key = attemptKey(role, email)
        localStorage.removeItem(`accountLockTime::${key}`)
        localStorage.removeItem(`loginAttempts::${key}`)
      }
    }, 1000)
  }

  const handleRoleSwitch = (newRole) => {
    setRole(newRole)
    setEmail('')
    setPassword('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handleGoogleLogin = () => {
    toast.error("Google Sign-In service is currently denied. Please use email/password login.")
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    setShowForgotPasswordModal(true)
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    // Prevent submission if account is locked
    if (isLocked) return

    setIsLoading(true)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    try {
      let data;
      // Viewer uses access-user login with permissions
      if (role === 'Viewer') {
        const resp = await axios.post(backendUrl + '/api/access/login', {
          email,
          password,
          timestamp: new Date().getTime()
        }, {
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        });
        data = resp.data;
      } else {
        let endpoint = '/api/admin/login';
        if (role === 'Doctor') endpoint = '/api/doctor/login';
        if (role === 'Pharmacy') endpoint = '/api/pharmacy/login';
        const resp = await axios.post(backendUrl + endpoint, {
          email,
          password,
          timestamp: new Date().getTime()
        }, {
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
          }
        });
        data = resp.data;
      }

      if (data.success) {
        // Reset login attempts on successful login
        setLoginAttempts(0)
        localStorage.removeItem(`loginAttempts::${attemptKey(role, email)}`)
        localStorage.removeItem(`accountLockTime::${attemptKey(role, email)}`)

        const tokenExpiry = new Date().getTime() + (3600 * 1000); // 1 hour expiry
        if (role === 'Admin') {
          setAToken(data.token);
          localStorage.setItem('aToken', data.token);
          localStorage.setItem('tokenExpiry', tokenExpiry);
          navigate('/');
        } else if (role === 'Doctor') {
          setDToken(data.token);
          localStorage.setItem('dToken', data.token);
          localStorage.setItem('tokenExpiry', tokenExpiry);
          navigate('/doctor-dashboard');
        } else if (role === 'Pharmacy') {
          setPToken(data.token);
          localStorage.setItem('pToken', data.token);
          localStorage.setItem('tokenExpiry', tokenExpiry);
          navigate('/pharmacy-dashboard');
        } else if (role === 'Viewer') {
          setVToken(data.token);
          localStorage.setItem('vToken', data.token);
          localStorage.setItem('vRole', data.role || 'viewer');
          localStorage.setItem('tokenExpiry', tokenExpiry);
          if (Array.isArray(data.allowedRoutes)) {
            localStorage.setItem('allowedRoutes', JSON.stringify(data.allowedRoutes));
            const first = data.allowedRoutes[0] || 'admin-dashboard';
            const mapping = {
              'admin-dashboard': '/admin-dashboard',
              'all-appointments': '/all-appointments',
              'add-doctor': '/add-doctor',
              'doctor-list': '/doctor-list',
              'staff-list': '/staff-list',
              'bed-allocation': '/bed-allocation',
              'vehicle-management': '/vehicle-management',
              'event-management': '/event-management',
              'marketing-analysis': '/marketing-analysis',
              'notifications': '/notifications',
              'todo-list': '/todo-list',
              'blog-management': '/blog-management',
              'assets': '/assets',
              'coupons': '/coupons',
              'support': '/support',
              'support-management': '/support-management',
              'logs-download': '/logs-download',
              'access-management': '/access-management'
            };
            const path = mapping[first] || '/admin-dashboard';
            navigate(path);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
        toast.success(`Welcome back! Last login: ${data.lastLogin || 'First login'}`)
      } else {
        handleFailedLogin()
        toast.error(data.message)
      }
    } catch (error) {
      handleFailedLogin()
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1
    setLoginAttempts(newAttempts)
    const key = attemptKey(role, email)
    localStorage.setItem(`loginAttempts::${key}`, newAttempts)

    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      setIsLocked(true)

      // Lock for 15 minutes
      const lockDuration = 15 * 60
      const lockUntil = new Date().getTime() + (lockDuration * 1000)

      localStorage.setItem(`accountLockTime::${key}`, lockUntil.toString())
      setLockTimer(lockDuration)
      startCountdown(lockDuration)

      toast.error(`Account locked for 15 minutes due to multiple failed login attempts`)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left side - Scenic Background Image Slider */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Background Images */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              backgroundImage: `url(${image})`
            }}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>

        {/* Slider Indicators */}
        <div className="absolute bottom-6 left-6 flex space-x-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/75'
                }`}
            />
          ))}
        </div>

        {/* Photo Credit */}
        <div className="absolute bottom-6 right-6 text-white text-xs">
          <p className="opacity-75">Photo by Unsplash</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-md px-6 py-8">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Prescripto" className="h-8 w-auto object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Nice to see you again</h2>
            <p className="text-gray-600 text-sm">Welcome back to Prescripto Platform</p>
          </div>

          {/* Role Selection */}
          <div className="mb-4">

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleRoleSwitch('Admin')}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${role === 'Admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('Doctor')}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${role === 'Doctor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('Pharmacy')}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${role === 'Pharmacy'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Pharmacy
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('Viewer')}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${role === 'Viewer'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Viewer
              </button>
            </div>
          </div>

          {/* Login Attempt Warning */}
          {loginAttempts > 0 && !isLocked && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                <span className="text-amber-700">
                  {`Failed attempts: ${loginAttempts}/5. Account will be temporarily locked after 5 failed attempts.`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const key = `${String(role).toLowerCase()}::${String(email).toLowerCase().trim()}`
                  localStorage.removeItem(`loginAttempts::${key}`)
                  localStorage.removeItem(`accountLockTime::${key}`)
                  setLoginAttempts(0)
                  setIsLocked(false)
                }}
                className="ml-3 px-2 py-1 border border-amber-300 rounded text-amber-700 hover:bg-amber-100"
              >
                Reset
              </button>
            </div>
          )}

          {/* Account Locked Message */}
          {isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm">
              <Lock className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              <div className="text-red-700">
                <p className="font-medium">Account temporarily locked</p>
                <p>Please try again in {Math.floor(lockTimer / 60)}:{(lockTimer % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmitHandler} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email or phone number
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLocked}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500 text-sm"
                placeholder="Email or phone number"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isLocked}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLocked}
                >
                  {showPassword ?
                    <EyeOff className="w-4 h-4" /> :
                    <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLocked}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${rememberMe ? 'bg-primary-600' : 'bg-gray-300'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${rememberMe ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                  </div>
                  <span className="ml-3 text-sm text-gray-700">Remember me</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className={`w-full py-2.5 px-4 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all text-sm ${isLocked || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-blue-700"
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>


          </form>





        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4"
          onClick={closeForgotPasswordModal}
        >
          <div
            className="bg-white w-full max-w-xs rounded-3xl p-7 shadow-[0_32px_64px_rgba(0,0,0,0.18)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <div className="flex justify-end mb-4">
              <button
                onClick={closeForgotPasswordModal}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>

            {/* Text */}
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Forgot password?</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Reach out to our team and we'll help you get back in.
            </p>

            {/* Email row */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm font-semibold text-gray-800">admin@prescripto.com</span>
            </div>

            {/* CTA */}
            <button
              onClick={() => window.open('mailto:admin@prescripto.com?subject=Password Reset Request&body=Hello, I need help resetting my password for my Prescripto account.')}
              className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.98] text-white text-sm font-semibold rounded-2xl transition-all"
            >
              Open Mail App
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
