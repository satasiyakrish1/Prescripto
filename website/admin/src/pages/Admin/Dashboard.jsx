import React, { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import IncomeChart from '../../components/IncomeChart'
import IncomePieChart from '../../components/IncomePieChart'
import PatientDemographics from '../../components/PatientDemographics'
import AppointmentTrends from '../../components/AppointmentTrends'
import Subscribers from '../../components/Subscribers'
import RevenueByDoctor from '../../components/RevenueByDoctor'
import AppointmentStatusChart from '../../components/AppointmentStatusChart'
import PatientGrowthChart from '../../components/PatientGrowthChart'
import WeeklyComparisonChart from '../../components/WeeklyComparisonChart'
import QuickStats from '../../components/QuickStats'
import AppointmentStatusDistribution from '../../components/AppointmentStatusDistribution'
import { TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData, isReadOnly } = useContext(AdminContext)
  const { slotDateFormat, currency, calculateCurrency } = useContext(AppContext)
  const { darkMode } = useTheme()

  const [incomeData, setIncomeData] = React.useState([]);

  useEffect(() => {
    if (dashData?.latestAppointments) {
      const monthlyIncome = dashData.latestAppointments
        .filter(appointment => appointment.payment && !appointment.cancelled)
        .reduce((acc, appointment) => {
          const date = new Date(appointment.date);
          const month = date.toLocaleString('en-US', { month: 'short' });
          acc[month] = (acc[month] || 0) + appointment.amount;
          return acc;
        }, {});

      const sortedData = Object.entries(monthlyIncome)
        .map(([month, income]) => ({ month, income }))
        .sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });

      setIncomeData(sortedData);
    }
  }, [dashData?.latestAppointments]);

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen overflow-x-hidden`}>
      {/* Page Header */}
      <div className='mb-8'>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards - Clean Uniform Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8'>
        {/* Doctors Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-800/80' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Total Doctors</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashData.doctors}</p>
            </div>
            <div className={`p-3.5 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-xl`}>
              <Users className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>

        {/* Appointments Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-800/80' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Appointments</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashData.appointments}</p>
            </div>
            <div className={`p-3.5 ${darkMode ? 'bg-green-500/20' : 'bg-green-50'} rounded-xl`}>
              <Calendar className={`w-7 h-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        {/* Patients Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-800/80' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Patients</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashData.patients}</p>
            </div>
            <div className={`p-3.5 ${darkMode ? 'bg-purple-500/20' : 'bg-purple-50'} rounded-xl`}>
              <Users className={`w-7 h-7 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-800/80' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Total Revenue</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currency}{calculateCurrency(incomeData.reduce((sum, item) => sum + item.income, 0)).toLocaleString()}
              </p>
            </div>
            <div className={`p-3.5 ${darkMode ? 'bg-amber-500/20' : 'bg-amber-50'} rounded-xl`}>
              <DollarSign className={`w-7 h-7 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid - Optimized Layout with tighter gaps and unified sizing */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Row 1: Key Performance Indicators */}
        <div className="lg:col-span-2">
          <IncomeChart data={incomeData.map(d => ({ ...d, income: calculateCurrency(d.income) }))} />
        </div>
        <div className="lg:col-span-1">
          <PatientDemographics data={dashData.patientDemographics || []} />
        </div>

        {/* Row 2: Secondary Metrics */}
        <div className="lg:col-span-1">
          <IncomePieChart data={dashData.latestAppointments.filter(appointment => appointment.payment && !appointment.cancelled)} />
        </div>
        <div className="lg:col-span-1">
          <AppointmentTrends data={dashData.appointmentTrends || []} />
        </div>
        <div className="lg:col-span-1">
          <WeeklyComparisonChart data={dashData.latestAppointments || []} />
        </div>
      </div>

      {/* Doctor Performance & Lists */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Doctor Performance */}
        <div className="lg:col-span-1 space-y-6">
          <RevenueByDoctor data={dashData.latestAppointments || []} />
          <PatientGrowthChart data={dashData.latestAppointments || []} />
        </div>

        {/* Right Column: Key Lists (Subscribers & Bookings) */}
        <div className="lg:col-span-2 space-y-6">

          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm overflow-hidden hover:shadow-md transition-all duration-300`}>
            <div className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <div className='flex items-center gap-3'>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Latest Bookings</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {dashData.latestAppointments.length}
                </span>
              </div>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
              {dashData.latestAppointments.slice(0, 8).map((item, index) => (
                <div className={`flex items-center px-6 py-4 ${darkMode ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/50'} transition-colors group`} key={index}>
                  <div className='relative flex-shrink-0 mr-4'>
                    <img className='w-10 h-10 rounded-full object-cover shadow-sm'
                      src={item.docData.image}
                      alt=""
                    />
                    {!item.cancelled && !item.isCompleted && (
                      <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800'></div>
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>{item.docData.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {slotDateFormat(item.slotDate)}
                      </span>
                      {item.payment && !item.cancelled && (
                        <>
                          <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                          <span className={`text-xs font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {currency}{calculateCurrency(item.amount || 0)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    {item.cancelled ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'}`}>
                        Cancelled
                      </span>
                    ) : item.isCompleted ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                        Completed
                      </span>
                    ) : (
                      !isReadOnly && <button
                        onClick={() => cancelAppointment(item._id)}
                        className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-red-300' : 'bg-gray-50 hover:bg-red-50 text-red-500 hover:text-red-700'}`}
                        title="Cancel Appointment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Subscribers />
            <AppointmentStatusDistribution data={dashData.latestAppointments || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard