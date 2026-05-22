import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import {
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  Grid3X3,
  List,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Stethoscope,
  DollarSign,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const AllAppointments = () => {
  const navigate = useNavigate()
  const {
    aToken,
    filteredAppointments,
    cancelAppointment,
    getAllAppointments,
    downloadAppointmentsCSV,
    doctors,
    filters,
    updateFilters,
    getAllDoctors,
    isReadOnly
  } = useContext(AdminContext)

  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const { darkMode } = useTheme()
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showTodayOnly, setShowTodayOnly] = useState(false)
  const [selectedView, setSelectedView] = useState('list') // Default to list view
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const [advancedFilters, setAdvancedFilters] = useState({
    timeSlot: 'all', // morning, afternoon, evening, all
    ageRange: 'all', // child, adult, senior, all
    sortBy: 'date', // date, name, doctor, status, fees
    sortOrder: 'desc' // asc, desc
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isSelected = (id) => selectedIds.has(id)

  const getServiceType = (item) => {
    if (item.serviceType) return item.serviceType
    if (item.docData?.speciality) return item.docData.speciality
    return 'Consultation'
  }

  const getDuration = (item) => {
    if (item.duration) return item.duration
    return '30m'
  }

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('_')) return slotDateFormat(dateStr)
    try {
      let d = new Date(dateStr)
      if (isNaN(d.getTime())) {
        const parts = dateStr.split(/[-\/]/)
        if (parts.length === 3) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          if (isNaN(d.getTime())) d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
        }
      }
      if (!isNaN(d.getTime())) {
        const day = d.getDate()
        const month = d.toLocaleString('default', { month: 'short' })
        const year = d.getFullYear()
        return `${day} ${month} ${year}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return ''
    try {
      const t = timeStr.trim()
      const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?$/)
      if (m) {
        const h = parseInt(m[1], 10)
        const min = parseInt(m[2], 10)
        const ampmIn = m[3] ? m[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM')
        const h12 = h % 12 || 12
        return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampmIn}`
      }
      if (t.includes(':')) {
        const [hh, mmRaw] = t.split(':')
        const hour = parseInt(hh, 10)
        const mm = parseInt(mmRaw.replace(/\D/g, ''), 10) || 0
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hour12 = hour % 12 || 12
        return `${hour12.toString().padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`
      }
      return t
    } catch {
      return timeStr
    }
  }

  // Format date properly and handle "DD_MM_YYYY" strings: "24 Nov 2025 · 03:42 PM"
  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return ''
    let dateDisplay = ''
    try {
      if (dateStr.includes('_')) {
        dateDisplay = slotDateFormat(dateStr)
      } else {
        let date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          const parts = dateStr.split(/[-\/]/)
          if (parts.length === 3) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
            if (isNaN(date.getTime())) {
              date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
            }
          }
        }
        if (!isNaN(date.getTime())) {
          const day = date.getDate()
          const month = date.toLocaleString('default', { month: 'short' })
          const year = date.getFullYear()
          dateDisplay = `${day} ${month} ${year}`
        } else {
          dateDisplay = dateStr
        }
      }
    } catch {
      dateDisplay = dateStr
    }
    let formattedTime = ''
    if (timeStr) {
      try {
        const t = timeStr.trim()
        const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?$/)
        if (m) {
          const h = parseInt(m[1], 10)
          const min = parseInt(m[2], 10)
          const ampmIn = m[3] ? m[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM')
          const h12 = h % 12 || 12
          formattedTime = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampmIn}`
        } else if (t.includes(':')) {
          const [hh, mmRaw] = t.split(':')
          const hour = parseInt(hh, 10)
          const mm = parseInt(mmRaw.replace(/\D/g, ''), 10) || 0
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const hour12 = hour % 12 || 12
          formattedTime = `${hour12.toString().padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`
        }
      } catch { }
    }
    return `${dateDisplay}${formattedTime ? ' · ' + formattedTime : ''}`
  }

  const getWeekdayFull = (dateStr) => {
    if (!dateStr) return '';
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (isNaN(date.getTime())) {
          date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
    }
    return isNaN(date.getTime()) ? '' : date.toLocaleString('default', { weekday: 'long' });
  };

  // Check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;

    try {
      const today = new Date();
      const date = new Date(dateStr);

      // Handle invalid date
      if (isNaN(date.getTime())) {
        // Try parsing alternative formats like above
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
          // Try DD-MM-YYYY format
          const parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.getDate() === today.getDate() &&
              parsedDate.getMonth() === today.getMonth() &&
              parsedDate.getFullYear() === today.getFullYear();
          }

          // Try MM-DD-YYYY format
          const parsedDate2 = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          if (!isNaN(parsedDate2.getTime())) {
            return parsedDate2.getDate() === today.getDate() &&
              parsedDate2.getMonth() === today.getMonth() &&
              parsedDate2.getFullYear() === today.getFullYear();
          }
        }
        return false;
      }

      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    } catch (error) {
      console.error("Error checking if date is today:", error);
      return false;
    }
  };

  // Get time slot category
  const getTimeSlot = (timeStr) => {
    if (!timeStr) return 'unknown';
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'other';
  };

  // Get age category
  const getAgeCategory = (dob) => {
    const age = calculateAge(dob);
    if (age < 18) return 'child';
    if (age >= 18 && age < 60) return 'adult';
    return 'senior';
  };

  // Initial data load
  useEffect(() => {
    if (aToken) {
      setLoading(true)
      Promise.all([getAllAppointments(), getAllDoctors()])
        .finally(() => setLoading(false))
    }
  }, [aToken])

  // Removed redundant reload on filter change; filtering happens locally via AdminContext

  // Enhanced filter and sort logic
  const allFilteredAppointments = filteredAppointments
    .filter(apt => showTodayOnly ? isToday(apt.slotDate) : true)
    .filter(apt =>
      searchQuery === '' ||
      apt.userData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.docData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.userData.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.userData.phone?.includes(searchQuery)
    )
    .filter(apt => {
      // Time slot filter
      if (advancedFilters.timeSlot !== 'all') {
        const timeSlot = getTimeSlot(apt.slotTime);
        if (timeSlot !== advancedFilters.timeSlot) return false;
      }

      // Age range filter
      if (advancedFilters.ageRange !== 'all') {
        const ageCategory = getAgeCategory(apt.userData.dob);
        if (ageCategory !== advancedFilters.ageRange) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const order = advancedFilters.sortOrder === 'asc' ? 1 : -1;

      switch (advancedFilters.sortBy) {
        case 'name':
          return order * a.userData.name.localeCompare(b.userData.name);
        case 'doctor':
          return order * a.docData.name.localeCompare(b.docData.name);
        case 'fees':
          return order * (Number(a.amount) - Number(b.amount));
        case 'status':
          const getStatusOrder = (apt) => {
            if (apt.cancelled) return 0;
            if (apt.isCompleted) return 1;
            if (isToday(apt.slotDate)) return 2;
            return 3;
          };
          return order * (getStatusOrder(a) - getStatusOrder(b));
        case 'date':
        default:
          return order * (new Date(a.slotDate) - new Date(b.slotDate));
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(allFilteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedAppointments = allFilteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.status, filters.doctor, filters.dateFrom, filters.dateTo, advancedFilters.timeSlot, advancedFilters.ageRange, advancedFilters.sortBy, advancedFilters.sortOrder, showTodayOnly]);

  // For debugging purposes - log appointment dates to console
  useEffect(() => {
    if (filteredAppointments.length > 0) {
      console.log("Sample appointment date:", filteredAppointments[0].slotDate);
      console.log("Sample formatted date:", formatDateTime(filteredAppointments[0].slotDate, filteredAppointments[0].slotTime));
    }
  }, [filteredAppointments]);

  // Reset filters function
  const resetFilters = () => {
    updateFilters({
      status: 'all',
      doctor: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setAdvancedFilters({
      timeSlot: 'all',
      ageRange: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setShowTodayOnly(false);
    setSearchQuery('');
  }

  // Handle filter change
  const handleFilterChange = (field, value) => {
    updateFilters({ [field]: value })
  }

  // Handle advanced filter change
  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
  }



  // Get status badge styling
  const getStatusBadge = (item) => {
    if (item.cancelled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Cancelled
        </span>
      );
    } else if (item.isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Completed
        </span>
      );
    } else if (isToday(item.slotDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Today
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Upcoming
        </span>
      );
    }
  };

  const getAccentColor = (item) => {
    if (item.cancelled) return '#EF4444';
    if (item.isCompleted) return '#10B981';
    if (isToday(item.slotDate)) return '#F59E0B';
    return '#3B82F6';
  };

  // Stats calculation
  const stats = {
    total: allFilteredAppointments.length,
    today: allFilteredAppointments.filter(apt => isToday(apt.slotDate)).length,
    completed: allFilteredAppointments.filter(apt => apt.isCompleted).length,
    cancelled: allFilteredAppointments.filter(apt => apt.cancelled).length,
    upcoming: allFilteredAppointments.filter(apt => !apt.isCompleted && !apt.cancelled).length
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900' : 'bg-white'} min-h-screen`}>
      <div className="max-w-7xl mx-auto">
        {/* Minimalistic Header */}
        <div className="mb-6">
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : ' #5f6FFF'} rounded-lg`}>
                <Calendar className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Appointments</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minimal view with perfect Date & Time</p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
              {/* Enhanced Search Bar */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search appointments"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2.5 w-full sm:w-80 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className={`flex rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setSelectedView('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedView === 'grid'
                    ? darkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedView('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedView === 'list'
                    ? darkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 ${showFilters
                  ? 'bg-gradient-to-r from-[#0A82FD] to-[#00C6A2] text-white shadow-md'
                  : darkMode
                    ? 'bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700'
                    : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                  }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
              >
                <Filter className="h-4 w-4" />
                Filters
              </motion.button>

              <motion.button
                onClick={downloadAppointmentsCSV}
                className='bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-colors'
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
              >
                <Download className="h-4 w-4" />
                Export
              </motion.button>
            </div>
          </div>
        </div>

        {/* Minimalistic Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Total</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
              </div>
              <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
                <Calendar className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Today</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{stats.today}</p>
              </div>
              <div className={`p-2 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-lg`}>
                <Clock className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Completed</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
              </div>
              <div className={`p-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg`}>
                <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Cancelled</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.cancelled}</p>
              </div>
              <div className={`p-2 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg`}>
                <XCircle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Upcoming</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.upcoming}</p>
              </div>
              <div className={`p-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg`}>
                <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200 animate-in slide-in-from-top duration-300'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Doctor</label>
                <select
                  value={filters.doctor}
                  onChange={(e) => handleFilterChange('doctor', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value="all">All Doctors</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => {
                    console.log("Selected From Date:", e.target.value);
                    handleFilterChange('dateFrom', e.target.value);
                  }}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => {
                    console.log("Selected To Date:", e.target.value);
                    handleFilterChange('dateTo', e.target.value);
                  }}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Time Slot</label>
                <select
                  value={advancedFilters.timeSlot}
                  onChange={(e) => handleAdvancedFilterChange('timeSlot', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value="all">All</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Age Range</label>
                <select
                  value={advancedFilters.ageRange}
                  onChange={(e) => handleAdvancedFilterChange('ageRange', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value="all">All</option>
                  <option value="child">Child</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Sort By</label>
                <select
                  value={advancedFilters.sortBy}
                  onChange={(e) => handleAdvancedFilterChange('sortBy', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value="date">Date</option>
                  <option value="name">Patient Name</option>
                  <option value="doctor">Doctor</option>
                  <option value="status">Status</option>
                  <option value="fees">Fees</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Sort Order</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdvancedFilterChange('sortOrder', 'asc')}
                    className={`px-3 py-2 rounded-lg border text-sm ${advancedFilters.sortOrder === 'asc' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    aria-pressed={advancedFilters.sortOrder === 'asc'}
                  >
                    Asc
                  </button>
                  <button
                    onClick={() => handleAdvancedFilterChange('sortOrder', 'desc')}
                    className={`px-3 py-2 rounded-lg border text-sm ${advancedFilters.sortOrder === 'desc' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    aria-pressed={advancedFilters.sortOrder === 'desc'}
                  >
                    Desc
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center text-blue-600">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Select date range and click Apply to filter appointments</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => {
                    console.log("Applied filters:", filters);
                    getAllAppointments();
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
              {showTodayOnly && (
                <span className="px-3 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">Today</span>
              )}
              {filters.status !== 'all' && (
                <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">Status: {filters.status}</span>
              )}
              {filters.doctor !== 'all' && (
                <span className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200">Doctor</span>
              )}
              {advancedFilters.timeSlot !== 'all' && (
                <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">Time: {advancedFilters.timeSlot}</span>
              )}
              {advancedFilters.ageRange !== 'all' && (
                <span className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">Age: {advancedFilters.ageRange}</span>
              )}
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className='bg-white rounded-xl shadow-sm overflow-x-auto'>
          {selectedView === 'list' ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {/* Table Header */}
              <div className='hidden lg:grid grid-cols-[40px_minmax(140px,1.5fr)_50px_110px_90px_70px_minmax(130px,1.5fr)_100px_80px_100px_70px] gap-3 py-3 px-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10' role="rowgroup" aria-label="Appointments list header">
                <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sortBy: 'date', sortOrder: prev.sortBy === 'date' && prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="text-left text-xs font-semibold text-gray-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort by index">
                  #
                  {advancedFilters.sortBy === 'date' && (
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      {advancedFilters.sortOrder === 'asc' ? <path d="M10 6l4 4H6l4-4z" /> : <path d="M10 14l-4-4h8l-4 4z" />}
                    </svg>
                  )}
                </button>
                <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sortBy: 'name', sortOrder: prev.sortBy === 'name' && prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="text-left text-xs font-semibold text-gray-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort by patient">
                  Patient
                  {advancedFilters.sortBy === 'name' && (
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      {advancedFilters.sortOrder === 'asc' ? <path d="M10 6l4 4H6l4-4z" /> : <path d="M10 14l-4-4h8l-4 4z" />}
                    </svg>
                  )}
                </button>
                <p className="text-xs font-semibold text-gray-700 text-center">Age</p>
                <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sortBy: 'date', sortOrder: prev.sortBy === 'date' && prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="text-left text-xs font-semibold text-gray-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort by date">
                  Date
                  {advancedFilters.sortBy === 'date' && (
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      {advancedFilters.sortOrder === 'asc' ? <path d="M10 6l4 4H6l4-4z" /> : <path d="M10 14l-4-4h8l-4 4z" />}
                    </svg>
                  )}
                </button>
                <p className="text-xs font-semibold text-gray-700 text-center">Time</p>
                <p className="text-xs font-semibold text-gray-700 text-center">Duration</p>
                <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sortBy: 'doctor', sortOrder: prev.sortBy === 'doctor' && prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="text-left text-xs font-semibold text-gray-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort by doctor">
                  Doctor
                  {advancedFilters.sortBy === 'doctor' && (
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      {advancedFilters.sortOrder === 'asc' ? <path d="M10 6l4 4H6l4-4z" /> : <path d="M10 14l-4-4h8l-4 4z" />}
                    </svg>
                  )}
                </button>
                <p className="text-xs font-semibold text-gray-700 text-center">Service</p>
                <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sortBy: 'fees', sortOrder: prev.sortBy === 'fees' && prev.sortOrder === 'asc' ? 'desc' : 'asc' }))} className="text-right text-xs font-semibold text-gray-700 flex items-center justify-end gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort by fees">
                  Fees
                  {advancedFilters.sortBy === 'fees' && (
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      {advancedFilters.sortOrder === 'asc' ? <path d="M10 6l4 4H6l4-4z" /> : <path d="M10 14l-4-4h8l-4 4z" />}
                    </svg>
                  )}
                </button>
                <p className="text-xs font-semibold text-gray-700 text-center">Status</p>
                <p className="text-xs font-semibold text-gray-700 text-center">Actions</p>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-primary bg-blue-100">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading appointments...
                  </div>
                </div>
              ) : displayedAppointments.length === 0 ? (
                <div className="py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
              ) : (
                displayedAppointments.map((item, index) => (
                  <div
                    onClick={() => navigate(`/appointments/${item._id}`)}
                    role="row"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/appointments/${item._id}`)
                    }}
                    className={`relative cursor-pointer flex flex-col lg:grid lg:grid-cols-[40px_minmax(140px,1.5fr)_50px_110px_90px_70px_minmax(130px,1.5fr)_100px_80px_100px_70px] items-center gap-3 text-gray-800 text-sm py-3 px-4 border-b border-gray-100 transition-all hover:bg-blue-50/50 focus:outline-none focus:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    key={item._id || index}
                  >
                    {/* Index */}
                    <p className='hidden lg:flex text-xs font-medium text-gray-600 items-center justify-start'>{startIndex + index + 1}</p>

                    {/* Patient */}
                    <div className='flex items-center gap-2 w-full min-w-0'>
                      <img src={item.userData.image} className='w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0' alt={item.userData.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 leading-tight truncate">{item.userData.name}</p>
                        <p className="text-xs text-gray-500 lg:hidden">Age: {calculateAge(item.userData.dob)}</p>
                      </div>
                    </div>

                    {/* Age */}
                    <p className='hidden lg:flex text-xs text-gray-700 items-center justify-center font-medium'>{calculateAge(item.userData.dob)}</p>

                    {/* Date */}
                    <div className='hidden lg:flex items-center justify-start'>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                        {formatDateOnly(item.slotDate)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className='hidden lg:flex items-center justify-center'>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium whitespace-nowrap">
                        {formatTimeOnly(item.slotTime)}
                      </span>
                    </div>

                    {/* Mobile Date/Time */}
                    <div className="lg:hidden text-xs text-gray-600 mb-2 w-full">
                      <span className="font-medium">Date: </span>{formatDateTime(item.slotDate, item.slotTime)}
                    </div>

                    {/* Duration */}
                    <div className='hidden lg:flex items-center justify-center'>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium whitespace-nowrap">
                        {getDuration(item)}
                      </span>
                    </div>

                    {/* Doctor */}
                    <div className='flex items-center gap-2 w-full min-w-0'>
                      <img src={item.docData.image} className='w-7 h-7 rounded-full bg-gray-200 object-cover border border-gray-200 flex-shrink-0' alt={item.docData.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{item.docData.name}</p>
                        <p className="text-xs text-gray-500 lg:hidden">{currency}{item.amount}</p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className='hidden lg:flex items-center justify-center'>
                      <span className="text-xs text-green-700 px-2 py-0.5 rounded-md bg-green-50 font-medium whitespace-nowrap truncate max-w-full">{getServiceType(item)}</span>
                    </div>

                    {/* Fees */}
                    <p className='hidden lg:flex text-xs font-semibold text-gray-900 items-center justify-end'>{currency}{item.amount}</p>

                    {/* Status */}
                    <div className="hidden lg:flex items-center justify-center">
                      {getStatusBadge(item)}
                    </div>

                    {/* Actions */}
                    <div className="hidden lg:flex items-center justify-center relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item._id ? null : item._id) }}
                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-700" />
                      </button>
                      {openMenuId === item._id && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${item._id}`); setOpenMenuId(null) }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700 rounded-t-lg"
                          >View Details</button>
                          {!isReadOnly && <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${item._id}?edit=true`); setOpenMenuId(null) }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700"
                          >Edit</button>}
                          {!item.cancelled && !item.isCompleted && (
                            <>
                              {isToday(item.slotDate) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); alert('Mark as completed functionality to be implemented'); setOpenMenuId(null) }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-medium text-gray-700"
                                >Mark Completed</button>
                              )}
                              {!isReadOnly && <button
                                onClick={(e) => { e.stopPropagation(); cancelAppointment(item._id); setOpenMenuId(null) }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 text-xs font-medium text-red-700 rounded-b-lg"
                              >Cancel</button>}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mobile Status */}
                    <div className="lg:hidden flex items-center justify-center w-full">
                      {getStatusBadge(item)}
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {!loading && displayedAppointments.length > 0 && totalPages > 1 && (
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  {/* Info Text */}
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, allFilteredAppointments.length)}</span> of <span className="font-semibold">{allFilteredAppointments.length}</span> results
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentPage === 1
                        ? darkMode
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                          (page === currentPage + 2 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return <span key={page} className={`px-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>;
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-all ${currentPage === page
                              ? darkMode
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                              : darkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentPage === totalPages
                        ? darkMode
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                    >
                      Next
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div className="p-6" role="region" aria-label="Appointments grid view" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {loading ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-primary bg-blue-100">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading appointments...
                  </div>
                </div>
              ) : displayedAppointments.length === 0 ? (
                <div className="py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" role="grid">
                  {displayedAppointments.map((item, index) => (
                    <div
                      key={item._id || index}
                      role="gridcell"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/appointments/${item._id}`)
                      }}
                      onClick={() => navigate(`/appointments/${item._id}`)}
                      className={`group relative ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600`}
                    >
                      {/* Patient */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                        <img
                          src={item.userData.image}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          alt={item.userData.name}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                            {item.userData.name}
                          </h3>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                            {calculateAge(item.userData.dob)} years
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(item)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {formatDateTime(item.slotDate, item.slotTime)}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-0.5`}>
                              {getDuration(item)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
                              Dr. {item.docData.name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-0.5`}>
                              {getServiceType(item)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {currency}{item.amount}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`flex gap-2 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        {!item.cancelled && !item.isCompleted ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${item._id}`) }}
                              className={`flex-1 px-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-blue-600 text-gray-200 hover:text-white border border-gray-600 hover:border-blue-600' : 'bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white border border-gray-200 hover:border-blue-600'} rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {!isReadOnly && <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${item._id}?edit=true`) }}
                              className={`px-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'} border rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>}
                            {!isReadOnly && <button
                              onClick={(e) => { e.stopPropagation(); cancelAppointment(item._id) }}
                              className={`px-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'} border rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>}
                          </>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${item._id}`) }}
                            className={`flex-1 px-4 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div >
  )
}

export default AllAppointments
