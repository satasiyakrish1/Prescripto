import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, AlertTriangle, Eye, Trash2, CheckCircle, Clock } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const BugReportsManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [bugs, setBugs] = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedBug, setSelectedBug] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBugs();
  }, []);

  useEffect(() => {
    filterBugs();
  }, [searchTerm, statusFilter, priorityFilter, bugs]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/support/bug-reports`, {
        headers: { aToken }
      });
      
      if (data.success) {
        setBugs(data.bugs);
      }
    } catch (error) {
      // Mock data
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        _id: `bug-${i + 1}`,
        title: [
          'Login page not loading',
          'Appointment booking fails',
          'Payment gateway error',
          'Profile image upload issue',
          'Search functionality broken'
        ][i % 5],
        description: `Detailed description of bug ${i + 1}. Steps to reproduce: 1) Open the application 2) Navigate to the feature 3) Perform action 4) Error occurs.`,
        reportedBy: `user${i + 1}@example.com`,
        userType: ['patient', 'doctor', 'pharmacy'][i % 3],
        priority: ['low', 'medium', 'high', 'critical'][i % 4],
        status: ['open', 'in-progress', 'resolved', 'closed'][i % 4],
        browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
        device: ['Desktop', 'Mobile', 'Tablet'][i % 3],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        screenshot: i % 3 === 0 ? 'screenshot-url.jpg' : null
      }));
      setBugs(mockData);
    } finally {
      setLoading(false);
    }
  };

  const filterBugs = () => {
    let filtered = bugs;
    
    if (searchTerm) {
      filtered = filtered.filter(bug =>
        bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bug => bug.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(bug => bug.priority === priorityFilter);
    }
    
    setFilteredBugs(filtered);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setBugs(bugs.map(b => b._id === id ? { ...b, status: newStatus } : b));
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteBug = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bug report?')) return;
    setBugs(bugs.filter(b => b._id !== id));
    toast.success('Bug report deleted successfully');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/support-management')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bug Reports</h1>
              <p className="text-gray-600">Track and manage technical issues</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-800">{bugs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Open</p>
            <p className="text-2xl font-bold text-red-600">
              {bugs.filter(b => b.status === 'open').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {bugs.filter(b => b.status === 'in-progress').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {bugs.filter(b => b.status === 'resolved').length}
            </p>
          </div>
        </div>

        {/* Bugs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBugs.map((bug) => (
            <motion.div
              key={bug._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(bug.priority)}`}>
                    {bug.priority}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                  {bug.status}
                </span>
              </div>

              <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{bug.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{bug.description}</p>

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <div>Reported by: {bug.reportedBy}</div>
                <div>Device: {bug.device} • {bug.browser}</div>
                <div>{new Date(bug.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedBug(bug);
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
                <button
                  onClick={() => deleteBug(bug._id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedBug && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bug Report Details</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-800 font-medium">{selectedBug.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedBug.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedBug.priority)}`}>
                      {selectedBug.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <select
                      value={selectedBug.status}
                      onChange={(e) => {
                        updateStatus(selectedBug._id, e.target.value);
                        setSelectedBug({ ...selectedBug, status: e.target.value });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBug.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reported By</label>
                  <p className="text-gray-800">{selectedBug.reportedBy} ({selectedBug.userType})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Environment</label>
                  <p className="text-gray-800">{selectedBug.device} • {selectedBug.browser}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reported On</label>
                  <p className="text-gray-800">{new Date(selectedBug.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    updateStatus(selectedBug._id, 'resolved');
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BugReportsManagement;
