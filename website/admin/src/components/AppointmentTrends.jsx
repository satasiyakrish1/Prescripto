import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AppointmentTrends = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  const totalAppointments = Array.isArray(data) && data.length > 0
    ? data.reduce((sum, item) => sum + (item.appointments || 0), 0)
    : 0;
  const averageAppointments = Array.isArray(data) && data.length > 0
    ? Math.round(totalAppointments / data.length)
    : 0;

  const trend = Array.isArray(data) && data.length >= 2
    ? data[data.length - 1]?.appointments - data[data.length - 2]?.appointments
    : 0;

  useEffect(() => {
    const fetchAppointmentTrends = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/statistics/appointment-trends`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch appointment trends');
        }
      } catch (err) {
        console.error('Error fetching appointment trends:', err);
        setError('Error loading appointment trends');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentTrends();
    const interval = setInterval(fetchAppointmentTrends, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 h-full`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Trends</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily appointments</p>
        </div>

        <div className='flex items-center gap-2'>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${trend > 0
                ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                : darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'
              }`}>
              {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(trend)}</span>
            </div>
          )}
        </div>
      </div>
      <div className='h-[250px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrends" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darkMode ? '#34D399' : '#10B981'} stopOpacity={0.2} />
                <stop offset="95%" stopColor={darkMode ? '#34D399' : '#10B981'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis
              dataKey='date'
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
              dy={10}
              height={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: darkMode ? '#4B5563' : '#E5E7EB', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{
                fontSize: '11px',
                color: darkMode ? '#9CA3AF' : '#6B7280',
                marginBottom: '4px'
              }}
            />
            <Line
              type='monotone'
              dataKey='appointments'
              stroke={darkMode ? '#34D399' : '#10B981'}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: darkMode ? '#34D399' : '#10B981' }}
              animationDuration={1500}
            />
            {/* Small area gradient for better feel */}
            <Area type="monotone" dataKey="appointments" stroke="none" fill="url(#colorTrends)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AppointmentTrends;