import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'
import CustomCaptcha from '../components/CustomCaptcha'
import { assets } from '../assets/assets'

const Login = () => {
  const [state, setState] = useState('Sign Up')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [tempUserId, setTempUserId] = useState(null)

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  // Background images for the slider
  const backgroundImages = [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1274&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1274&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1274&auto=format&fit=crop'
  ]

  // Image slider effect
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)
    return () => clearInterval(imageInterval)
  }, [backgroundImages.length])

  const generateCustomToken = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `custom_captcha_${timestamp}_${randomString}`;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!captchaVerified) {
      toast.error('Please complete the security verification');
      return;
    }
    try {
      const requestData = { name, email, password, recaptchaToken: captchaToken || generateCustomToken() };
      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/user/register', requestData);
        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          toast.success('Account created successfully!');
        } else {
          toast.error(data.message);
          resetCaptcha();
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password, recaptchaToken: captchaToken || generateCustomToken() });

        if (data.twoFactorRequired) {
          setShow2FA(true);
          setTempUserId(data.userId);
          toast.info('Two-Factor Authentication required');
          return;
        }

        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          toast.success('Logged in successfully!');
        } else {
          toast.error(data.message);
          resetCaptcha();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
      resetCaptcha();
    }
  }

  const resetCaptcha = () => {
    setCaptchaVerified(false);
    setCaptchaToken('');
  }

  const handleCaptchaVerify = (token) => {
    setCaptchaVerified(true);
    setCaptchaToken(token);
  }

  const handleCaptchaError = (error) => {
    toast.warning(error || 'Please try the security verification again');
    setCaptchaVerified(false);
    setCaptchaToken('');
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const status = urlParams.get('status');
    const error = urlParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, '', '/login');
    } else if (status === 'success' && tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      setToken(tokenFromUrl);
      toast.success('Successfully logged in with Google!');
      window.history.replaceState({}, '', '/login');
    }
  }, [setToken]);

  useEffect(() => {
    if (token) navigate('/')
  }, [token, navigate])

  useEffect(() => {
    resetCaptcha();
  }, [state]);

  const handleGoogleLogin = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/google-login/auth-url`);
      if (data && data.authUrl && typeof data.authUrl === 'string') {
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to get Google authorization URL. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to connect to Google. Please check your connection and try again.');
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/user/verify-2fa-login', {
        userId: tempUserId,
        token: twoFACode
      });

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        toast.success('Logged in successfully!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to verify 2FA code');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Go Home Button - Fixed Position Top Right */}
      {/* Go Home Button - Fixed Position Top Right */}
      <Link
        to="/"
        className="fixed top-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-semibold">Back to Home</span>
      </Link>

      {/* Left side - Scenic Background Image Slider - FIXED HEIGHT */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden h-screen">
        {/* Background Images */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white z-10">
          {/* Top Section - Logo & Branding */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <img src={assets.logo} alt="Prescripto" className="w-8 h-8 object-contain filter brightness-0 invert" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Prescripto</h1>
                <p className="text-sm text-white/80">Healthcare Made Simple</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="max-w-lg mt-16">
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Welcome to Your<br />
                Healthcare Journey
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Connect with top medical professionals, manage appointments, and take control of your health—all in one secure platform.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant Booking
                </span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure Records
                </span>
              </div>
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Stats & Controls */}
          <div>
            {/* Stats */}
            <div className="flex items-center gap-8 mb-6">
              <div>
                <div className="text-4xl font-bold mb-1">50K+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div>
                <div className="text-4xl font-bold mb-1">1,000+</div>
                <div className="text-sm text-white/70">Expert Doctors</div>
              </div>
              <div className="w-px h-12 bg-white/30"></div>
              <div>
                <div className="text-4xl font-bold mb-1 flex items-center gap-1">
                  4.9
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="text-sm text-white/70">User Rating</div>
              </div>
            </div>

            {/* Slider Indicators & Credit */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {backgroundImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                      }`}
                  />
                ))}
              </div>
              <div className="text-xs text-white/60">
                Photo by Unsplash
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form - SCROLLABLE */}
      <div className="w-full lg:w-2/5 bg-white dark:bg-gray-950 overflow-y-auto h-screen">
        <div className="flex items-center justify-center min-h-screen py-8">
          <div className="w-full max-w-md px-6">
            {/* Logo and Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <img src={assets.logo} alt="Prescripto" className="w-10 h-10 object-contain filter brightness-0 invert" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Nice to see you again</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Welcome back to Prescripto Platform</p>
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setState('Login')}
                  className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${state === 'Login' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setState('Sign Up')}
                  className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${state === 'Sign Up' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            {show2FA ? (
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600">Enter the code from your authenticator app</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm text-center tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all text-sm"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setTempUserId(null);
                    setTwoFACode('');
                  }}
                  className="w-full py-2.5 px-4 text-gray-600 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={onSubmitHandler} className="space-y-4">
                {/* Name Input - Only for Sign Up */}
                {state === 'Sign Up' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email or phone number
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    placeholder="Email or phone number"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Captcha */}
                <div>
                  <CustomCaptcha
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    disabled={!email || !password || (state === 'Sign Up' && !name)}
                  />
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={!captchaVerified || !email || !password || (state === 'Sign Up' && !name)}
                  className={`w-full py-2.5 px-4 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all text-sm ${!captchaVerified || !email || !password || (state === 'Sign Up' && !name)
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-blue-700"
                    }`}
                >
                  {state === 'Sign Up' ? 'Create Account' : 'Sign in'}
                </button>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all flex items-center justify-center text-sm"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Or sign in with Google
                </button>

              </form>
            )}

            {/* Sign Up Link */}
            <div className="mt-4 text-center">

            </div>


          </div>
        </div>
      </div>
    </div >
  )
}

export default Login
