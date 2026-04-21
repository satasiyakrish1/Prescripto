import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const WeeklyComparisonChart = ({ data = [] }) => {
  const { darkMode } = useTheme();

  const chartData = useMemo(() => {
    const weekData = {};

    data.forEach(appointment => {
      const date = new Date(appointment.date || appointment.slotDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!weekData[weekKey]) {
        weekData[weekKey] = { week: weekKey, completed: 0, cancelled: 0, pending: 0 };
      }

      if (appointment.cancelled) {
        weekData[weekKey].cancelled++;
      } else if (appointment.isCompleted) {
        weekData[weekKey].completed++;
      } else {
        weekData[weekKey].pending++;
      }
    });

    return Object.values(weekData).slice(-8); // Last 8 weeks
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 h-full`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Weekly Comparison</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status breakdown</p>
        </div>
      </div>
      <div className='h-[250px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ left: -20, right: 0, top: 5, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
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
            <Bar
              dataKey="completed"
              name="Completed"
              stackId="a"
              fill={darkMode ? '#34D399' : '#10B981'}
              radius={[0, 0, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              stackId="a"
              fill={darkMode ? '#FBBF24' : '#F59E0B'}
              radius={[0, 0, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="cancelled"
              name="Cancelled"
              stackId="a"
              fill={darkMode ? '#F87171' : '#EF4444'}
              radius={[4, 4, 0, 0]} // Top radius for the top bar in stack
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default WeeklyComparisonChart;
