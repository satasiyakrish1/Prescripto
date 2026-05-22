import React, { useState, useEffect, useContext } from 'react'
import { PharmacyContext } from '../context/PharmacyContext'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Package, TrendingUp, Users, DollarSign, AlertTriangle, Calendar,
  ShoppingCart, Activity, BarChart3, RefreshCw, Eye, Download,
  CheckCircle, Clock, XCircle, User, Phone, Mail, MapPin
} from 'lucide-react'

// Stats Card Component
const StatsCard = ({ title, value, change, icon: Icon, color = "blue", loading = false }) => {
  const colorClasses = {
    blue: "from-primary to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600"
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// Sales Table Component
const SalesTable = ({ sales, loading = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          <button className="text-blue-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            <Eye className="w-4 h-4" />
            View All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.map((sale, index) => (
              <motion.tr
                key={sale._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      className="h-8 w-8 rounded-full object-cover" 
                      src={sale.userData?.image || `https://ui-avatars.com/api/?name=${sale.userData?.name}&background=random`} 
                      alt={sale.userData?.name} 
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{sale.userData?.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sale.medicineName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sale.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">${sale.amount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                    {getStatusIcon(sale.status)}
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(sale.date), 'MMM dd, yyyy')}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Profile Card Component
const ProfileCard = ({ profile, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Profile not available</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <img 
          className="w-16 h-16 rounded-full object-cover border-4 border-blue-100" 
          src={profile.image || `https://ui-avatars.com/api/?name=${profile.name}&background=4F46E5&color=fff&size=64`}
          alt={profile.name} 
        />
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
          <p className="text-gray-600">Pharmacy Profile</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-gray-600">Email:</span>
          <span className="font-medium text-gray-900">{profile.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Phone:</span>
          <span className="font-medium text-gray-900">{profile.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-gray-600">Address:</span>
          <span className="font-medium text-gray-900">{profile.address}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Activity className="w-4 h-4 text-purple-500" />
          <span className="text-gray-600">License:</span>
          <span className="font-medium text-gray-900">{profile.licenseNumber}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-gray-600">Hours:</span>
          <span className="font-medium text-gray-900">{profile.operatingHours}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Main Working Pharmacy Dashboard Component
const WorkingPharmacyDashboard = () => {
  const { pToken, dashData, profileData, inventoryStats, getDashData, getProfileData, getInventoryStats, handle401Error } = useContext(PharmacyContext)
  const { backendUrl, currency } = useContext(AppContext)
  
  const [loading, setLoading] = useState({
    dashboard: true,
    profile: true,
    stats: true
  })

  const [refreshing, setRefreshing] = useState(false)
  const [recentSales, setRecentSales] = useState([])
  const [salesAnalytics, setSalesAnalytics] = useState(null)

  // Fetch recent sales
  const fetchRecentSales = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/pharmacy/sales/recent?limit=5`, {
        headers: { pToken }
      })
      
      if (response.data.success) {
        setRecentSales(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching recent sales:', error)
      if (!handle401Error(error)) {
        toast.error('Error fetching recent sales')
      }
    }
  }

  // Fetch sales analytics
  const fetchSalesAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/pharmacy/sales/analytics?period=30`, {
        headers: { pToken }
      })
      
      if (response.data.success) {
        setSalesAnalytics(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching sales analytics:', error)
      if (!handle401Error(error)) {
        toast.error('Error fetching sales analytics')
      }
    }
  }

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch dashboard data
      setLoading(prev => ({ ...prev, dashboard: true }))
      await getDashData()
      setLoading(prev => ({ ...prev, dashboard: false }))
      
      // Fetch profile data
      setLoading(prev => ({ ...prev, profile: true }))
      await getProfileData()
      setLoading(prev => ({ ...prev, profile: false }))
      
      // Fetch inventory stats
      setLoading(prev => ({ ...prev, stats: true }))
      await getInventoryStats()
      setLoading(prev => ({ ...prev, stats: false }))
      
      // Fetch recent sales
      await fetchRecentSales()
      
      // Fetch sales analytics
      await fetchSalesAnalytics()
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading dashboard data')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (pToken) {
      fetchAllData()
    }
  }, [pToken])

  // Handle refresh
  const handleRefresh = () => {
    fetchAllData()
    toast.success('Dashboard refreshed!')
  }

  if (!pToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Please login to access the pharmacy dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacy Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your pharmacy today.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Sales"
            value={salesAnalytics ? `${currency}${salesAnalytics.summary.totalSales?.toLocaleString() || '0'}` : dashData ? `${currency}${dashData.sales?.toLocaleString() || '0'}` : `${currency}0`}
            change="+12% from last month"
            icon={DollarSign}
            color="green"
            loading={loading.dashboard}
          />
          <StatsCard
            title="Medicines"
            value={dashData?.medicines || '0'}
            change="+5 new this week"
            icon={Package}
            color="blue"
            loading={loading.dashboard}
          />
          <StatsCard
            title="Total Orders"
            value={salesAnalytics ? salesAnalytics.summary.totalOrders?.toLocaleString() || '0' : dashData?.customers || '0'}
            change="+8% this month"
            icon={Users}
            color="purple"
            loading={loading.dashboard}
          />
          <StatsCard
            title="Low Stock Items"
            value={inventoryStats?.lowStock || dashData?.lowStockItems || '0'}
            change="Needs attention"
            icon={AlertTriangle}
            color={inventoryStats?.lowStock > 0 ? "red" : "green"}
            loading={loading.stats}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <SalesTable 
              sales={recentSales.length > 0 ? recentSales.map(sale => ({
                _id: sale._id,
                userData: {
                  name: typeof sale.customer === 'object' ? sale.customer.name : sale.customer,
                  image: `https://ui-avatars.com/api/?name=${typeof sale.customer === 'object' ? sale.customer.name : sale.customer}&background=random`
                },
                medicineName: sale.items.map(item => item.name).join(', '),
                quantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
                amount: sale.total_amount,
                date: sale.sold_at,
                status: sale.status.toLowerCase()
              })) : dashData?.latestSales || []} 
              loading={loading.dashboard}
            />
          </div>
          
          {/* Profile Card - Takes 1 column */}
          <div>
            <ProfileCard 
              profile={profileData} 
              loading={loading.profile}
            />
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Expiring Soon"
            value={inventoryStats?.expiringSoon || dashData?.expiringItems || '0'}
            change="Next 30 days"
            icon={Calendar}
            color="yellow"
            loading={loading.stats}
          />
          <StatsCard
            title="Inventory Value"
            value={inventoryStats?.totalValue ? `${currency}${inventoryStats.totalValue.toLocaleString()}` : `${currency}0`}
            change="+3% this month"
            icon={BarChart3}
            color="blue"
            loading={loading.stats}
          />
          <StatsCard
            title="Today's Orders"
            value="23"
            change="+15% from yesterday"
            icon={ShoppingCart}
            color="green"
            loading={false}
          />
        </div>
      </div>
    </div>
  )
}

export default WorkingPharmacyDashboard
