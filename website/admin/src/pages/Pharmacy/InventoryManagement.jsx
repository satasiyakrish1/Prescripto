import React, { useState, useEffect, useContext } from 'react';
import { PharmacyContext } from '../../context/PharmacyContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaFileExport, FaFilePdf } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import { format } from 'date-fns';

const InventoryManagement = () => {
  const { pToken, handle401Error } = useContext(PharmacyContext);
  const { API_URL } = useContext(AppContext);
  
  // State variables
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    totalValue: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('medicine_name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // New item form state
  const [newItem, setNewItem] = useState({
    medicine_name: '',
    batch_no: '',
    quantity: '',
    expiry_date: '',
    manufacturer: '',
    category: '',
    price: ''
  });
  
  // Categories list
  const categories = [
    'Analgesics',
    'Antibiotics',
    'Antihistamines',
    'Antihypertensives',
    'Antipyretics',
    'Cardiovascular',
    'Dermatological',
    'Gastrointestinal',
    'Hormonal',
    'Neurological',
    'Nutritional',
    'Ophthalmic',
    'Respiratory',
    'Vaccines',
    'Others'
  ];
  
  // Fetch inventory data
  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${pToken}` },
        params: {
          search: searchTerm,
          category: selectedCategory,
          status: selectedStatus,
          sortBy,
          sortOrder,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      if (response.data.success) {
        setInventory(response.data.data);
        setTotalPages(response.data.totalPages);
        
        if (response.data.data.length === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        setError('Failed to fetch inventory data');
        toast.error('Failed to fetch inventory data');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      
      if (!handle401Error(err)) {
        setError('Failed to fetch inventory data');
        toast.error('Failed to fetch inventory data');
      }
      
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch inventory statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/inventory/stats`, {
        headers: { Authorization: `Bearer ${pToken}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
      
      handle401Error(err);
    }
  };
  
  // Add new inventory item
  const addInventoryItem = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/inventory`,
        newItem,
        { headers: { Authorization: `Bearer ${pToken}` } }
      );
      
      if (response.data.success) {
        toast.success('Inventory item added successfully');
        setShowAddModal(false);
        resetForm();
        fetchInventory();
        fetchStats();
      } else {
        toast.error('Failed to add inventory item');
      }
    } catch (err) {
      console.error('Error adding inventory item:', err);
      
      if (!handle401Error(err)) {
        if (err.response && err.response.data.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error('Failed to add inventory item');
        }
      }
    }
  };
  
  // Update inventory item
  const updateInventoryItem = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/api/inventory/${currentItem._id}`,
        currentItem,
        { headers: { Authorization: `Bearer ${pToken}` } }
      );
      
      if (response.data.success) {
        toast.success('Inventory item updated successfully');
        setShowEditModal(false);
        fetchInventory();
        fetchStats();
      } else {
        toast.error('Failed to update inventory item');
      }
    } catch (err) {
      console.error('Error updating inventory item:', err);
      
      if (!handle401Error(err)) {
        if (err.response && err.response.data.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error('Failed to update inventory item');
        }
      }
    }
  };
  
  // Delete inventory item
  const deleteInventoryItem = async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/inventory/${currentItem._id}`,
        { headers: { Authorization: `Bearer ${pToken}` } }
      );
      
      if (response.data.success) {
        toast.success('Inventory item deleted successfully');
        setShowDeleteModal(false);
        fetchInventory();
        fetchStats();
      } else {
        toast.error('Failed to delete inventory item');
      }
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      
      if (!handle401Error(err)) {
        if (err.response && err.response.data.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error('Failed to delete inventory item');
        }
      }
    }
  };
  
  // Reset form
  const resetForm = () => {
    setNewItem({
      medicine_name: '',
      batch_no: '',
      quantity: '',
      expiry_date: '',
      manufacturer: '',
      category: '',
      price: ''
    });
  };
  
  // Handle input change for new item
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle input change for editing item
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Prepare CSV data for export
  const csvData = [
    ['Medicine Name', 'Batch No', 'Quantity', 'Expiry Date', 'Manufacturer', 'Category', 'Price', 'Status'],
    ...inventory.map(item => [
      item.medicine_name,
      item.batch_no,
      item.quantity,
      format(new Date(item.expiry_date), 'yyyy-MM-dd'),
      item.manufacturer,
      item.category,
      item.price,
      item.status
    ])
  ];
  
  // Export to PDF (placeholder function)
  const exportToPDF = () => {
    toast.error('PDF export functionality is not implemented yet');
  };
  
  // Effect to fetch inventory on mount and when filters change
  useEffect(() => {
    if (pToken) {
      fetchInventory();
      fetchStats();
    }
  }, [pToken, currentPage, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, itemsPerPage]);
  
  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Expired':
        return 'text-red-600 bg-red-100';
      case 'Low Stock':
        return 'text-yellow-600 bg-yellow-100';
      case 'In Stock':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Items</h3>
          <p className="text-2xl font-bold">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Low Stock</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Expired</h3>
          <p className="text-2xl font-bold text-red-600">{stats.expiredCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Expiring Soon</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.expiringSoonCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm">Total Value</h3>
          <p className="text-2xl font-bold text-blue-600">${stats.totalValue.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search inventory..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          {/* Category Filter */}
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border rounded-lg w-full appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border rounded-lg w-full appearance-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Expired">Expired</option>
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Export Buttons */}
          <CSVLink
            data={csvData}
            filename={`inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaFileExport /> Export CSV
          </CSVLink>
          
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaFilePdf /> Export PDF
          </button>
          
          {/* Add New Item Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaPlus /> Add Item
          </button>
        </div>
      </div>
      
      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('medicine_name')}
              >
                <div className="flex items-center">
                  Medicine Name
                  {sortBy === 'medicine_name' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Batch No
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('quantity')}
              >
                <div className="flex items-center">
                  Quantity
                  {sortBy === 'quantity' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('expiry_date')}
              >
                <div className="flex items-center">
                  Expiry Date
                  {sortBy === 'expiry_date' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Manufacturer
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('category')}
              >
                <div className="flex items-center">
                  Category
                  {sortBy === 'category' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('price')}
              >
                <div className="flex items-center">
                  Price
                  {sortBy === 'price' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortBy === 'status' && (
                    <FaSort className="ml-1" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center">
                  No inventory items found
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.medicine_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.batch_no}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(item.expiry_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.manufacturer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${parseFloat(item.price).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setCurrentItem(item);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center">
          <span className="mr-2">Show</span>
          <select
            className="border rounded px-2 py-1"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="ml-2">entries</span>
        </div>
        
        <div className="flex">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-l-lg bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="px-3 py-1 border-t border-b bg-white">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-r-lg bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                <input
                  type="text"
                  name="medicine_name"
                  value={newItem.medicine_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <input
                  type="text"
                  name="batch_no"
                  value={newItem.batch_no}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={newItem.expiry_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={newItem.manufacturer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={newItem.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={newItem.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addInventoryItem}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Inventory Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                <input
                  type="text"
                  name="medicine_name"
                  value={currentItem.medicine_name}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <input
                  type="text"
                  name="batch_no"
                  value={currentItem.batch_no}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={currentItem.quantity}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={format(new Date(currentItem.expiry_date), 'yyyy-MM-dd')}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={currentItem.manufacturer}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={currentItem.category}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={currentItem.price}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateInventoryItem}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-blue-700"
              >
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete <strong>{currentItem.medicine_name}</strong>? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteInventoryItem}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;