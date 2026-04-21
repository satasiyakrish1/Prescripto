import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LIGHT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const IncomePieChart = () => {
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchSpecialtyDistribution = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/statistics/specialty-distribution`);
        if (response.data.success) {
          setPieData(response.data.data);
        } else {
          setError('Failed to fetch specialty distribution');
        }
      } catch (err) {
        console.error('Error fetching specialty distribution:', err);
        setError('Error loading specialty distribution');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialtyDistribution();
    const interval = setInterval(fetchSpecialtyDistribution, 300000);
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{payload[0].name}</p>
          <p className={`text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mt-1 font-semibold`}>
            {payload[0].value} bookings
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 h-full`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Specialties</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Appointment distribution</p>
        </div>
      </div>
      <div className='h-[250px] w-full flex justify-center items-center'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={pieData}
              cx='50%'
              cy='50%'
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              dataKey='value'
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
              animationEasing='ease-in-out'
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={darkMode ? DARK_COLORS[index % DARK_COLORS.length] : LIGHT_COLORS[index % LIGHT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default IncomePieChart;