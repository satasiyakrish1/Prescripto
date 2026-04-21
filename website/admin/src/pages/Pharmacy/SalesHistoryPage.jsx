import React, { useState, useEffect, useContext, useRef } from 'react';
import { PharmacyContext } from '../../context/PharmacyContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import {
  Search,
  Printer,
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'react-feather';
import Receipt from '../../components/Receipt';

const SalesHistoryPage = () => {
  const { pToken, handle401Error } = useContext(PharmacyContext);
  const { backendUrl, currency } = useContext(AppContext);
  
  // State variables
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const receiptRef = useRef();

  // Handle printing receipt
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get CSS class for status badge
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

  // Fetch sales data from API
  const fetchSales = async (page = 1, search = '', filterParams = {}) => {
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
      
      const response = await axios.get(
        `${backendUrl}/api/pharmacy/sell?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${pToken}`,
          },
        }
      );
      
      if (response.data.success) {
        setSales(response.data.data);
        setTotalPages(response.data.pagination.pages);
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
      fetchSales(currentPage, searchTerm, filters);
    }
  }, [pToken, currentPage]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSales(1, searchTerm, filters);
  };

  // Handle filter application
  const applyFilters = () => {
    setCurrentPage(1);
    fetchSales(1, searchTerm, filters);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    fetchSales(1, searchTerm, { status: 'all' });
    setShowFilters(false);
  };

  // View sale details
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  // Generate PDF invoice
  const generatePDF = () => {
    if (!selectedSale) return;
    toast.success('PDF download started');
    // In a real implementation, this would use a PDF library like jsPDF
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2  #5f6FFF text-blue-600 rounded-lg hover:bg-blue-100 flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          <button
            onClick={() => fetchSales(currentPage, searchTerm, filters)}
            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filter Sales</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by invoice ID or customer name"
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-red-500 text-lg font-medium">{error}</p>
            <button
              onClick={() => fetchSales(currentPage, searchTerm, filters)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
            >
              Try Again
            </button>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No sales found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || filters.status !== 'all' || filters.startDate || filters.endDate
                ? 'Try adjusting your search or filters'
                : 'Start making sales to see them here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
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
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            sale.status
                          )}`}
                        >
                          {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewSale(sale)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
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
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
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
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sale Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="hidden">
              <Receipt ref={receiptRef} sale={selectedSale} />
            </div>
            
            <div className="mb-4 flex space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                <Printer className="mr-2" size={16} /> Print Receipt
              </button>
              <button
                onClick={generatePDF}
                className="flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                <Download className="mr-2" size={16} /> Download PDF
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-semibold">Invoice ID:</p>
                <p className="text-sm">{selectedSale.invoice_id}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Date:</p>
                <p className="text-sm">{formatDate(selectedSale.sold_at || selectedSale.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Customer:</p>
                <p className="text-sm">{typeof selectedSale.customer === 'object' ? selectedSale.customer.name : selectedSale.customer || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Status:</p>
                <p className="text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                      selectedSale.status
                    )}`}
                  >
                    {selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Method:</p>
                <p className="text-sm">{selectedSale.payment_method?.charAt(0).toUpperCase() + selectedSale.payment_method?.slice(1) || 'Cash'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Status:</p>
                <p className="text-sm">{selectedSale.payment_status || 'Completed'}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicine
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedSale.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {currency || '₹'}{item.price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          {currency || '₹'}{item.total?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between py-1">
                <span className="text-sm font-semibold">Subtotal:</span>
                <span className="text-sm">{currency || '₹'}{selectedSale.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-sm font-semibold">Discount:</span>
                  <span className="text-sm">{currency || '₹'}{selectedSale.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-sm font-semibold">GST:</span>
                <span className="text-sm">{currency || '₹'}{selectedSale.gst?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span>Total:</span>
                <span>{currency || '₹'}{selectedSale.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            {selectedSale.note && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Note:</p>
                <p className="text-sm text-yellow-700">{selectedSale.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;