import React, { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { AppContext } from '../context/AppContext';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const RevenueByDoctor = ({ data = [] }) => {
  const { darkMode } = useTheme();
  const { calculateCurrency, currency } = useContext(AppContext);

  const formatCurrency = (value) => {
    return `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Process data to get top doctors by revenue
  const processedData = data
    .filter(appointment => appointment.payment && !appointment.cancelled && appointment.docData)
    .reduce((acc, appointment) => {
      const doctorName = appointment.docData.name || 'Unknown';
      if (!acc[doctorName]) {
        acc[doctorName] = { name: doctorName, revenue: 0, appointments: 0 };
      }
      // Calculate dynamic currency value for each appointment
      acc[doctorName].revenue += calculateCurrency(appointment.amount || 0);
      acc[doctorName].appointments += 1;
      return acc;
    }, {});

  const chartData = Object.values(processedData)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7)
    .map((item, index) => ({
      ...item,
      // Ensure name isn't too long but keep it readable
      displayName: item.name.length > 18 ? item.name.substring(0, 18) + '...' : item.name,
      originalName: item.name
    }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  // Custom tool tip to be super clear
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dataItem.originalName}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>Revenue:</span>
            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatCurrency(dataItem.revenue)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>Appointments:</span>
            <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{dataItem.appointments}</span>
          </div>
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
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Top Doctors Revenue</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Performance based on completed payments</p>
        </div>

        <div className={`px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
          <p className="text-xs font-semibold">
            Total: {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className='h-[300px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            barSize={24}
          >
            <CartesianGrid strokeDasharray='3 3' horizontal={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />

            <XAxis
              type="number"
              hide={true} // Cleaner look without X axis numbers
            />

            <YAxis
              type="category"
              dataKey="displayName"
              width={140}
              tick={{
                fill: darkMode ? '#E5E7EB' : '#374151',
                fontSize: 13,
                fontWeight: 500
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />

            <Bar
              dataKey="revenue"
              radius={[0, 4, 4, 0]}
              background={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', radius: [0, 4, 4, 0] }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RevenueByDoctor;
