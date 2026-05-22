import { useState, useEffect, useContext } from "react"
import { PharmacyContext } from "../../context/PharmacyContext"
import { AppContext } from "../../context/AppContext"
import { AdminContext } from "../../context/AdminContext"
import axios from "axios"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Info,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Form Component
const InventoryForm = ({ formData, setFormData, onSubmit, onCancel, isLoading, errors = {} }) => {
  const categories = ["Painkiller", "Antibiotic", "Antiviral", "Antihistamine", "Vitamin", "Supplement", "Other"]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const inputClass = (fieldName) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      errors[fieldName] ? "border-red-300 bg-red-50" : "border-gray-300"
    }`

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium text-sm">Please correct the following errors:</p>
          <ul className="list-disc pl-5 text-sm text-red-600 mt-1">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="medicine_name"
            value={formData.medicine_name}
            onChange={handleChange}
            className={inputClass("medicine_name")}
            placeholder="Enter medicine name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="batch_no"
            value={formData.batch_no}
            onChange={handleChange}
            className={inputClass("batch_no")}
            placeholder="Enter batch number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className={inputClass("quantity")}
            min="0"
            placeholder="Enter quantity"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className={inputClass("expiry_date")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manufacturer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className={inputClass("manufacturer")}
            placeholder="Enter manufacturer"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClass("category")}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`pl-8 ${inputClass("price")}`}
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{isLoading ? "Saving..." : "Save"}</span>
        </button>
      </div>
    </form>
  )
}

// Status Badge Component
const StatusBadge = ({ status }) => {
  const variants = {
    Expired: "bg-red-100 text-red-800",
    "Low Stock": "bg-yellow-100 text-yellow-800",
    "In Stock": "bg-green-100 text-green-800",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status] || "bg-gray-100 text-gray-800"}`}>
      {status === "Expired" || status === "Low Stock" ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : null}
      {status}
    </span>
  )
}

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) rangeWithDots.push(1, "...")
    else rangeWithDots.push(1)

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) rangeWithDots.push("...", totalPages)
    else if (totalPages > 1) rangeWithDots.push(totalPages)

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-3 py-1 rounded-lg ${
              page === currentPage ? "bg-primary-600 text-white" : page === "..." ? "cursor-default" : "hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Main Component
const PharmacyInventory = () => {
  const { pToken, handle401Error } = useContext(PharmacyContext)
  const { aToken } = useContext(AdminContext) || {}
  const { currency, backendUrl } = useContext(AppContext)

  // State
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    totalValue: 0,
  })

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("medicine_name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modals
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    delete: false,
    details: false,
  })
  const [currentItem, setCurrentItem] = useState(null)
  const [formData, setFormData] = useState({
    medicine_name: "",
    batch_no: "",
    quantity: "",
    expiry_date: "",
    manufacturer: "",
    category: "",
    price: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [actionLoading, setActionLoading] = useState({
    add: false,
    update: false,
    delete: false,
  })

  const categories = ["Painkiller", "Antibiotic", "Antiviral", "Antihistamine", "Vitamin", "Supplement", "Other"]

  // Helper Functions
  const getAuthHeaders = () => (aToken ? { aToken } : pToken ? { pToken } : {})

  const resetForm = () => {
    setFormData({
      medicine_name: "",
      batch_no: "",
      quantity: "",
      expiry_date: "",
      manufacturer: "",
      category: "",
      price: "",
    })
    setFormErrors({})
    setCurrentItem(null)
  }

  const openModal = (type, item = null) => {
    setModals((prev) => ({ ...prev, [type]: true }))
    if (item) {
      setCurrentItem(item)
      if (type === "edit") {
        setFormData({
          medicine_name: item.medicine_name,
          batch_no: item.batch_no,
          quantity: item.quantity,
          expiry_date: format(new Date(item.expiry_date), "yyyy-MM-dd"),
          manufacturer: item.manufacturer,
          category: item.category,
          price: item.price,
        })
      }
    }
  }

  const closeModal = (type) => {
    setModals((prev) => ({ ...prev, [type]: false }))
    if (type === "add" || type === "edit") resetForm()
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.medicine_name.trim()) errors.medicine_name = "Medicine name is required"
    if (!formData.batch_no.trim()) errors.batch_no = "Batch number is required"
    if (!formData.quantity || formData.quantity <= 0) errors.quantity = "Valid quantity is required"
    if (!formData.expiry_date) errors.expiry_date = "Expiry date is required"
    if (!formData.manufacturer.trim()) errors.manufacturer = "Manufacturer is required"
    if (!formData.category) errors.category = "Category is required"
    if (!formData.price || formData.price <= 0) errors.price = "Valid price is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // API Functions
  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      if (!backendUrl || (!aToken && !pToken)) {
        toast.error("Configuration error. Please login again.")
        return
      }

      const response = await axios.get(`${backendUrl}/api/inventory`, {
        headers: getAuthHeaders(),
        params: {
          search: searchTerm,
          category: selectedCategory !== "all" ? selectedCategory : "",
          status: statusFilter !== "all" ? statusFilter : "",
          sortBy,
          sortOrder,
          page: currentPage,
          limit: itemsPerPage,
        },
        timeout: 15000,
      })

      if (response.data.success) {
        setInventory(response.data.data || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalItems(response.data.total || 0)
        if (isRefresh) toast.success("Inventory refreshed")
      } else {
        toast.error(response.data.message || "Failed to fetch inventory")
        setInventory([])
      }
    } catch (error) {
      if (handle401Error && handle401Error(error)) return
      toast.error("Error fetching inventory data")
      setInventory([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      if (!backendUrl || (!aToken && !pToken)) return

      const response = await axios.get(`${backendUrl}/api/inventory/stats`, {
        headers: getAuthHeaders(),
        timeout: 15000,
      })

      if (response.data.success) {
        setStats(response.data.data || stats)
      }
    } catch (error) {
      if (handle401Error && handle401Error(error)) return
      console.error("Error fetching stats:", error)
    }
  }

  const handleSubmit = async (isEdit = false) => {
    if (!validateForm()) {
      toast.error("Please correct the errors in the form")
      return
    }

    const actionType = isEdit ? "update" : "add"
    setActionLoading((prev) => ({ ...prev, [actionType]: true }))

    try {
      const url = isEdit ? `${backendUrl}/api/inventory/${currentItem._id}` : `${backendUrl}/api/inventory`

      const method = isEdit ? "put" : "post"
      const response = await axios[method](url, formData, { headers: getAuthHeaders() })

          if (response.data.success) {
        toast.success(`Medicine ${isEdit ? "updated" : "added"} successfully`)
        closeModal(isEdit ? "edit" : "add")
        fetchInventory()
        fetchStats()
          } else {
        toast.error(response.data.message || `Failed to ${isEdit ? "update" : "add"} medicine`)
          }
        } catch (error) {
      if (handle401Error && handle401Error(error)) return
      toast.error(`Error ${isEdit ? "updating" : "adding"} medicine`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionType]: false }))
    }
  }

  const handleDelete = async () => {
    if (!currentItem) return

    setActionLoading((prev) => ({ ...prev, delete: true }))

    try {
      const response = await axios.delete(`${backendUrl}/api/inventory/${currentItem._id}`, {
        headers: getAuthHeaders(),
      })

      if (response.data.success) {
        toast.success(`${currentItem.medicine_name} deleted successfully`)
        closeModal("delete")
        fetchInventory()
        fetchStats()
      } else {
        toast.error(response.data.message || "Failed to delete medicine")
      }
    } catch (error) {
      if (handle401Error && handle401Error(error)) return
      toast.error("Error deleting medicine")
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: false }))
    }
  }

  const exportCSV = () => {
    if (inventory.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = [
      "Medicine Name",
      "Batch No",
      "Quantity",
      "Expiry Date",
      "Manufacturer",
      "Category",
      "Price",
      "Status",
    ]
    const csvContent = [
      headers.join(","),
      ...inventory.map((item) =>
        [
          `"${item.medicine_name}"`,
          `"${item.batch_no}"`,
          item.quantity,
          format(new Date(item.expiry_date), "yyyy-MM-dd"),
          `"${item.manufacturer}"`,
          `"${item.category}"`,
          item.price,
          `"${item.status}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `inventory_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Inventory exported successfully")
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // Effects
  useEffect(() => {
    fetchInventory()
  }, [currentPage, itemsPerPage, sortBy, sortOrder, selectedCategory, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => fetchInventory(), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory...</p>
    </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Pharmacy Inventory</h1>
      <button 
        onClick={() => {
                fetchInventory(true)
                fetchStats()
        }}
              disabled={refreshing}
              className="p-2 text-blue-600 hover: #5f6FFF rounded-lg transition-colors"
      >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
          <p className="text-gray-600 mt-1">Manage your medicine inventory efficiently</p>
          </div>
            <button
              onClick={() => {
            openModal("add")
            resetForm()
              }}
          className="bg-primary-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
          <Plus className="w-4 h-4" />
          Add Medicine
            </button>
          </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Items", value: stats.totalItems, color: "blue" },
          { label: "Low Stock", value: stats.lowStockCount, color: "yellow" },
          { label: "Expired", value: stats.expiredCount, color: "red" },
          { label: "Expiring Soon", value: stats.expiringSoonCount, color: "orange" },
          { label: "Total Value", value: `${currency}${stats.totalValue.toFixed(2)}`, color: "green" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white p-6 rounded-xl shadow-sm border-l-4 border-${stat.color}-500`}
          >
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</h3>
            <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Expired">Expired</option>
          </select>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600">
            Showing {inventory.length} of {totalItems} items
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-600">No inventory items found</p>
            <p className="text-gray-500 mt-2">Add medicines to get started</p>
          <button
              onClick={() => openModal("add")}
              className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
              Add Medicine
          </button>
        </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: "medicine_name", label: "Medicine" },
                      { key: "batch_no", label: "Batch No" },
                      { key: "quantity", label: "Quantity" },
                      { key: "expiry_date", label: "Expiry Date" },
                      { key: "category", label: "Category" },
                      { key: "price", label: "Price" },
                      { key: "status", label: "Status" },
                      { key: "actions", label: "Actions" },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          key !== "actions" && key !== "batch_no" && key !== "category" && key !== "status"
                            ? "cursor-pointer hover:bg-gray-100"
                            : ""
                        }`}
                        onClick={() =>
                          key !== "actions" &&
                          key !== "batch_no" &&
                          key !== "category" &&
                          key !== "status" &&
                          handleSort(key)
                        }
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {key !== "actions" &&
                            key !== "batch_no" &&
                            key !== "category" &&
                            key !== "status" &&
                            (sortBy === key ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            ))}
            </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.map((item, index) => (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
            <div>
                          <div className="font-medium text-gray-900">{item.medicine_name}</div>
                          <div className="text-sm text-gray-500">{item.manufacturer}</div>
            </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.batch_no}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(item.expiry_date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {currency}
                        {item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal("details", item)}
                            className="p-1 text-blue-600 hover: #5f6FFF rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("edit", item)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("delete", item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
            </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
            </div>

      {/* Modals */}
      <Modal isOpen={modals.add} onClose={() => closeModal("add")} title="Add New Medicine">
        <InventoryForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={() => handleSubmit(false)}
          onCancel={() => closeModal("add")}
          isLoading={actionLoading.add}
          errors={formErrors}
        />
      </Modal>

      <Modal isOpen={modals.edit} onClose={() => closeModal("edit")} title="Edit Medicine">
        <InventoryForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={() => handleSubmit(true)}
          onCancel={() => closeModal("edit")}
          isLoading={actionLoading.update}
          errors={formErrors}
        />
      </Modal>

      <Modal isOpen={modals.delete} onClose={() => closeModal("delete")} title="Confirm Deletion" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Warning</h3>
              <p className="text-sm text-red-700 mt-1">
                Are you sure you want to delete <strong>{currentItem?.medicine_name}</strong>? This action cannot be
                undone.
              </p>
            </div>
            </div>
          <div className="flex justify-end gap-3">
              <button
              onClick={() => closeModal("delete")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
              Cancel
              </button>
              <button
              onClick={handleDelete}
              disabled={actionLoading.delete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading.delete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
              </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={modals.details} onClose={() => closeModal("details")} title="Medicine Details">
        {currentItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Medicine Name</label>
                <p className="mt-1 text-sm text-gray-900">{currentItem.medicine_name}</p>
                      </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Batch No</label>
                <p className="mt-1 text-sm text-gray-900">{currentItem.batch_no}</p>
                    </div>
                    <div>
                <label className="block text-sm font-medium text-gray-500">Quantity</label>
                <p className="mt-1 text-sm text-gray-900">{currentItem.quantity}</p>
                    </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Expiry Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(currentItem.expiry_date), "MMM dd, yyyy")}
                </p>
                    </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Manufacturer</label>
                <p className="mt-1 text-sm text-gray-900">{currentItem.manufacturer}</p>
                    </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Category</label>
                <p className="mt-1 text-sm text-gray-900">{currentItem.category}</p>
                    </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Price</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currency}
                  {currentItem.price.toFixed(2)}
                </p>
                      </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={currentItem.status} />
                    </div>
        </div>
      </div>
    </div>
        )}
      </Modal>
    </div>
  )
}

export default PharmacyInventory
