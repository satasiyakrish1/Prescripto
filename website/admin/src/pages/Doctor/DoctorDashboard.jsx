import React, { useContext, useEffect, useState, useCallback } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts'
import { 
  ClipboardList, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Filter,
  RefreshCw,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react'

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency, backendUrl } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('month')
  const [isLoading, setIsLoading] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    appointmentStats: [],
    patientDemographics: [],
    monthlyEarnings: [],
    completionRates: [],
    bookingModes: [],
    weekdayDistribution: [],
    realtimeAppointments: [],
    patientTrends: [],
    hourlyDistribution: []
  })

  // Fetch real-time analytics data from the backend API
  const fetchRealTimeData = useCallback(async () => {
    if (!dToken) return
    
    try {
      // Use the new analytics API endpoint with date range filter
      const response = await axios.get(`${backendUrl}/api/doctor/analytics`, {
        headers: { dToken },
        params: { dateRange: 'today' }
      })
      
      if (response.data.success && response.data.analyticsData) {
        const { analyticsData } = response.data
        
        // Update analytics data with real-time information from the API
        setAnalyticsData(prev => ({
          ...prev,
          hourlyDistribution: analyticsData.realTimeData.hourlyDistribution || [],
          appointmentStats: analyticsData.appointmentStats || [],
          realtimeAppointments: analyticsData.realTimeData.todayAppointments || []
        }))
        
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error)
      toast.error('Failed to fetch real-time analytics')
    }
  }, [dToken, backendUrl])
  
  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    if (realTimeEnabled) {
      // Disable real-time updates
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      setRealTimeEnabled(false)
      toast.success('Real-time updates disabled')
    } else {
      // Enable real-time updates
      fetchRealTimeData() // Fetch immediately
      const interval = setInterval(fetchRealTimeData, 30000) // Then every 30 seconds
      setRefreshInterval(interval)
      setRealTimeEnabled(true)
      toast.success('Real-time updates enabled - refreshing every 30 seconds')
    }
  }

  // Generate analytics data using the backend API
  const generateAnalyticsData = useCallback(async () => {
    if (!dToken) return
    
    setIsLoading(true)
    
    try {
      // Use the new analytics API endpoint with date range filter
      const response = await axios.get(`${backendUrl}/api/doctor/analytics`, {
        headers: { dToken },
        params: { dateRange }
      })
      
      if (response.data.success && response.data.analyticsData) {
        const { analyticsData: apiData } = response.data
        
        // Update analytics data with information from the API
        setAnalyticsData({
          appointmentStats: apiData.appointmentStats || [],
          patientDemographics: [
            { name: '0-18', value: Math.floor(apiData.appointmentStats.reduce((sum, stat) => sum + stat.value, 0) * 0.15) },
            { name: '19-35', value: Math.floor(apiData.appointmentStats.reduce((sum, stat) => sum + stat.value, 0) * 0.30) },
            { name: '36-50', value: Math.floor(apiData.appointmentStats.reduce((sum, stat) => sum + stat.value, 0) * 0.25) },
            { name: '51-65', value: Math.floor(apiData.appointmentStats.reduce((sum, stat) => sum + stat.value, 0) * 0.20) },
            { name: '65+', value: Math.floor(apiData.appointmentStats.reduce((sum, stat) => sum + stat.value, 0) * 0.10) }
          ],
          monthlyEarnings: apiData.monthlyEarnings || [],
          completionRates: apiData.monthlyEarnings?.map(item => ({
            name: item.name,
            rate: item.appointments > 0 ? (item.earnings / item.appointments) : 0
          })) || [],
          bookingModes: apiData.bookingModes || [],
          weekdayDistribution: apiData.weekdayDistribution || [],
          patientTrends: apiData.patientTrends || [],
          hourlyDistribution: apiData.realTimeData?.hourlyDistribution || [],
          realtimeAppointments: dashData?.latestAppointments || []
        })
        
        // Update last updated timestamp
        setLastUpdated(new Date())
      } else {
        // Fallback to dashboard data if API fails
        if (dashData && dashData.latestAppointments) {
          // Use existing dashboard data for basic stats
          const appointments = dashData.latestAppointments
          
          setAnalyticsData(prev => ({
            ...prev,
            appointmentStats: [
              { name: 'Completed', value: appointments.filter(a => a.isCompleted).length },
              { name: 'Cancelled', value: appointments.filter(a => a.cancelled).length },
              { name: 'Pending', value: appointments.filter(a => !a.isCompleted && !a.cancelled).length }
            ]
          }))
        }
        
        toast.error('Could not fetch complete analytics data')
      }
    } catch (error) {
      console.error('Error generating analytics:', error)
      toast.error('Failed to fetch analytics data')
      
      // Fallback to basic dashboard data
      if (dashData && dashData.latestAppointments) {
        const appointments = dashData.latestAppointments
        
        setAnalyticsData(prev => ({
          ...prev,
          appointmentStats: [
            { name: 'Completed', value: appointments.filter(a => a.isCompleted).length },
            { name: 'Cancelled', value: appointments.filter(a => a.cancelled).length },
            { name: 'Pending', value: appointments.filter(a => !a.isCompleted && !a.cancelled).length }
          ]
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }, [dToken, dateRange, backendUrl, dashData])
  
  // Initial data loading and cleanup
  useEffect(() => {
    if (dToken) {
      getDashData()
      fetchRealTimeData() // Initial fetch of real-time data
    }
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [dToken, fetchRealTimeData])
  
  // Handle analytics data updates when date range changes
  useEffect(() => {
    if (dToken) {
      generateAnalyticsData()
    }
  }, [dToken, dateRange, generateAnalyticsData])

  // Show loading or error state
  if (!dashData) {
    // Check if there was a network error
    const isNetworkError = analyticsData.error || false;
    
    return (
      <div className="flex flex-col items-center justify-center h-64">
        {isNetworkError ? (
          <>
            <div className="text-red-500 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4 text-center max-w-md">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <button 
              onClick={() => {
                getDashData();
                generateAnalyticsData();
                fetchRealTimeData();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard data...</span>
          </>
        )}
      </div>
    );
  }
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
  
  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <motion.div 
        className="mb-8 flex justify-between items-start"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Monitor your practice analytics and appointments</p>
          {realTimeEnabled && (
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Real-time updates enabled · Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button 
            onClick={toggleRealTimeUpdates} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${realTimeEnabled ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            <Activity className="h-4 w-4" />
            <span>{realTimeEnabled ? 'Live' : 'Enable Live'}</span>
          </button>
          <button 
            onClick={generateAnalyticsData} 
            disabled={isLoading}
            className="flex items-center gap-2  #5f6FFF text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{currency} {dashData.earnings}</p>
          <p className='text-gray-500 text-sm'>Total Earnings</p>
        </motion.div>

        <motion.div variants={itemVariants} className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center text-blue-600">
              <Activity className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {analyticsData.appointmentStats.find(s => s.name === 'Pending')?.value || 0} pending
              </span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{dashData.appointments}</p>
          <p className='text-gray-500 text-sm'>Total Appointments</p>
        </motion.div>

        <motion.div variants={itemVariants} className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex items-center text-purple-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{dashData.patients}</p>
          <p className='text-gray-500 text-sm'>Total Patients</p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          onClick={() => navigate('/doctor/todos')}
          className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer'
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">View All</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>Tasks</p>
          <p className='text-gray-500 text-sm'>Manage Your Tasks</p>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'appointments', label: 'Appointments' },
              { id: 'patients', label: 'Patient Analytics' },
              { id: 'earnings', label: 'Earnings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Today's Appointments (only shown when real-time is enabled) */}
          {realTimeEnabled && (
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-500" />
                  Today's Appointments (Live)
                </h3>
                <div className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analyticsData.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#10b981" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className=" #5f6FFF p-3 rounded-lg">
                  <div className="text-blue-600 text-xs font-medium">PENDING</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.appointmentStats.find(s => s.name === 'Pending')?.value || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-600 text-xs font-medium">COMPLETED</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.appointmentStats.find(s => s.name === 'Completed')?.value || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-red-600 text-xs font-medium">CANCELLED</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.appointmentStats.find(s => s.name === 'Cancelled')?.value || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Monthly Earnings Chart */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyEarnings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="earnings" name="Earnings" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="appointments" name="Appointments" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Patient Trends */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.patientTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="patients" name="Total Patients" stroke="#8884d8" fill="#8884d820" strokeWidth={2} />
                <Area type="monotone" dataKey="newPatients" name="New Patients" stroke="#82ca9d" fill="#82ca9d20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Weekday Distribution */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Distribution by Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.weekdayDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" name="Appointments" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
        
        {/* Side Charts - Takes 1 column */}
        <div className="space-y-6">
          {/* Appointment Status */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analyticsData.appointmentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.appointmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Booking Modes */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Modes</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analyticsData.bookingModes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.bookingModes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Patient Demographics */}
          <motion.div 
            className="bg-white p-6 rounded-xl shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Age Groups</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analyticsData.patientDemographics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData.patientDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
      
      {/* Latest Appointments */}
      <motion.div 
        className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Latest Appointments</h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <motion.div 
              className="flex items-center px-6 py-4 gap-4 hover:bg-gray-50 transition-colors" 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <img className="rounded-full w-12 h-12 object-cover" src={item.userData.image} alt="" />
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{item.userData.name}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{slotDateFormat(item.slotDate)}</span>
                  <Clock className="w-4 h-4 ml-3 mr-1" />
                  <span>{item.slotTime}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-900 font-medium">{currency} {item.amount}</p>
                <div className="mt-1">
                  {item.cancelled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" /> Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Completed
                    </span>
                  ) : (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => completeAppointment(item._id)}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Complete
                      </button>
                      <button 
                        onClick={() => cancelAppointment(item._id)}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default DoctorDashboard