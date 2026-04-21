import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const mockData = {
  keyMetrics: {
    totalVisitors: 15234,
    conversionRate: 3.8,
    campaignClicks: 45678,
    newLeads: 1234
  },
  trafficOverTime: [
    { date: '2024-01', visitors: 12000 },
    { date: '2024-02', visitors: 13500 },
    { date: '2024-03', visitors: 15000 },
    { date: '2024-04', visitors: 14500 },
    { date: '2024-05', visitors: 16000 }
  ],
  campaignPerformance: [
    { name: 'Summer Sale', clicks: 12500, conversions: 450 },
    { name: 'New Product', clicks: 9800, conversions: 380 },
    { name: 'Holiday Special', clicks: 15600, conversions: 620 },
    { name: 'Flash Deal', clicks: 8900, conversions: 290 }
  ],
  bounceRate: [
    { date: '2024-01', bounce: 45, engagement: 55 },
    { date: '2024-02', bounce: 42, engagement: 58 },
    { date: '2024-03', bounce: 38, engagement: 62 },
    { date: '2024-04', bounce: 35, engagement: 65 },
    { date: '2024-05', bounce: 33, engagement: 67 }
  ],
  trafficSources: [
    { source: 'Social Media', value: 35 },
    { source: 'Email Marketing', value: 25 },
    { source: 'Organic Search', value: 20 },
    { source: 'Paid Ads', value: 20 }
  ],
  recentCampaigns: [
    { name: 'Summer Collection Launch', startDate: '2024-05-01', clicks: 8500, conversions: 320, status: 'Active' },
    { name: 'Spring Sale', startDate: '2024-04-15', clicks: 12300, conversions: 450, status: 'Completed' },
    { name: 'New Customer Discount', startDate: '2024-04-01', clicks: 6800, conversions: 280, status: 'Active' },
    { name: 'Easter Special', startDate: '2024-03-20', clicks: 9200, conversions: 340, status: 'Completed' },
    { name: 'Winter Clearance', startDate: '2024-03-01', clicks: 11500, conversions: 420, status: 'Completed' }
  ]
};

const MarketingAnalysis = () => {
  const { darkMode } = useTheme();
  const [dateRange, setDateRange] = useState('7days');

  // Color scheme based on dark mode
  const colors = {
    primary: darkMode ? '#60A5FA' : '#2563EB',
    secondary: darkMode ? '#34D399' : '#059669',
    accent: darkMode ? '#F472B6' : '#DB2777',
    text: darkMode ? '#F3F4F6' : '#1F2937',
    background: darkMode ? '#1F2937' : '#FFFFFF',
    card: darkMode ? '#374151' : '#F9FAFB',
    border: darkMode ? '#4B5563' : '#E5E7EB'
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} min-h-screen`}>
      {/* Date Range Filter */}
      <div className='flex justify-end mb-6'>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <MetricCard
          title="Total Visitors"
          value={mockData.keyMetrics.totalVisitors.toLocaleString()}
          icon="👥"
          color={colors.primary}
          darkMode={darkMode}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${mockData.keyMetrics.conversionRate}%`}
          icon="📈"
          color={colors.secondary}
          darkMode={darkMode}
        />
        <MetricCard
          title="Campaign Clicks"
          value={mockData.keyMetrics.campaignClicks.toLocaleString()}
          icon="🎯"
          color={colors.accent}
          darkMode={darkMode}
        />
        <MetricCard
          title="New Leads"
          value={mockData.keyMetrics.newLeads.toLocaleString()}
          icon="🌟"
          color={colors.primary}
          darkMode={darkMode}
        />
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        {/* Traffic Over Time */}
        <ChartCard title="Traffic Over Time" darkMode={darkMode}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.trafficOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="date" stroke={colors.text} />
              <YAxis stroke={colors.text} />
              <Tooltip
                contentStyle={{ backgroundColor: colors.background }}
                labelStyle={{ color: colors.text }}
              />
              <Legend />
              <Line type="monotone" dataKey="visitors" stroke={colors.primary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Campaign Performance */}
        <ChartCard title="Campaign Performance" darkMode={darkMode}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" stroke={colors.text} />
              <YAxis stroke={colors.text} />
              <Tooltip
                contentStyle={{ backgroundColor: colors.background }}
                labelStyle={{ color: colors.text }}
              />
              <Legend />
              <Bar dataKey="clicks" fill={colors.primary} />
              <Bar dataKey="conversions" fill={colors.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bounce Rate vs Engagement */}
        <ChartCard title="Bounce Rate vs Engagement" darkMode={darkMode}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockData.bounceRate}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="date" stroke={colors.text} />
              <YAxis stroke={colors.text} />
              <Tooltip
                contentStyle={{ backgroundColor: colors.background }}
                labelStyle={{ color: colors.text }}
              />
              <Legend />
              <Area type="monotone" dataKey="bounce" stackId="1" stroke={colors.accent} fill={colors.accent} fillOpacity={0.3} />
              <Area type="monotone" dataKey="engagement" stackId="1" stroke={colors.secondary} fill={colors.secondary} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Traffic Source Breakdown */}
        <ChartCard title="Traffic Source Breakdown" darkMode={darkMode}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.trafficSources}
                dataKey="value"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={colors.primary}
              >
                {mockData.trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.accent, colors.text][index % 4]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: colors.background }}
                labelStyle={{ color: colors.text }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Campaigns Table */}
      <div className={`rounded-xl shadow-sm ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Recent Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Campaign Name</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Start Date</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Clicks</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Conversions</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
              {mockData.recentCampaigns.map((campaign, index) => (
                <tr key={index} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{campaign.name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{campaign.startDate}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{campaign.clicks.toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{campaign.conversions.toLocaleString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${campaign.status === 'Active'
                        ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Utility Components
const MetricCard = ({ title, value, icon, color, darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-l-4`} style={{ borderColor: color }}>
    <div className='flex items-center gap-4'>
      <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-6 rounded-xl shadow-sm`}>
    <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>{title}</h2>
    {children}
  </div>
);


export default MarketingAnalysis;