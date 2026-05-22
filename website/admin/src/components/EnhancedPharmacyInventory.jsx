import { useState, useEffect, useContext, useCallback } from "react"
import { PharmacyContext } from "../context/PharmacyContext"
import { AppContext } from "../context/AppContext"
import axios from "axios"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Search, Download, Plus, Edit, Trash2, Eye, RefreshCw, AlertTriangle,
  Info, X, Loader2, Upload, FileText, BarChart3, TrendingUp, Package,
  Calendar, DollarSign, Users, Activity, Filter, SortAsc, SortDesc,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react"

// Enhanced Modal Component
const EnhancedModal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg", 
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl"
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-xl transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Enhanced Stats Card
const StatsCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: "from-primary to-blue-600",
    green: "from-green-500 to-green-600", 
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600"
  }

  return (
    <motion.div
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

// File Upload Component
const FileUploadZone = ({ onFileSelect, acceptedTypes = ".csv,.xlsx,.json" }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
        isDragOver ? 'border-blue-400  #5f6FFF' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={acceptedTypes}
        onChange={(e) => onFileSelect(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Upload className="w-8 h-8 text-gray-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Drop your inventory file here</p>
          <p className="text-sm text-gray-600">or click to browse files</p>
        </div>
      </div>
    </div>
  )
}

// Main Component
const EnhancedPharmacyInventory = () => {
  const { pToken, getInventoryStats, handle401Error } = useContext(PharmacyContext)
  const { backendUrl, currency } = useContext(AppContext)
  
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [modals, setModals] = useState({
    upload: false,
    analytics: false
  })

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/inventory/list`, {
        headers: { pToken }
      })

      if (response.data.success) {
        setInventory(response.data.data)
      } else {
        toast.error(response.data.message || 'Failed to fetch inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      if (!handle401Error(error)) {
        toast.error('Error fetching inventory data')
      }
    } finally {
      setLoading(false)
    }
  }, [backendUrl, pToken, handle401Error])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getInventoryStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [getInventoryStats])

  useEffect(() => {
    if (pToken) {
      fetchInventory()
      fetchStats()
    }
  }, [pToken, fetchInventory, fetchStats])

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${backendUrl}/api/inventory/bulk-upload`, formData, {
        headers: { 
          pToken,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success(`Successfully uploaded ${response.data.imported} items`)
        fetchInventory()
        fetchStats()
        setModals(prev => ({ ...prev, upload: false }))
      } else {
        toast.error(response.data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      if (!handle401Error(error)) {
        toast.error('Error uploading file')
      }
    }
  }

  const openModal = (type) => setModals(prev => ({ ...prev, [type]: true }))
  const closeModal = (type) => setModals(prev => ({ ...prev, [type]: false }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Pharmacy Inventory</h1>
            <p className="text-gray-600">Advanced CRM features for inventory management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal('upload')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Bulk Upload
            </button>
            <button
              onClick={() => openModal('analytics')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2 shadow-lg"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Medicines"
              value={stats.totalMedicines || 0}
              change="+12% this month"
              icon={Package}
              color="blue"
            />
            <StatsCard
              title="Low Stock Items"
              value={stats.lowStock || 0}
              change="Needs attention"
              icon={AlertTriangle}
              color="red"
            />
            <StatsCard
              title="Expiring Soon"
              value={stats.expiringSoon || 0}
              change="Next 30 days"
              icon={Calendar}
              color="yellow"
            />
            <StatsCard
              title="Total Value"
              value={`${currency}${stats.totalValue?.toFixed(2) || '0.00'}`}
              change="+8% this month"
              icon={DollarSign}
              color="green"
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchInventory}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-600">Start by uploading your inventory data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Medicine Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Batch No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.filter(item => 
                    item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((item, index) => (
                    <motion.tr
                      key={item._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.medicine_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">{item.batch_no}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity > 50 ? 'bg-green-100 text-green-800' : 
                          item.quantity > 10 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(item.expiry_date), 'MMM dd, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {currency}{parseFloat(item.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-blue-600 hover: #5f6FFF rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <EnhancedModal
          isOpen={modals.upload}
          onClose={() => closeModal('upload')}
          title="Bulk Upload Inventory"
          size="lg"
        >
          <div className="p-6 space-y-6">
            <FileUploadZone onFileSelect={handleFileUpload} />
            <div className=" #5f6FFF border border-primary-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Required Columns</h4>
              <p className="text-sm text-blue-800">
                medicine_name, batch_no, quantity, expiry_date, manufacturer, category, price
              </p>
            </div>
          </div>
        </EnhancedModal>

        {/* Analytics Modal */}
        <EnhancedModal
          isOpen={modals.analytics}
          onClose={() => closeModal('analytics')}
          title="Inventory Analytics"
          size="xl"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Stock Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">High Stock (&gt;50)</span>
                    <span className="font-medium text-blue-900">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Medium Stock (10-50)</span>
                    <span className="font-medium text-blue-900">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Low Stock (&lt;10)</span>
                    <span className="font-medium text-blue-900">10%</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Painkillers</span>
                    <span className="font-medium text-green-900">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Antibiotics</span>
                    <span className="font-medium text-green-900">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Vitamins</span>
                    <span className="font-medium text-green-900">20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Others</span>
                    <span className="font-medium text-green-900">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EnhancedModal>
      </div>
    </div>
  )
}

export default EnhancedPharmacyInventory
