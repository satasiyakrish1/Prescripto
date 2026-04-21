import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Lightbulb, ThumbsUp, Eye, Trash2 } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const FeatureRequestsManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [features, setFeatures] = useState([]);
  const [filteredFeatures, setFilteredFeatures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Mock data
    const mockData = Array.from({ length: 25 }, (_, i) => ({
      _id: `feature-${i + 1}`,
      title: [
        'Dark mode support',
        'Mobile app version',
        'Video consultation',
        'AI-powered diagnosis',
        'Multi-language support',
        'Export reports to PDF',
        'Integration with wearables',
        'Telemedicine features'
      ][i % 8],
      description: `Detailed description of feature request ${i + 1}. This would greatly improve user experience and add value to the platform.`,
      requestedBy: `user${i + 1}@example.com`,
      userType: ['patient', 'doctor', 'pharmacy'][i % 3],
      category: ['UI/UX', 'Integration', 'Analytics', 'Communication', 'Security'][i % 5],
      priority: ['low', 'medium', 'high'][i % 3],
      status: ['submitted', 'under-review', 'planned', 'in-development', 'completed', 'rejected'][i % 6],
      votes: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));
    setFeatures(mockData);
  }, []);

  useEffect(() => {
    filterFeatures();
  }, [searchTerm, statusFilter, categoryFilter, features]);

  const filterFeatures = () => {
    let filtered = features;
    
    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter);
    }
    
    // Sort by votes
    filtered.sort((a, b) => b.votes - a.votes);
    
    setFilteredFeatures(filtered);
  };

  const updateStatus = (id, newStatus) => {
    setFeatures(features.map(f => f._id === id ? { ...f, status: newStatus } : f));
    toast.success('Status updated successfully');
  };

  const deleteFeature = (id) => {
    if (!window.confirm('Are you sure you want to delete this feature request?')) return;
    setFeatures(features.filter(f => f._id !== id));
    toast.success('Feature request deleted');
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-gray-100 text-gray-800',
      'under-review': 'bg-blue-100 text-blue-800',
      'planned': 'bg-purple-100 text-purple-800',
      'in-development': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-gray-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-800">Feature Requests</h1>
              <p className="text-gray-600">Manage user suggestions and feature ideas</p>
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
                placeholder="Search feature requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="UI/UX">UI/UX</option>
              <option value="Integration">Integration</option>
              <option value="Analytics">Analytics</option>
              <option value="Communication">Communication</option>
              <option value="Security">Security</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="planned">Planned</option>
              <option value="in-development">In Development</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Total Requests</p>
            <p className="text-2xl font-bold text-gray-800">{features.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">
              {features.filter(f => f.status === 'under-review').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">In Development</p>
            <p className="text-2xl font-bold text-yellow-600">
              {features.filter(f => f.status === 'in-development').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {features.filter(f => f.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((feature) => (
            <motion.div
              key={feature._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" size={20} />
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {feature.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                  <ThumbsUp size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">{feature.votes}</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{feature.description}</p>

              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                  {feature.status.replace('-', ' ')}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <div>Requested by: {feature.requestedBy}</div>
                <div>{new Date(feature.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFeature(feature);
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
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
      </div>

      {/* Detail Modal */}
      {showModal && selectedFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Feature Request Details</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-800 font-medium">{selectedFeature.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedFeature.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-800">{selectedFeature.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Votes</label>
                    <div className="flex items-center gap-2">
                      <ThumbsUp size={16} className="text-blue-600" />
                      <span className="font-bold text-blue-600">{selectedFeature.votes}</span>
                    </div>
                  </div>
                </div>
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
                    <option value="submitted">Submitted</option>
                    <option value="under-review">Under Review</option>
                    <option value="planned">Planned</option>
                    <option value="in-development">In Development</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested By</label>
                  <p className="text-gray-800">{selectedFeature.requestedBy} ({selectedFeature.userType})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted On</label>
                  <p className="text-gray-800">{new Date(selectedFeature.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
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

export default FeatureRequestsManagement;
