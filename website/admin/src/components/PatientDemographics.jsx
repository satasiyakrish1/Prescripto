import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const PatientDemographics = ({ data }) => {
  const [chartData, setChartData] = useState([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const { darkMode } = useTheme();

  useEffect(() => {
    if (data && data.length > 0) {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      setTotalPatients(total);

      const newData = data.map(item => ({
        ...item,
        count: item.count
      }));
      setChartData(newData);
    }
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
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Demographics</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Patients by age group</p>
        </div>
      </div>
      <div className='h-[350px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis
              dataKey='ageGroup'
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11, fontWeight: 500 }}
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
                fontSize: '12px',
                color: darkMode ? '#9CA3AF' : '#6B7280',
                marginBottom: '8px'
              }}
            />
            <Bar
              dataKey='count'
              name='Patients'
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={darkMode ? '#818CF8' : '#6366F1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PatientDemographics;