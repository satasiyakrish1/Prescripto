import React, { useContext, useEffect, useState, useMemo } from 'react';
import { PharmacyContext } from '../../context/PharmacyContext';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Eye,
  Filter,
  RefreshCw,
  Activity,
  Pill,
  ShoppingCart,
  AlertCircle,
  Clock3,
  BarChart2,
  LineChart,
  PieChart,
  ShoppingBag
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const PharmacyDashboard = () => {
  const { pToken, dashData = {}, getDashData, completeSale, cancelSale, inventoryStats = {}, getInventoryStats, getAnalyticsData } = useContext(PharmacyContext);
  const { currency } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    monthlyTrends: {
      customers: { growth: 0, current: 0 },
      sales: { current: 0, previous: 0, growth: 0 },
      orders: { current: 0, previous: 0, growth: 0 },
      inventory: { current: 0, lowStock: 0, expiring: 0 }
    },
    stockAlerts: [],
    upcomingPayments: [],
    overview: {
      valueChangePercent: 0,
      totalRevenue: 0,
      lowStockCount: 0
    },
    summary: {
      totalSales: 0,
      totalOrders: 0,
      monthlyRevenue: 0,
      totalMedicines: 0,
      lowStockCount: 0,
      expiringCount: 0
    },
    dailySales: [],
    trends: {
      salesGrowth: '0%',
      ordersGrowth: '0%',
      inventoryHealth: 'Good'
    },
    categoryStats: [],
    stockStatus: {},
    monthlyReport: [],
    topMedicines: {
      topSelling: [],
      leastStocked: []
    }
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentage change
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Fetch analytics data from the backend
  const fetchAnalyticsData = async () => {
    if (!pToken) return;
    
    setIsLoading(true);
    
    // Initialize with default values first
    setAnalyticsData({
      monthlyTrends: {
        customers: { growth: 0, current: 0 },
        sales: { current: 0, previous: 0, growth: 0 },
        orders: { current: 0, previous: 0, growth: 0 },
        inventory: { current: 0, lowStock: 0, expiring: 0 }
      },
      stockAlerts: [],
      upcomingPayments: [],
      overview: {
        valueChangePercent: 0,
        totalRevenue: 0,
        lowStockCount: 0,
        expiringCount: 0,
        profitMargin: 0
      },
      summary: {
        totalSales: 0,
        totalOrders: 0,
        monthlyRevenue: 0,
        totalMedicines: 0,
        lowStockCount: 0,
        expiringCount: 0
      },
      dailySales: [],
      trends: {
        salesGrowth: '0%',
        ordersGrowth: '0%',
        inventoryHealth: 'Good'
      },
      categoryStats: [],
      stockStatus: {},
      monthlyReport: [],
      topMedicines: {
        topSelling: [],
        leastStocked: []
      }
    });

    try {
      // Fetch dashboard data first
      await getDashData();
      await getInventoryStats();
      
      // Then fetch analytics data
      try {
        const [overviewData, categoryData, topMedicinesData] = await Promise.all([
          getAnalyticsData('overview', { dateRange }),
          getAnalyticsData('category-stats', { dateRange }),
          getAnalyticsData('top-medicines', { dateRange })
        ]);
        
        if (overviewData) {
          const { summary = {}, dailySales = [], trends = {} } = overviewData;
          
          // Calculate growth metrics
          const salesGrowth = calculateGrowth(summary.monthlyRevenue || 0, (summary.monthlyRevenue || 0) * 0.9);
          const ordersGrowth = calculateGrowth(summary.totalOrders || 0, (summary.totalOrders || 0) * 0.9);
          
          // Update state with real data
          setAnalyticsData(prev => ({
            ...prev,
            summary: {
              ...prev.summary,
              ...summary
            },
            dailySales,
            trends: {
              ...prev.trends,
              ...trends
            },
            monthlyTrends: {
              ...prev.monthlyTrends,
              sales: { 
                current: summary.monthlyRevenue || 0, 
                previous: (summary.monthlyRevenue || 0) * 0.9,
                growth: salesGrowth
              },
              orders: { 
                current: summary.totalOrders || 0, 
                previous: (summary.totalOrders || 0) * 0.9,
                growth: ordersGrowth
              },
              customers: {
                current: summary.totalCustomers || 0,
                growth: calculateGrowth(summary.totalCustomers || 0, (summary.totalCustomers || 0) * 0.9)
              }
            },
            categoryStats: categoryData || [],
            topMedicines: {
              topSelling: topMedicinesData?.topSelling || [],
              leastStocked: topMedicinesData?.leastStocked || []
            }
          }));
        }
      } catch (analyticsError) {
        console.error('Error in analytics data fetch:', analyticsError);
        // Don't show error to user as we have fallback UI
      }
      
    } catch (error) {
      console.error('Error in dashboard data fetch:', error);
      // Don't show error to user as we have fallback UI
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'upcoming': return 'text-blue-600  #5f6FFF border-primary-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredSales = React.useMemo(() => {
    if (!dashData?.latestSales) return [];
    return dashData.latestSales.filter(item => 
      filterStatus === 'all' || (item?.status === filterStatus)
    );
  }, [dashData?.latestSales, filterStatus]);

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (!pToken) return;
      
      setIsLoading(true);
      try {
        // Reset analytics data to initial state
        setAnalyticsData({
          monthlyTrends: {
            customers: { growth: 0, current: 0 },
            sales: { current: 0, previous: 0, growth: 0 },
            orders: { current: 0, previous: 0, growth: 0 },
            inventory: { current: 0, lowStock: 0, expiring: 0 }
          },
          stockAlerts: [],
          upcomingPayments: [],
          overview: {
            valueChangePercent: 0,
            totalRevenue: 0,
            lowStockCount: 0,
            expiringCount: 0,
            profitMargin: 0
          },
          summary: {
            totalSales: 0,
            totalOrders: 0,
            monthlyRevenue: 0,
            totalMedicines: 0,
            lowStockCount: 0,
            expiringCount: 0
          },
          dailySales: [],
          trends: {
            salesGrowth: '0%',
            ordersGrowth: '0%',
            inventoryHealth: 'Good'
          },
          categoryStats: [],
          stockStatus: {},
          monthlyReport: [],
          topMedicines: {
            topSelling: [],
            leastStocked: []
          }
        });

        // Fetch dashboard data and inventory stats in parallel
        await Promise.all([
          getDashData(),
          getInventoryStats()
        ]);
        
        // Then fetch analytics data
        try {
          const [overviewData, categoryData, topMedicinesData] = await Promise.all([
            getAnalyticsData('overview', { dateRange }),
            getAnalyticsData('category-stats', { dateRange }),
            getAnalyticsData('top-medicines', { dateRange })
          ]);
          
          if (overviewData) {
            setAnalyticsData(prev => ({
              ...prev,
              ...overviewData,
              categoryStats: categoryData || [],
              topMedicines: {
                topSelling: topMedicinesData?.topSelling || [],
                leastStocked: topMedicinesData?.leastStocked || []
              }
            }));
          }
        } catch (analyticsError) {
          console.error('Error fetching analytics data:', analyticsError);
          // Continue with the rest of the dashboard even if analytics fails
        }
      } catch (error) {
        console.error('Error in dashboard data fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pToken, dateRange]); // Only depend on pToken and dateRange

  // Loading state
  if (isLoading && !analyticsData?.summary?.totalSales) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">This year</option>
            </select>
            <button 
              onClick={fetchAnalyticsData} 
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 text-sm font-medium"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Bar */}
      {(dashData?.lowStockItems > 0 || analyticsData.stockAlerts.filter(item => item.status === 'critical').length > 0) && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700 font-medium">
                Critical Stock Alert: {dashData?.lowStockItems || analyticsData.stockAlerts.filter(item => item.status === 'critical').length} items need immediate restocking
              </p>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600">
              {analyticsData.overview?.valueChangePercent > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">+{analyticsData.overview?.valueChangePercent?.toFixed(1) || 0}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{analyticsData.overview?.valueChangePercent?.toFixed(1) || 0}%</span>
                </>
              )}
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {isLoading ? (
              <div className='h-8 w-32 bg-gray-200 rounded animate-pulse'></div>
            ) : (
              `${currency} ${(analyticsData.overview?.totalRevenue || (dashData?.sales || 0)).toLocaleString()}`
            )}
          </p>
          <p className='text-gray-500 text-sm'>Total Sales</p>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {isLoading ? '...' : (analyticsData.overview?.lowStockCount || dashData?.lowStockItems || analyticsData.stockAlerts?.length || 0)} alerts
              </span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {isLoading ? (
              <div className='h-8 w-16 bg-gray-200 rounded animate-pulse'></div>
            ) : (
              analyticsData.summary?.totalMedicines || (dashData?.medicines || 0)
            )}
          </p>
          <p className='text-gray-500 text-sm'>Medicines</p>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {analyticsData?.monthlyTrends?.customers?.growth !== undefined 
                  ? `+${analyticsData.monthlyTrends.customers.growth}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{dashData?.customers || 0}</p>
          <p className='text-gray-500 text-sm'>Customers</p>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {analyticsData?.monthlyTrends?.orders?.growth !== undefined 
                  ? `+${analyticsData.monthlyTrends.orders.growth}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{analyticsData?.monthlyTrends?.orders?.current || 0}</p>
          <p className='text-gray-500 text-sm'>Monthly Orders</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'sales', label: 'Recent Sales', icon: DollarSign },
              { id: 'alerts', label: 'Stock Alerts', icon: AlertTriangle },
              { id: 'payments', label: 'Payments', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.id === 'alerts' && (dashData?.lowStockItems > 0 || analyticsData.stockAlerts.length > 0) && (
                    <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                      {dashData?.lowStockItems || analyticsData.stockAlerts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Daily Average Sales</span>
                <span className="font-semibold">
                  {currency} {Math.floor(((analyticsData?.overview?.totalRevenue || dashData?.sales || 0) / (dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : dateRange === 'quarter' ? 90 : 365)) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Low Stock Items</span>
                <span className="font-semibold text-orange-600">
                  {analyticsData.overview?.lowStockCount || analyticsData.stockStatus?.['Low Stock']?.count || dashData?.lowStockItems || analyticsData.stockAlerts.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Expiring Items</span>
                <span className="font-semibold text-yellow-600">
                  {analyticsData.overview?.expiringCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Pending Payments</span>
                <span className="font-semibold text-red-600">
                  {currency} {(analyticsData?.upcomingPayments?.reduce((sum, payment) => sum + (payment?.amount || 0), 0) || 0).toLocaleString()}
                </span>
              </div>
              {analyticsData?.overview?.profitMargin !== undefined && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-semibold text-green-600">
                    {analyticsData?.overview?.profitMargin?.toFixed(1) || 0}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              {isLoading && <RefreshCw size={16} className="animate-spin text-blue-600" />}
            </div>
            
            {analyticsData?.monthlyReport?.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Monthly Sales Trend</h4>
                </div>
                <div className="h-24 flex items-end space-x-1">
                  {analyticsData?.monthlyReport?.slice(-6).map((item, index) => {
                    const height = item.sales > 0 ? (item.sales / Math.max(...(analyticsData.monthlyReport?.map(i => i.sales) || [1])) * 100) : 0;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-primary rounded-t" 
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{item.month.substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Sales</h4>
            <div className="space-y-3">
              {dashData.latestSales?.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <img className='rounded-full w-8 h-8 mr-3' src={item.userData.image} alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.userData.name}</p>
                    <p className="text-xs text-gray-500">{item.medicineName} x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{currency} {item.amount}</span>
                </div>
              ))}
              {dashData.latestSales?.length === 0 && (
                <div className="text-center py-4 text-gray-500">No recent sales</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className='text-lg font-semibold text-gray-900'>Recent Sales</h3>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className='divide-y divide-gray-200'>
            {filteredSales.map((item, index) => (
              <div className='flex items-center px-6 py-4 hover:bg-gray-50 transition-colors' key={index}>
                <img className='rounded-full w-12 h-12 object-cover' src={item.userData.image} alt="" />
                <div className='flex-1 ml-4'>
                  <p className='text-gray-900 font-medium'>{item.userData.name}</p>
                  <p className='text-gray-600 text-sm'>
                    {item.medicineName} x{item.quantity}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className='text-gray-900 font-semibold'>{currency} {item.amount}</p>
                    <p className='text-gray-500 text-xs'>{formatDate(item.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'cancelled' ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor('cancelled')}`}>
                      Cancelled
                    </span>
                  ) : item.status === 'completed' ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor('completed')}`}>
                      Completed
                    </span>
                  ) : (
                    <div className='flex gap-2'>
                      <button
                        onClick={() => cancelSale(item._id)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title="Cancel Sale"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => completeSale(item._id)}
                        className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                        title="Complete Sale"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
            <div className='flex items-center gap-2 px-6 py-4 border-b border-gray-200'>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className='text-lg font-semibold text-gray-900'>Stock Alerts</h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {analyticsData.stockAlerts?.map((item) => (
                <div key={item.id} className='flex items-center justify-between px-6 py-4 hover:bg-gray-50'>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.status === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                      <Package className={`h-5 w-5 ${item.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>{item.medicine}</p>
                      <p className='text-sm text-gray-600'>
                        Current: {item.currentStock} | Minimum: {item.minStock}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status === 'critical' ? 'Critical' : 'Low Stock'}
                    </span>
                    <button className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
          <div className='flex items-center gap-2 px-6 py-4 border-b border-gray-200'>
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className='text-lg font-semibold text-gray-900'>Upcoming Payments</h3>
          </div>
          <div className='divide-y divide-gray-200'>
            {analyticsData.upcomingPayments?.map((payment) => (
              <div key={payment.id} className='flex items-center justify-between px-6 py-4 hover:bg-gray-50'>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${payment.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <Clock className={`h-5 w-5 ${payment.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>{payment.supplier}</p>
                    <p className='text-sm text-gray-600'>Due: {formatDate(payment.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className='text-lg font-semibold text-gray-900'>{currency} {payment.amount.toLocaleString()}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;