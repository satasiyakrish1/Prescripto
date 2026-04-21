import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const COLORS_LIGHT = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];
const COLORS_DARK = ['#34D399', '#FBBF24', '#F87171', '#818CF8', '#A78BFA'];

const AppointmentStatusChart = ({ data = [] }) => {
  const { darkMode } = useTheme();
  const colors = darkMode ? COLORS_DARK : COLORS_LIGHT;

  const statusData = data.reduce((acc, appointment) => {
    let status = 'Pending';
    if (appointment.cancelled) {
      status = 'Cancelled';
    } else if (appointment.isCompleted) {
      status = 'Completed';
    } else if (new Date(appointment.slotDate) < new Date()) {
      status = 'Past';
    }
    
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status]++;
    return acc;
  }, {});

  const chartData = Object.entries(statusData).map(([name, value]) => ({
    name,
    value
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-2 shadow-lg rounded border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{payload[0].name}</p>
          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{payload[0].value}</p>
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
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} transition-all duration-300`}
    >
      <div className='mb-3'>
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>Appointment Status</h3>
      </div>
      <div className='h-[220px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              dataKey='value'
              animationBegin={0}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AppointmentStatusChart;

