import React, { useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { AppContext } from '../context/AppContext';
import { Download } from 'lucide-react';

const IncomeChart = ({ data }) => {
  const { darkMode } = useTheme();
  const { currency } = useContext(AppContext);

  const formatCurrency = (value) => {
    return `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 h-full`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Monthly Income</h3>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Revenue over time</p>
        </div>
        <button
          onClick={() => {
            const doc = new jsPDF();
            // ... (keeping PDF generation logic simple for brevity, assumed unchanged or minimal)
            let yOffset = 20;
            doc.setFontSize(18);
            doc.text('Monthly Income Report', 20, yOffset);
            yOffset += 20;
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yOffset);
            yOffset += 20;
            const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
            doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 20, yOffset);
            yOffset += 20;
            doc.setFontSize(14);
            doc.text('Monthly Revenue Breakdown', 20, yOffset);
            yOffset += 10;
            doc.setFontSize(12);
            data.forEach(item => {
              doc.text(`${item.month}: ${formatCurrency(item.income)}`, 30, yOffset);
              yOffset += 10;
            });
            doc.save('income-report.pdf');
          }}
          className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
          title="Download Report"
        >
          <Download size={18} />
        </button>
      </div>
      <div className='h-[350px] w-full'>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darkMode ? '#60A5FA' : '#4F46E5'} stopOpacity={0.1} />
                <stop offset="95%" stopColor={darkMode ? '#60A5FA' : '#4F46E5'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              tickFormatter={formatCurrency}
              axisLine={false}
              tickLine={false}
              tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12, fontWeight: 500 }}
              width={45}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Revenue']}
              contentStyle={{
                backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: darkMode ? '1px solid rgba(75, 85, 99, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: darkMode ? '#E5E7EB' : '#111827', fontWeight: 600 }}
              labelStyle={{
                fontSize: '12px',
                color: darkMode ? '#9CA3AF' : '#6B7280',
                marginBottom: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke={darkMode ? '#60A5FA' : '#4F46E5'}
              strokeWidth={3}
              dot={{ fill: darkMode ? '#60A5FA' : '#4F46E5', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
            {/* Simple area for fill effect under line */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default IncomeChart;