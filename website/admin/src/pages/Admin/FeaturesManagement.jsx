import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Lightbulb, Eye, Trash2 } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeaturesManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  useEffect(() => {
    filterFeatures();
  }, [searchTerm, statusFilter, features]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/feedback/all`, {
        headers: { aToken },
        params: { type: 'feature' }
      });
      
      if (data.success) {
        setFeatures(data.feedback);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const filterFeatures = () => {
    let filtered = features;
    
    if (searchTerm) {
      filtered = filtered.filter(feature =>
        feature.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(feature => feature.status === statusFilter);
    }
    
    setFilteredFeatures(filtered);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/feedback/${id}`,
        { status: newStatus },
        { headers: { aToken } }
      );
      
      if (data.success) {
        setFeatures(features.map(f => f._id === id ? { ...f, status: newStatus } : f));
        toast.success('Status updated successfully');
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteFeature = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature request?')) return;
    
    try {
      const { data } = await axios.delete(`${backendUrl}/api/feedback/${id}`, {
        headers: { aToken }
      });
      
      if (data.success) {
        setFeatures(features.filter(f => f._id !== id));
        toast.success('Feature request deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete feature request');
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature request');
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
            <h1 className="text-3xl font-light text-gray-900">Feature Requests</h1>
            <p className="text-sm text-gray-500">Manage user feature suggestions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search feature requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
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
            <div className="text-2xl font-light text-gray-900">{features.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-yellow-600">
              {features.filter(f => f.status === 'issued').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Issued</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-blue-600">
              {features.filter(f => f.status === 'in-progress').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-green-600">
              {features.filter(f => f.status === 'solved').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Implemented</div>
          </div>
        </div>

        {/* Features Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading feature requests...</p>
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No feature requests found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => (
              <motion.div
                key={feature._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Lightbulb className="text-orange-600" size={20} />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{feature.subject}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{feature.message}</p>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div>Requested by: {feature.userName}</div>
                  <div>{new Date(feature.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFeature(feature);
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => deleteFeature(feature._id)}
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
      {showModal && selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-gray-900">Feature Request Details</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedFeature.subject}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-gray-900 mt-2 leading-relaxed whitespace-pre-wrap">{selectedFeature.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <select
                      value={selectedFeature.status}
                      onChange={(e) => {
                        updateStatus(selectedFeature._id, e.target.value);
                        setSelectedFeature({ ...selectedFeature, status: e.target.value });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeature.status)}`}
                    >
                      <option value="issued">Issued</option>
                      <option value="in-progress">In Progress</option>
                      <option value="solved">Implemented</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p className="text-gray-900 capitalize">{selectedFeature.priority || 'Medium'}</p>
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested By</label>
                  <p className="text-gray-900 mt-1">{selectedFeature.userName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{selectedFeature.userEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requested On</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedFeature.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    updateStatus(selectedFeature._id, 'solved');
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Mark as Implemented
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

export default FeaturesManagement;
