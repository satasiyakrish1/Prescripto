import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSearch, FaSpinner, FaEye, FaPrint, FaTimes } from 'react-icons/fa';
import { PharmacyContext } from '../context/PharmacyContext';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';

const SalesHistory = () => {
  const { pToken, handle401Error } = useContext(PharmacyContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const receiptRef = React.useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const fetchSales = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/pharmacy/sell?page=${page}&limit=10${search ? `&search=${search}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${pToken}`,
          },
        }
      );
      setSales(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      if (!handle401Error(err)) {
        setError('Failed to fetch sales history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pToken) {
      fetchSales(currentPage, searchTerm);
    }
  }, [pToken, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSales(1, searchTerm);
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy hh:mm a');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Sales History</h2>
      
      <form onSubmit={handleSearch} className="mb-4 flex">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by invoice ID or customer name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            <FaSearch />
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-primary text-2xl" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : sales.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No sales found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoice_id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.sold_at || sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {sale.customer || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      ₹{sale.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          sale.status.toLowerCase()
                        )}`}
                      >
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleViewSale(sale)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-600'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-600'}`}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sale Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="hidden">
              <Receipt ref={receiptRef} sale={selectedSale} />
            </div>
            
            <div className="mb-4">
              <button
                onClick={handlePrint}
                className="flex items-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                <FaPrint className="mr-2" /> Print Receipt
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
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
                <p className="text-sm">{selectedSale.customer || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Status:</p>
                <p className="text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                      selectedSale.status.toLowerCase()
                    )}`}
                  >
                    {selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Method:</p>
                <p className="text-sm">{selectedSale.payment_method}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Payment Status:</p>
                <p className="text-sm">{selectedSale.payment_status || 'Completed'}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Items</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
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
                  {selectedSale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between py-1">
                <span className="text-sm font-semibold">Subtotal:</span>
                <span className="text-sm">₹{selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-sm font-semibold">Discount:</span>
                  <span className="text-sm">₹{selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-sm font-semibold">GST:</span>
                <span className="text-sm">₹{selectedSale.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span>Total:</span>
                <span>₹{selectedSale.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;