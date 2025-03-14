import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IncomeChart = ({ data }) => {
  return (
    <div className='bg-white p-4 rounded border-2 border-gray-100 mt-5'>
      <div className='flex items-center gap-2.5 mb-4'>
        <p className='font-semibold'>Income Overview</p>
      </div>
      <div className='h-[300px]'>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
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