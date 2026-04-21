import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  User,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const ContactUsManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [graphType, setGraphType] = useState('timeline'); // timeline | status | userType
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchContacts(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter]);

  useEffect(() => {
    filterContacts();
  }, [searchTerm, statusFilter, contacts]);

  const fetchContacts = async (silent = false) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/contact/all`, {
        headers: { aToken },
        params: { status: statusFilter !== 'all' ? statusFilter : undefined }
      });
      
      if (data.success) {
        setContacts(data.contacts);
        if (!silent) {
          toast.success('Contacts refreshed');
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      if (!silent) toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;
    
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }
    
    setFilteredContacts(filtered);
  };

  const formatDateKey = (iso) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTimelineData = () => {
    const map = new Map();
    contacts.forEach(c => {
      const key = formatDateKey(c.createdAt);
      map.set(key, (map.get(key) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([date, count]) => ({ date, count }));
    arr.sort((a, b) => a.date.localeCompare(b.date));
    return arr.slice(-14);
  };

  const getStatusData = () => {
    const statuses = ['pending', 'in-progress', 'resolved', 'cancelled'];
    return statuses.map(s => ({
      status: s,
      count: contacts.filter(c => c.status === s).length
    }));
  };

  const getUserTypeData = () => {
    const map = new Map();
    contacts.forEach(c => {
      const t = (c.userType || 'guest').toLowerCase();
      map.set(t, (map.get(t) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([type, count]) => ({ type, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  };

  const COLORS = ['#5F6FFF', '#FF5757', '#26C281', '#FFA726', '#8B5CF6', '#3B82F6'];

  const updateStatus = async (id, newStatus) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/contact/${id}`,
        { status: newStatus },
        { headers: { aToken } }
      );
      
      if (data.success) {
        setContacts(contacts.map(c => c._id === id ? { ...c, status: newStatus } : c));
        toast.success('Status updated successfully');
        fetchContacts(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const { data } = await axios.delete(`${backendUrl}/api/contact/${id}`, {
        headers: { aToken }
      });
      
      if (data.success) {
        setContacts(contacts.filter(c => c._id !== id));
        toast.success('Contact deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const viewDetails = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/support-management')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Contact Submissions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage user inquiries and messages</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-8 mb-8">
          <div>
            <div className="text-2xl font-light text-gray-900">{contacts.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-yellow-600">
              {contacts.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Pending</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-2xl font-light text-green-600">
              {contacts.filter(c => c.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Resolved</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => fetchContacts()}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              title="Refresh now"
            >
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm transition ${autoRefresh ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              title="Toggle auto-refresh"
            >
              {autoRefresh ? 'Live On' : 'Live Off'}
            </button>
          </div>
        </div>

        {/* Graphs */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setGraphType('timeline')}
                className={`px-3 py-2 rounded-lg text-sm ${graphType === 'timeline' ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setGraphType('status')}
                className={`px-3 py-2 rounded-lg text-sm ${graphType === 'status' ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Status
              </button>
              <button
                onClick={() => setGraphType('userType')}
                className={`px-3 py-2 rounded-lg text-sm ${graphType === 'userType' ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                User Type
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {graphType === 'timeline' && 'Submissions per day (last 14 days)'}
              {graphType === 'status' && 'Distribution by status'}
              {graphType === 'userType' && 'Distribution by user type'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              {graphType === 'timeline' && (
                <LineChart data={getTimelineData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Line type="monotone" dataKey="count" stroke="#5F6FFF" strokeWidth={2} dot={false} isAnimationActive />
                </LineChart>
              )}
              {graphType === 'status' && (
                <BarChart data={getStatusData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#5F6FFF" isAnimationActive />
                </BarChart>
              )}
              {graphType === 'userType' && (
                <PieChart>
                  <ReTooltip />
                  <Legend />
                  <Pie
                    data={getUserTypeData()}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    isAnimationActive
                  >
                    {getUserTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-3 text-sm text-gray-600">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No contacts found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <User size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{contact.userType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail size={13} className="text-gray-400" />
                            <span className="text-xs">{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Phone size={13} className="text-gray-400" />
                              <span className="text-xs">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{contact.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={contact.status}
                          onChange={(e) => updateStatus(contact._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)} border-0 cursor-pointer`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewDetails(contact)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteContact(contact._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-gray-900">Contact Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedContact.name}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-gray-900 mt-1">{selectedContact.email}</p>
                </div>
                {selectedContact.phone && (
                  <div className="pb-4 border-b border-gray-100">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-gray-900 mt-1">{selectedContact.phone}</p>
                  </div>
                )}
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedContact.subject}</p>
                </div>
                <div className="pb-4 border-b border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
                  <p className="text-gray-900 mt-2 leading-relaxed whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User Type</label>
                    <p className="text-gray-900 capitalize mt-1">{selectedContact.userType}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedContact.status)}`}>
                        {selectedContact.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted On</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedContact.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    updateStatus(selectedContact._id, 'resolved');
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Mark as Resolved
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

export default ContactUsManagement;
