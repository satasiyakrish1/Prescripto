import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { PharmacyContext } from '../../context/PharmacyContext';
import { AppContext } from '../../context/AppContext';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  User,
  CreditCard,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowDown,
  ArrowUp,
  Sliders
} from 'react-feather';

// Receipt component for printing
const Receipt = React.forwardRef(({ sale, pharmacyInfo }, ref) => {
  if (!sale) return null;

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div ref={ref} className="p-6 bg-white w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{pharmacyInfo?.name || 'Pharmacy'}</h2>
        <p className="text-sm text-gray-600">{pharmacyInfo?.address || 'Address'}</p>
        <p className="text-sm text-gray-600">{pharmacyInfo?.phone || 'Phone'}</p>
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Invoice:</span>
          <span>{sale.invoice_id}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Date:</span>
          <span>{formatDate(sale.sold_at || sale.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Customer:</span>
          <span>{typeof sale.customer === 'object' ? sale.customer.name : sale.customer || 'Walk-in'}</span>
        </div>
      </div>

      <table className="w-full mb-4">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2">Item</th>
            <th className="text-center py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.name}</td>
              <td className="text-center py-2">{item.quantity}</td>
              <td className="text-right py-2">{item.price?.toFixed(2)}</td>
              <td className="text-right py-2">{item.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>{sale.subtotal?.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between mb-1">
            <span>Discount:</span>
            <span>-{sale.discount?.toFixed(2)}</span>
          </div>
        )}
        {sale.gst > 0 && (
          <div className="flex justify-between mb-1">
            <span>GST:</span>
            <span>{sale.gst?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
          <span>Total:</span>
          <span>{sale.total_amount?.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-200">
        <p>Thank you for your purchase!</p>
        <p>Powered by Prescripto</p>
      </div>
    </div>
  );
});

const SalesHistory = () => {
  const { pToken, handle401Error, getProfileData, profileData } = useContext(PharmacyContext);
  const { backendUrl, currency } = useContext(AppContext);
  
  // State variables
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('sold_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    paymentMethod: 'all'
  });
  
  const receiptRef = useRef();

  // Handle printing receipt
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment method badge class
  const getPaymentMethodBadgeClass = (method) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'bg-blue-100 text-blue-800';
      case 'upi':
        return 'bg-purple-100 text-purple-800';
      case 'card':
        return 'bg-indigo-100 text-indigo-800';
      case 'netbanking':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch sales data from API
  const fetchSales = async (page = 1, search = '', filterParams = {}, sort = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      
      if (search) params.append('search', search);
      if (filterParams.status && filterParams.status !== 'all') params.append('status', filterParams.status);
      if (filterParams.startDate) params.append('startDate', filterParams.startDate);
      if (filterParams.endDate) params.append('endDate', filterParams.endDate);
      if (filterParams.paymentMethod && filterParams.paymentMethod !== 'all') params.append('paymentMethod', filterParams.paymentMethod);
      
      // Add sorting parameters
      if (sort.field) params.append('sortField', sort.field);
      if (sort.direction) params.append('sortDirection', sort.direction);
      
      const response = await axios.get(
        `${backendUrl}/api/pharmacy/sales-history?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${pToken}`,
          },
        }
      );
      
      if (response.data.success) {
        setSales(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalSales(response.data.pagination.total);
      } else {
        setError(response.data.message || 'Failed to fetch sales history');
        toast.error(response.data.message || 'Failed to fetch sales history');
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      if (!handle401Error(err)) {
        setError('Failed to fetch sales history');
        toast.error(err.response?.data?.message || 'Failed to fetch sales history');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    if (pToken) {
      fetchSales(currentPage, searchTerm, filters, { field: sortField, direction: sortDirection });
    }
  }, [pToken, currentPage, sortField, sortDirection]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSales(1, searchTerm, filters, { field: sortField, direction: sortDirection });
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchSales(1, searchTerm, filters, { field: sortField, direction: sortDirection });
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
      paymentMethod: 'all'
    });
  };

  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle view sale details
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  // Handle download PDF
  const handleDownloadPDF = (sale) => {
    toast.success('PDF download started');
    // Implement PDF download functionality
  };

  // Handle update sale status
  const handleUpdateStatus = async (saleId, newStatus) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/pharmacy/sales-history/${saleId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${pToken}`,
          },
        }
      );
      
      if (response.data.success) {
        toast.success('Sale status updated successfully');
        setSelectedSale(response.data.data);
        fetchSales(currentPage, searchTerm, filters, { field: sortField, direction: sortDirection });
      } else {
        toast.error(response.data.message || 'Failed to update sale status');
      }
    } catch (err) {
      console.error('Error updating sale status:', err);
      if (!handle401Error(err)) {
        toast.error(err.response?.data?.message || 'Failed to update sale status');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
            <p className="text-gray-600 mt-1">View and manage your pharmacy sales records</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2  #5f6FFF text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center transition-colors"
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            <button
              onClick={() => fetchSales(currentPage, searchTerm, filters, { field: sortField, direction: sortDirection })}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice ID or customer name"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Sliders size={16} className="mr-2" />
                Filter Options
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Netbanking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-600">Loading sales data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchSales(currentPage, searchTerm, filters)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Try Again
            </button>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
            <p className="text-gray-600">
              {filters.status !== 'all' || filters.startDate || filters.endDate || filters.paymentMethod !== 'all' || searchTerm
                ? 'No sales match your current filters. Try adjusting your search criteria.'
                : 'Start making sales to see them here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('invoice_id')}
                    >
                      <div className="flex items-center">
                        Invoice ID
                        {sortField === 'invoice_id' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('sold_at')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === 'sold_at' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === 'total_amount' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {sale.invoice_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.sold_at || sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof sale.customer === 'object' ? sale.customer.name : sale.customer || 'Walk-in'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {currency || '₹'}{sale.total_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentMethodBadgeClass(sale.payment_method)}`}
                        >
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(sale.status)}`}
                        >
                          {sale.status.charAt(0).toUpperCase() + sale.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewSale(sale)}
                          className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{sales.length}</span> of{' '}
                    <span className="font-medium">{totalSales}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage > 3 ? currentPage - 3 + i + 1 : i + 1;
                      if (pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10  #5f6FFF border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText size={20} className="mr-2 text-blue-600" />
                Sale Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="hidden">
              <Receipt ref={receiptRef} sale={selectedSale} pharmacyInfo={profileData} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Invoice ID</p>
                      <p className="text-base font-semibold">{selectedSale.invoice_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-base">{formatDate(selectedSale.sold_at || selectedSale.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer</p>
                      <p className="text-base flex items-center">
                        <User size={16} className="mr-1 text-gray-400" />
                        {typeof selectedSale.customer === 'object' ? selectedSale.customer.name : selectedSale.customer || 'Walk-in'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-base">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedSale.status)}`}
                        >
                          {selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1).toLowerCase()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-base flex items-center">
                        <CreditCard size={16} className="mr-1 text-gray-400" />
                        {selectedSale.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-base font-semibold flex items-center">
                        <DollarSign size={16} className="mr-1 text-gray-400" />
                        {currency || '₹'}{selectedSale.total_amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                <h4 className="font-medium text-gray-800 mb-3">Items</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                            {currency || '₹'}{item.price?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {currency || '₹'}{item.total?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedSale.note && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-gray-700">
                      {selectedSale.note}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{currency || '₹'}{selectedSale.subtotal?.toFixed(2)}</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{currency || '₹'}{selectedSale.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedSale.gst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST</span>
                        <span>{currency || '₹'}{selectedSale.gst?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{currency || '₹'}{selectedSale.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center transition-colors"
                  >
                    <Printer size={16} className="mr-2" /> Print Receipt
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedSale)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center transition-colors"
                  >
                    <Download size={16} className="mr-2" /> Download PDF
                  </button>
                </div>

                {selectedSale.status !== 'cancelled' && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Actions</h4>
                    <div className="space-y-3">
                      {selectedSale.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedSale._id, 'completed')}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center transition-colors"
                        >
                          <CheckCircle size={16} className="mr-2" /> Mark as Completed
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(selectedSale._id, 'cancelled')}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center transition-colors"
                      >
                        <XCircle size={16} className="mr-2" /> Cancel Sale
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;