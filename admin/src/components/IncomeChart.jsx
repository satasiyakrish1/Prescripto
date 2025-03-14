import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

const formatCurrency = (value) => {
  return `₹${value.toLocaleString('en-IN')}`;
};

const IncomeChart = ({ data }) => {
  return (
    <div className='bg-white p-4 rounded border-2 border-gray-100 mt-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2.5'>
          <p className='font-semibold'>Income Overview</p>
        </div>
        <button
          onClick={() => {
            const doc = new jsPDF();
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
          className='px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors'
        >
          Download Report
        </button>
      </div>
      <div className='h-[300px]'>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => [formatCurrency(value), 'Income']} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ fill: '#4F46E5' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeChart;