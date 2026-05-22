import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Users, TrendingUp } from 'lucide-react';

const PatientGrowthChart = ({ data = [] }) => {
  const { darkMode } = useTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Create a map to track unique patients per month with proper date objects
    const monthlyData = {};
    const allPatients = new Set();

    data.forEach(appointment => {
      if (appointment.patientData && appointment.patientData._id) {
        const date = new Date(appointment.date || appointment.slotDate);

        // Skip invalid dates
        if (isNaN(date.getTime())) return;

        // Create a sortable key (YYYY-MM format) and display key
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const displayMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyData[sortKey]) {
          monthlyData[sortKey] = {
            sortKey,
            displayMonth,
            patients: new Set(),
            date: new Date(year, month, 1) // First day of the month for sorting
          };
        }

        monthlyData[sortKey].patients.add(appointment.patientData._id);
        allPatients.add(appointment.patientData._id);
      }
    });

    // Convert to array and sort chronologically
    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        month: item.displayMonth,
        patients: item.patients.size,
        sortKey: item.sortKey
      }));

    return sortedData;
  }, [data]);

  const totalPatients = useMemo(() => {
    const allPatients = new Set();
    data.forEach(appointment => {
      if (appointment.patientData && appointment.patientData._id) {
        allPatients.add(appointment.patientData._id);
      }
    });
    return allPatients.size;
  }, [data]);

  const growthRate = chartData.length >= 2
    ? ((chartData[chartData.length - 1]?.patients - chartData[0]?.patients) / (chartData[0]?.patients || 1) * 100) || 0
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex-1'>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'} mb-1`}>Patient Growth</h3>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New unique patients per month</p>
        </div>

        <div className='flex items-center gap-3'>
          {totalPatients > 0 && (
            <div className={`px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <p className="text-xs font-medium">Total: {totalPatients}</p>
            </div>
          )}
          {growthRate !== 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${growthRate > 0
              ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              : darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'
              }`}>
              <TrendingUp size={14} />
              <span>{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
      <div className='h-[300px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darkMode ? '#34D399' : '#10B981'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={darkMode ? '#34D399' : '#10B981'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
              dy={8}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
              width={45}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: darkMode ? '#4B5563' : '#E5E7EB' }}
              contentStyle={{
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{
                fontSize: '12px',
                color: darkMode ? '#9CA3AF' : '#6B7280',
                marginBottom: '4px'
              }}
            />
            <Area
              type="monotone"
              dataKey="patients"
              name="New Patients"
              stroke={darkMode ? '#34D399' : '#10B981'}
              strokeWidth={3}
              fill="url(#colorPatients)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PatientGrowthChart;
