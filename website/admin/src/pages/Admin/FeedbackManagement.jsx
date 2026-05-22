import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, HelpCircle, Eye, Trash2 } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedbackManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [searchTerm, statusFilter, typeFilter, feedback]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/feedback/all`, {
        headers: { aToken }
      });
      
      if (data.success) {
        // Filter for suggestion and other types only
        const generalFeedback = data.feedback.filter(f => 
          f.type === 'suggestion' || f.type === 'other'
        );
        setFeedback(generalFeedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const filterFeedback = () => {
    let filtered = feedback;
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    setFilteredFeedback(filtered);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/feedback/${id}`,
        { status: newStatus },
        { headers: { aToken } }
      );
      
      if (data.success) {
        setFeedback(feedback.map(f => f._id === id ? { ...f, status: newStatus } : f));
        toast.success('Status updated successfully');
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const { data } = await axios.delete(`${backendUrl}/api/feedback/${id}`, {
        headers: { aToken }
      });
      
      if (data.success) {
        setFeedback(feedback.filter(f => f._id !== id));
        toast.success('Feedback deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'solved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/support-management')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">General Feedback</h1>
            <p className="text-sm text-gray-500">Manage user suggestions and feedback</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="suggestion">Suggestions</option>
            <option value="other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="in-progress">In Progress</option>
            <option value="solved">Solved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mb-8">
          <div>
            <div className="text-2xl font-light text-gray-900">{feedback.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-yellow-600">
              {feedback.filter(f => f.status === 'issued').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Issued</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-blue-600">
              {feedback.filter(f => f.status === 'in-progress').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-green-600">
              {feedback.filter(f => f.status === 'solved').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Solved</div>
          </div>
        </div>

        {/* Feedback Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading feedback...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No feedback found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeedback.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <HelpCircle className="text-green-600" size={20} />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                    {item.type}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.subject}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{item.message}</p>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div>From: {item.userName}</div>
                  <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFeedback(item);
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => deleteFeedback(item._id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-gray-900">Feedback Details</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                  <p className="text-gray-900 capitalize mt-1">{selectedFeedback.type}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedFeedback.subject}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
                  <p className="text-gray-900 mt-2 leading-relaxed whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <select
                      value={selectedFeedback.status}
                      onChange={(e) => {
                        updateStatus(selectedFeedback._id, e.target.value);
                        setSelectedFeedback({ ...selectedFeedback, status: e.target.value });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}
                    >
                      <option value="issued">Issued</option>
                      <option value="in-progress">In Progress</option>
                      <option value="solved">Solved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p className="text-gray-900 capitalize">{selectedFeedback.priority || 'Medium'}</p>
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted By</label>
                  <p className="text-gray-900 mt-1">{selectedFeedback.userName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{selectedFeedback.userEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted On</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    updateStatus(selectedFeedback._id, 'solved');
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Mark as Solved
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
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

export default FeedbackManagement;
