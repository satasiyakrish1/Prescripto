import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCard from '../../components/NotificationCard';
import CreateNotificationModal from '../../components/CreateNotificationModal';
import { FiBell, FiFilter, FiCheck, FiTrash2, FiPlus, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);
  const { backendUrl } = useContext(AppContext);

  const isAdmin = Boolean(aToken);
  const token = isAdmin ? aToken : dToken;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      if (!backendUrl) {
        throw new Error('Backend URL is not configured');
      }
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // Use correct endpoint structure
      const endpoint = isAdmin 
        ? `${backendUrl}/api/notifications`
        : `${backendUrl}/api/notifications/doctor`;
      
      console.log('Making request to:', endpoint);
      console.log('Is Admin:', isAdmin);
      console.log('Token exists:', !!token);
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        withCredentials: true
      });
      
      console.log('Full server response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // More flexible success checking
      const isSuccess = response.data.success === true || 
                       response.data.success === 'true' || 
                       response.status === 200;
      
      console.log('Success check:', {
        'response.data.success': response.data.success,
        'response.status': response.status,
        'isSuccess': isSuccess
      });
      
      if (isSuccess) {
        let notificationsData = response.data.notifications || response.data.data || [];
        
        // Handle case where notifications might be directly in response.data
        if (!Array.isArray(notificationsData) && Array.isArray(response.data)) {
          notificationsData = response.data;
        }
        
        console.log('Raw notifications data:', notificationsData);
        
        if (!isAdmin) {
          // For doctors, get the current user ID from response or token
          const userId = response.data.doctorId || 
                        response.data.currentUserId || 
                        response.data.userId ||
                        response.data.user?._id ||
                        response.data.user?.id;
          
          console.log('Doctor user ID detection:', {
            doctorId: response.data.doctorId,
            currentUserId: response.data.currentUserId,
            userId: response.data.userId,
            userObjectId: response.data.user?._id,
            userObjectSimpleId: response.data.user?.id,
            finalUserId: userId
          });
          
          setCurrentUserId(userId);
          
          // Add current user ID to each notification for easier filtering
          notificationsData = notificationsData.map(notif => ({
            ...notif,
            currentUserId: userId
          }));
          
          console.log('Doctor notifications processed:', {
            count: notificationsData.length,
            doctorId: userId,
            sampleNotification: notificationsData[0]
          });
        }
        
        setNotifications(notificationsData);
        console.log('Notifications set successfully:', notificationsData.length);
      } else {
        // More detailed error logging
        console.error('Server returned non-success response:', {
          success: response.data.success,
          message: response.data.message,
          error: response.data.error,
          fullResponse: response.data
        });
        
        const errorMessage = response.data.message || 
                           response.data.error || 
                           'Failed to fetch notifications';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check if the server is running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        // Clear tokens on auth error
        if (isAdmin) {
          localStorage.removeItem('aToken');
        } else {
          localStorage.removeItem('dToken');
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view notifications.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Notification service not found.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to fetch notifications';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (backendUrl && token) {
      fetchNotifications();
    } else {
      console.log('Missing requirements:', { backendUrl: !!backendUrl, token: !!token });
      setLoading(false);
    }
  }, [isAdmin, token, backendUrl]);

  const handleMarkAsRead = async (id) => {
    try {
      console.log('Marking notification as read:', id);
      
      // Use correct endpoint structure
      const endpoint = isAdmin 
        ? `${backendUrl}/api/notifications/mark-read/${id}`
        : `${backendUrl}/api/notifications/doctor/mark-read/${id}`;
      
      const response = await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Mark as read response:', response.data);

      // More flexible success checking
      const isSuccess = response.data.success === true || 
                       response.data.success === 'true' || 
                       response.status === 200;

      if (isSuccess) {
        // Update the local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => {
            if (notif._id === id) {
              if (isAdmin) {
                // Admin view: update based on server response
                return response.data.notification || {
                  ...notif,
                  recipients: notif.recipients?.map(r => ({
                    ...r,
                    isRead: true,
                    readAt: new Date()
                  })) || []
                };
              } else {
                // Doctor view: update current user's read status
                const updatedNotif = { ...notif };
                if (updatedNotif.recipients) {
                  updatedNotif.recipients = updatedNotif.recipients.map(r => {
                    // Check multiple possible ID fields
                    const recipientId = r.userId || r.doctorId || r._id;
                    const isCurrentUser = recipientId === currentUserId || 
                                        recipientId === notif.currentUserId ||
                                        recipientId?.toString() === currentUserId?.toString();
                    
                    return isCurrentUser ? { 
                      ...r, 
                      isRead: true, 
                      readAt: new Date() 
                    } : r;
                  });
                }
                return updatedNotif;
              }
            }
            return notif;
          })
        );
        
        toast.success('Notification marked as read');
      } else {
        throw new Error(response.data.message || response.data.error || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Clear tokens on auth error
        if (isAdmin) {
          localStorage.removeItem('aToken');
        } else {
          localStorage.removeItem('dToken');
        }
      } else {
        toast.error(error.response?.data?.message || 
                   error.response?.data?.error || 
                   'Error marking notification as read');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      
      // Use correct endpoint structure
      const endpoint = isAdmin 
        ? `${backendUrl}/api/notifications/mark-all-read`
        : `${backendUrl}/api/notifications/doctor/mark-all-read`;
      
      const response = await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Mark all as read response:', response.data);

      // More flexible success checking
      const isSuccess = response.data.success === true || 
                       response.data.success === 'true' || 
                       response.status === 200;

      if (isSuccess) {
        if (isAdmin) {
          // Admin view: mark all recipients as read
          setNotifications(prevNotifications => 
            prevNotifications.map(notif => ({
              ...notif,
              recipients: notif.recipients?.map(r => ({
                ...r,
                isRead: true,
                readAt: new Date()
              })) || []
            }))
          );
        } else {
          // Doctor view: update all notifications for current user
          setNotifications(prevNotifications => 
            prevNotifications.map(notif => ({
              ...notif,
              recipients: notif.recipients ? notif.recipients.map(r => {
                // Check multiple possible ID fields
                const recipientId = r.userId || r.doctorId || r._id;
                const isCurrentUser = recipientId === currentUserId || 
                                    recipientId === notif.currentUserId ||
                                    recipientId?.toString() === currentUserId?.toString();
                
                return isCurrentUser ? { 
                  ...r, 
                  isRead: true, 
                  readAt: new Date() 
                } : r;
              }) : []
            }))
          );
        }
        
        toast.success('All notifications marked as read');
      } else {
        throw new Error(response.data.message || response.data.error || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Clear tokens on auth error
        if (isAdmin) {
          localStorage.removeItem('aToken');
        } else {
          localStorage.removeItem('dToken');
        }
      } else {
        toast.error(error.response?.data?.message || 
                   error.response?.data?.error || 
                   'Error marking all as read');
      }
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!isAdmin) return;
    
    try {
      const response = await axios.delete(`${backendUrl}/api/notifications/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
          'Content-Type': 'application/json'
        }
      });

      // More flexible success checking
      const isSuccess = response.data.success === true || 
                       response.data.success === 'true' || 
                       response.status === 200;

      if (isSuccess) {
        setNotifications(notifications.filter(notif => notif._id !== id));
        toast.success('Notification deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('aToken');
      } else {
        toast.error(error.response?.data?.message || 
                   error.response?.data?.error || 
                   'Error deleting notification');
      }
    }
  };

  const handleCreateSuccess = (newNotification) => {
    setNotifications([newNotification, ...notifications]);
  };

  // Helper function to check if notification is unread for current user
  const isNotificationUnread = (notif) => {
    if (isAdmin) {
      // Admin sees notifications that have at least one unread recipient
      return notif.recipients && !notif.recipients.every(r => r.isRead);
    } else {
      // Doctor sees only their unread notifications
      const userRecipient = notif.recipients?.find(r => {
        const recipientId = r.userId || r.doctorId || r._id;
        return recipientId === currentUserId || 
               recipientId === notif.currentUserId ||
               recipientId?.toString() === currentUserId?.toString() ||
               recipientId?.toString() === notif.currentUserId?.toString();
      });
      return userRecipient && !userRecipient.isRead;
    }
  };

  // Helper function to check if notification is read for current user
  const isNotificationRead = (notif) => {
    if (isAdmin) {
      // Admin sees notifications where all recipients have read
      return notif.recipients && notif.recipients.every(r => r.isRead);
    } else {
      // Doctor sees only their read notifications
      const userRecipient = notif.recipients?.find(r => {
        const recipientId = r.userId || r.doctorId || r._id;
        return recipientId === currentUserId || 
               recipientId === notif.currentUserId ||
               recipientId?.toString() === currentUserId?.toString() ||
               recipientId?.toString() === notif.currentUserId?.toString();
      });
      return userRecipient && userRecipient.isRead;
    }
  };

  // Improved filtering logic
  const filteredNotifications = notifications.filter(notif => {
    // For doctors, only show notifications that are intended for them
    if (!isAdmin) {
      const hasRecipient = notif.recipients?.some(r => {
        const recipientId = r.userId || r.doctorId || r._id;
        return recipientId === currentUserId || 
               recipientId === notif.currentUserId ||
               recipientId?.toString() === currentUserId?.toString() ||
               recipientId?.toString() === notif.currentUserId?.toString();
      });
      
      if (!hasRecipient) {
        return false;
      }
    }
    
    if (filter === 'unread') {
      return isNotificationUnread(notif);
    }
    
    if (filter === 'read') {
      return isNotificationRead(notif);
    }
    
    return true; // 'all' filter
  });

  // Improved unread count calculation
  const unreadCount = notifications.filter(notif => {
    // For doctors, only count notifications that are intended for them
    if (!isAdmin) {
      const hasRecipient = notif.recipients?.some(r => {
        const recipientId = r.userId || r.doctorId || r._id;
        return recipientId === currentUserId || 
               recipientId === notif.currentUserId ||
               recipientId?.toString() === currentUserId?.toString() ||
               recipientId?.toString() === notif.currentUserId?.toString();
      });
      
      if (!hasRecipient) {
        return false;
      }
    }
    
    return isNotificationUnread(notif);
  }).length;

  // Enhanced debug logging
  console.log('Current state:', {
    isAdmin,
    hasToken: !!token,
    currentUserId,
    notificationsCount: notifications.length,
    filteredCount: filteredNotifications.length,
    unreadCount,
    filter,
    sampleNotification: notifications[0],
    backendUrl,
    tokenType: isAdmin ? 'admin' : 'doctor'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header, simplified */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded-xl">
                <FiBell className="w-7 h-7 text-blue-600" />
                  </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Notification Center</h1>
                <p className="text-gray-500 text-sm">All your important updates.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={fetchNotifications}
                  disabled={loading}
                className="p-2 bg-white text-blue-600 border border-blue-100 hover: #5f6FFF rounded-lg transition disabled:opacity-60"
                title="Refresh"
                >
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
                  <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={handleMarkAllAsRead}
                disabled={loading || notifications.length === 0}
                className="p-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                title="Mark all as read"
              >
                <FiCheck className="w-5 h-5" />
                  </motion.button>
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Create notification"
                >
                  <FiPlus className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
          {/* Filter Bar (subtle) */}
          <div className="flex items-center gap-4 bg-white rounded-xl p-3 shadow-sm border border-blue-50">
            <FiFilter className="text-blue-400 mr-1" />
                  {[
                    { key: 'all', label: 'All', count: filteredNotifications.length },
                    { key: 'unread', label: 'Unread', count: unreadCount },
                    { key: 'read', label: 'Read', count: filteredNotifications.length - unreadCount }
                  ].map(({ key, label, count }) => (
              <button
                      key={key}
                      onClick={() => setFilter(key)}
                className={`px-4 py-1 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors ${
                  filter === key ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover: #5f6FFF'
                }`}
              >
                {label} {count > 0 && <span className="ml-1">({count})</span>}
              </button>
            ))}
          </div>
        </motion.div>
        {/* List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {loading ? (
            <div className="flex flex-col items-center py-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredNotifications.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22 }}
                    >
                      <NotificationCard
                        notification={notification}
                        onRead={handleMarkAsRead}
                        onDelete={isAdmin ? handleDeleteNotification : undefined}
                        isAdminView={isAdmin}
                        currentUserId={currentUserId}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center py-24 text-gray-400"
                >
                  <FiBell className="w-14 h-14 mb-3 text-blue-200" />
                  <p className="font-semibold text-md">No notifications here</p>
                  <p className="text-sm">You’re all caught up.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
        {/* Modal */}
        <CreateNotificationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  );
};

export default Notifications;