import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';

const QuickStats = ({ data = [] }) => {
  const { darkMode } = useTheme();

  const stats = {
    completed: data.filter(a => a.isCompleted).length,
    pending: data.filter(a => !a.isCompleted && !a.cancelled).length,
    cancelled: data.filter(a => a.cancelled).length,
    todayCompleted: data.filter(a => 
      a.isCompleted && 
      new Date(a.date || a.slotDate).toDateString() === new Date().toDateString()
    ).length,
    successRate: data.length > 0 
      ? Math.round((data.filter(a => a.isCompleted).length / data.length) * 100)
      : 0,
    totalRevenue: data
      .filter(a => a.payment && !a.cancelled)
      .reduce((sum, a) => sum + (a.amount || 0), 0)
  };

  const statItems = [
    {
      label: 'Completed Today',
      value: stats.todayCompleted,
      icon: CheckCircle,
      color: 'green',
      bgColor: darkMode ? 'bg-green-900/20' : 'bg-green-50',
      textColor: darkMode ? 'text-green-400' : 'text-green-600',
      iconColor: darkMode ? 'text-green-400' : 'text-green-600'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'amber',
      bgColor: darkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      textColor: darkMode ? 'text-amber-400' : 'text-amber-600',
      iconColor: darkMode ? 'text-amber-400' : 'text-amber-600'
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      color: 'red',
      bgColor: darkMode ? 'bg-red-900/20' : 'bg-red-50',
      textColor: darkMode ? 'text-red-400' : 'text-red-600',
      iconColor: darkMode ? 'text-red-400' : 'text-red-600'
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'blue',
      bgColor: darkMode ? 'bg-blue-900/20' : ' #5f6FFF',
      textColor: darkMode ? 'text-blue-400' : 'text-blue-600',
      iconColor: darkMode ? 'text-blue-400' : 'text-blue-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-4`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <Activity className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Quick Stats
          </h3>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${darkMode ? 'bg-blue-900/20 text-blue-400' : ' #5f6FFF text-blue-600'}`}>
          Live
        </div>
      </div>

      <div className='space-y-3'>
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor} transition-all hover:scale-105`}
          >
            <div className='flex items-center space-x-3'>
              <div className={`p-1.5 rounded-full ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'}`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </div>
            <span className={`text-lg font-bold ${item.textColor}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Revenue Summary */}
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            <div className={`p-1.5 rounded-full ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Revenue
            </span>
          </div>
          <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            ₹{(stats.totalRevenue / 1000).toFixed(1)}K
          </span>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className='mt-3'>
        <div className='flex justify-between items-center mb-1'>
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Performance
          </span>
          <span className={`text-xs font-medium ${
            stats.successRate >= 80 
              ? darkMode ? 'text-green-400' : 'text-green-600'
              : stats.successRate >= 60
              ? darkMode ? 'text-amber-400' : 'text-amber-600'
              : darkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            {stats.successRate >= 80 ? 'Excellent' : stats.successRate >= 60 ? 'Good' : 'Needs Improvement'}
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              stats.successRate >= 80 
                ? 'bg-green-500'
                : stats.successRate >= 60
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${stats.successRate}%` }}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickStats;