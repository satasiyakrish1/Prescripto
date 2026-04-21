import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  FileText,
  CheckSquare
} from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { ViewerContext } from '../../context/ViewerContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const SupportManagement = () => {
  const navigate = useNavigate();
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const { vToken } = useContext(ViewerContext) || {};

  const [stats, setStats] = useState({
    contactUs: { total: 0, pending: 0, resolved: 0 },
    bugReports: { total: 0, pending: 0, resolved: 0 },
    featureRequests: { total: 0, pending: 0, resolved: 0 },
    generalInquiries: { total: 0, pending: 0, resolved: 0 }
  });

  const [blogStats, setBlogStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportStats();
  }, []);

  const fetchSupportStats = async () => {
    try {
      setLoading(true);

      // Fetch all stats with individual error handling
      const authToken = aToken || vToken || '';
      const commonHeaders = authToken ? { aToken: authToken, Authorization: `Bearer ${authToken}` } : {};
      const [contactRes, feedbackRes, blogRes] = await Promise.allSettled([
        axios.get(`${backendUrl}/api/contact/stats`, { headers: commonHeaders }),
        axios.get(`${backendUrl}/api/feedback/stats`, { headers: commonHeaders }),
        axios.get(`${backendUrl}/api/admin/blog/stats`, { headers: commonHeaders })
      ]);

      // Handle contact stats
      if (contactRes.status === 'fulfilled' && contactRes.value.data.success) {
        setStats(prev => ({
          ...prev,
          contactUs: contactRes.value.data.stats.contactUs || { total: 0, pending: 0, resolved: 0 }
        }));
      }

      // Handle feedback stats
      if (feedbackRes.status === 'fulfilled' && feedbackRes.value.data.success) {
        setStats(prev => ({
          ...prev,
          bugs: feedbackRes.value.data.stats.bugs || { total: 0, pending: 0, resolved: 0 },
          features: feedbackRes.value.data.stats.features || { total: 0, pending: 0, resolved: 0 },
          general: feedbackRes.value.data.stats.general || { total: 0, pending: 0, resolved: 0 }
        }));
      }

      // Handle blog stats
      if (blogRes.status === 'fulfilled' && blogRes.value.data.success) {
        setBlogStats({
          totalPosts: blogRes.value.data.data.totalPosts || 0,
          publishedPosts: blogRes.value.data.data.publishedPosts || 0,
          draftPosts: blogRes.value.data.data.draftPosts || 0
        });
      }
    } catch (error) {
      console.error('Error fetching support stats:', error);
      // Don't show error toast, just log it - stats will show 0
    } finally {
      setLoading(false);
    }
  };

  const supportCards = [
    {
      id: 'task-management',
      title: 'Task Management',
      description: 'Manage your tasks & to-dos',
      icon: CheckSquare,
      color: '#3B82F6',
      stats: {
        total: 0,
        pending: 0,
        resolved: 0
      },
      route: '/todo-list'
    },
    {
      id: 'contact-us',
      title: 'Contact Submissions',
      description: 'User inquiries & messages',
      icon: MessageSquare,
      color: '#5F6FFF',
      stats: stats.contactUs,
      route: '/support/contact-us'
    },
    {
      id: 'bug-reports',
      title: 'Bug Reports',
      description: 'Technical issues',
      icon: AlertTriangle,
      color: '#FF5757',
      stats: stats.bugs || { total: 0, pending: 0, resolved: 0 },
      route: '/support/bugs'
    },
    {
      id: 'feature-requests',
      title: 'Feature Requests',
      description: 'New suggestions',
      icon: Lightbulb,
      color: '#FFA726',
      stats: stats.features || { total: 0, pending: 0, resolved: 0 },
      route: '/support/features'
    },
    {
      id: 'general-feedback',
      title: 'General Feedback',
      description: 'Suggestions & other',
      icon: HelpCircle,
      color: '#26C281',
      stats: stats.general || { total: 0, pending: 0, resolved: 0 },
      route: '/support/feedback'
    },
    {
      id: 'blog-management',
      title: 'Blog Management',
      description: 'Create & manage posts',
      icon: FileText,
      color: '#8B5CF6',
      stats: {
        total: blogStats.totalPosts,
        pending: blogStats.draftPosts,
        resolved: blogStats.publishedPosts
      },
      route: '/blog-management'
    }
  ];

  const totalSubmissions = stats.contactUs.total + (stats.bugs?.total || 0) + (stats.features?.total || 0) + (stats.general?.total || 0);
  const totalPending = stats.contactUs.pending + (stats.bugs?.pending || 0) + (stats.features?.pending || 0) + (stats.general?.pending || 0);
  const totalResolved = stats.contactUs.resolved + (stats.bugs?.resolved || 0) + (stats.features?.resolved || 0) + (stats.general?.resolved || 0);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Support Management</h1>
              <p className="text-sm md:text-base text-gray-600 mt-2">Feedback, bugs, features, contacts, and content</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <MessageSquare className="text-primary" size={18} />
              </div>
              <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <AlertTriangle className="text-[#FF5757]" size={18} />
              </div>
              <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <Lightbulb className="text-[#FFA726]" size={18} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="rounded-xl p-6 bg-white border border-gray-200">
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalSubmissions}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Total Submissions</div>
          </div>

          <div className="rounded-xl p-6 bg-white border border-gray-200">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{totalPending}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Pending Review</div>
          </div>

          <div className="rounded-xl p-6 bg-white border border-gray-200">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{totalResolved}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Resolved</div>
          </div>

          <div className="rounded-xl p-6 bg-white border border-gray-200">
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {Math.round((totalResolved / (totalSubmissions || 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Resolution Rate</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportCards.map((card, index) => {
            const Icon = card.icon;
            const progressPercent = Math.round((card.stats.resolved / (card.stats.total || 1)) * 100);

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => navigate(card.route)}
                className="group rounded-xl p-6 cursor-pointer bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-gray-200 bg-white">
                      <Icon size={22} style={{ color: card.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-500 font-normal">{card.description}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-gray-600 transition-all flex-shrink-0"
                  />
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{card.stats.total}</div>
                    <div className="text-xs text-gray-500 font-medium">Total</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <div className="text-xl font-bold text-yellow-600">{card.stats.pending}</div>
                    <div className="text-xs text-gray-500 font-medium">Pending</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div>
                    <div className="text-xl font-bold text-green-600">{card.stats.resolved}</div>
                    <div className="text-xs text-gray-500 font-medium">Resolved</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Progress</span>
                    <span className="text-xs font-semibold text-gray-700">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupportManagement;
