import React, { useContext, useEffect, useState } from 'react';
import { PharmacyContext } from '../../context/PharmacyContext';
import { AppContext } from '../../context/AppContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  Filter, 
  RefreshCw,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';

const Analysis = () => {
  const { pToken, getAnalyticsData } = useContext(PharmacyContext);
  const { currency } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    categoryStats: [],
    stockStatus: {},
    monthlyReport: [],
    topMedicines: {},
    salesByTime: [],
    profitMargins: []
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Fetch analytics data from the backend
  const fetchAnalyticsData = async () => {
    if (!pToken) return;
    
    setIsLoading(true);
    try {
      // Fetch overview data
      const overviewData = await getAnalyticsData('overview', { dateRange });
      if (overviewData) {
        setAnalyticsData(prev => ({ ...prev, overview: overviewData }));
      }

      // Fetch category statistics
      const categoryStats = await getAnalyticsData('category-stats', { dateRange });
      if (categoryStats) {
        setAnalyticsData(prev => ({ ...prev, categoryStats }));
      }

      // Fetch stock status
      const stockStatus = await getAnalyticsData('stock-status', { dateRange });
      if (stockStatus) {
        setAnalyticsData(prev => ({ ...prev, stockStatus }));
      }

      // Fetch monthly report
      const monthlyReport = await getAnalyticsData('monthly-report', { dateRange });
      if (monthlyReport) {
        setAnalyticsData(prev => ({ ...prev, monthlyReport }));
      }

      // Fetch top medicines
      const topMedicines = await getAnalyticsData('top-medicines', { dateRange });
      if (topMedicines) {
        setAnalyticsData(prev => ({ ...prev, topMedicines }));
      }
      
      // Fetch sales by time of day
      const salesByTime = await getAnalyticsData('sales-by-time', { dateRange });
      if (salesByTime) {
        setAnalyticsData(prev => ({ ...prev, salesByTime }));
      }
      
      // Fetch profit margins
      const profitMargins = await getAnalyticsData('profit-margins', { dateRange });
      if (profitMargins) {
        setAnalyticsData(prev => ({ ...prev, profitMargins }));
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when date range changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [pToken, dateRange]);

  // Format currency
  const formatCurrency = (value) => {
    return `${currency}${value?.toLocaleString() || '0'}`;
  };

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Generate mock data if real data is not available
  const generateMockData = () => {
    // Mock monthly report if not available
    if (!analyticsData.monthlyReport || analyticsData.monthlyReport.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mockMonthlyReport = months.map(month => ({
        name: month,
        sales: Math.floor(Math.random() * 100000),
        profit: Math.floor(Math.random() * 50000)
      }));
      setAnalyticsData(prev => ({ ...prev, monthlyReport: mockMonthlyReport }));
    }
    
    // Mock category stats if not available
    if (!analyticsData.categoryStats || analyticsData.categoryStats.length === 0) {
      const categories = ['Painkillers', 'Antibiotics', 'Vitamins', 'Supplements', 'Others'];
      const mockCategoryStats = categories.map(category => ({
        name: category,
        value: Math.floor(Math.random() * 100)
      }));
      setAnalyticsData(prev => ({ ...prev, categoryStats: mockCategoryStats }));
    }
    
    // Mock sales by time if not available
    if (!analyticsData.salesByTime || analyticsData.salesByTime.length === 0) {
      const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
      const mockSalesByTime = timeSlots.map(time => ({
        name: time,
        sales: Math.floor(Math.random() * 50000)
      }));
      setAnalyticsData(prev => ({ ...prev, salesByTime: mockSalesByTime }));
    }
  };

  // Generate mock data if needed
  useEffect(() => {
    if (!isLoading && Object.keys(analyticsData.overview).length === 0) {
      generateMockData();
    }
  }, [isLoading, analyticsData.overview]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Pharmacy Analytics</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {formatCurrency(analyticsData.overview?.totalRevenue || 0)}
                  </h3>
                  <div className="flex items-center mt-2">
                    {(analyticsData.overview?.valueChangePercent || 0) >= 0 ? (
                      <>
                        <TrendingUp size={16} className="text-green-500 mr-1" />
                        <span className="text-sm text-green-500">
                          +{analyticsData.overview?.valueChangePercent || 0}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} className="text-red-500 mr-1" />
                        <span className="text-sm text-red-500">
                          {analyticsData.overview?.valueChangePercent || 0}%
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous {dateRange}</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {analyticsData.overview?.totalOrders || 0}
                  </h3>
                  <div className="flex items-center mt-2">
                    {(analyticsData.overview?.orderChangePercent || 0) >= 0 ? (
                      <>
                        <TrendingUp size={16} className="text-green-500 mr-1" />
                        <span className="text-sm text-green-500">
                          +{analyticsData.overview?.orderChangePercent || 0}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} className="text-red-500 mr-1" />
                        <span className="text-sm text-red-500">
                          {analyticsData.overview?.orderChangePercent || 0}%
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous {dateRange}</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package size={20} className="text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {formatCurrency(analyticsData.overview?.averageOrderValue || 0)}
                  </h3>
                  <div className="flex items-center mt-2">
                    {(analyticsData.overview?.aovChangePercent || 0) >= 0 ? (
                      <>
                        <TrendingUp size={16} className="text-green-500 mr-1" />
                        <span className="text-sm text-green-500">
                          +{analyticsData.overview?.aovChangePercent || 0}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} className="text-red-500 mr-1" />
                        <span className="text-sm text-red-500">
                          {analyticsData.overview?.aovChangePercent || 0}%
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-500 ml-2">vs previous {dateRange}</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign size={20} className="text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {analyticsData.stockStatus?.lowStockCount || 0}
                  </h3>
                  <div className="flex items-center mt-2">
                    <AlertTriangle size={16} className="text-amber-500 mr-1" />
                    <span className="text-xs text-gray-500">
                      {analyticsData.stockStatus?.criticalStockCount || 0} items critically low
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Sales Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Sales & Profit</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.monthlyReport || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${currency}${value.toLocaleString()}`, undefined]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill="#0088FE" />
                    <Bar dataKey="profit" name="Profit" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Distribution Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analyticsData.categoryStats || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, undefined]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sales by Time of Day */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Time of Day</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.salesByTime || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${currency}${value.toLocaleString()}`, undefined]}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Selling Products */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(analyticsData.topMedicines?.topSelling || []).map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unitsSold}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.profitMargin}%</td>
                      </tr>
                    ))}
                    {(!analyticsData.topMedicines?.topSelling || analyticsData.topMedicines?.topSelling.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Profit Margins by Category */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit Margins by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.profitMargins || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Profit Margin']}
                  />
                  <Legend />
                  <Bar dataKey="margin" name="Profit Margin (%)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Low Stock Items */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white p-6 rounded-xl shadow-md mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(analyticsData.topMedicines?.leastStocked || []).map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {product.stock < 10 ? 'Critical' : 'Low'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900">Reorder</button>
                      </td>
                    </tr>
                  ))}
                  {(!analyticsData.topMedicines?.leastStocked || analyticsData.topMedicines?.leastStocked.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No low stock items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Analysis;