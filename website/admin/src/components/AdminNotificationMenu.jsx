import React, { useContext, useEffect, useRef, useState } from 'react';
import { Bell, Inbox, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const formatDate = (d) => {
  try {
    const date = new Date(d);
    return date.toLocaleString();
  } catch {
    return '';
  }
};

const AdminNotificationMenu = () => {
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${aToken}` }
        });
        const count = res.data?.count ?? res.data?.unreadCount ?? 0;
        setUnreadCount(count);
      } catch {
        // silent
      }
    };
    if (aToken && backendUrl) fetchUnread();
  }, [aToken, backendUrl]);

  const fetchNotifications = async () => {
    if (!aToken || !backendUrl) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${aToken}` }
      });
      const list = res.data?.notifications || res.data?.data || [];
      setNotifications(list);
      const unread = list.filter((n) => {
        const recipients = n.recipients || [];
        return recipients.some((r) => !r.isRead);
      }).length;
      setUnreadCount(unread);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const openMenu = () => {
    setIsOpen((v) => !v);
    if (!isOpen) fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${backendUrl}/api/notifications/mark-read/${id}`, {}, {
        headers: { Authorization: `Bearer ${aToken}` }
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? {
                ...n,
                recipients: (n.recipients || []).map((r) => ({ ...r, isRead: true, readAt: new Date().toISOString() }))
              }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={openMenu}
        className={`p-2 rounded-lg transition-all duration-200 relative ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : String(unreadCount)}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-80 md:w-96 rounded-lg shadow-lg border overflow-hidden z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <div className={`px-3 py-2 border-b flex items-center justify-between ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h3 className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} text-sm font-medium`}>Notifications</h3>
              <div className="flex gap-1.5">
                <button
                  onClick={fetchNotifications}
                  className={`px-2 py-1 text-[11px] rounded-md ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="px-2 py-1 text-[11px] rounded-md bg-black text-white hover:opacity-90"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {loading ? (
                <div className={`py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-80">
                  <Inbox size={32} className={`${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-2`} />
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>No notifications</p>
                </div>
              ) : (
                <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {notifications.map((n) => {
                    const isUnread = (n.recipients || []).some((r) => !r.isRead);
                    return (
                      <div key={n._id} className="px-3 py-2.5">
                        <div className="flex gap-2.5">
                          <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUnread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-[13px] font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{n.title}</h4>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{formatDate(n.createdAt)}</span>
                            </div>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-[11px] leading-snug line-clamp-1`}>{n.message}</p>
                          </div>
                          {isUnread && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              className={`p-1 rounded-full self-start ${darkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`px-3 py-2 border-t flex justify-end ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <button onClick={() => { setIsOpen(false); navigate('/notifications'); }} className="px-3 py-1.5 rounded-md text-xs bg-black text-white hover:opacity-90">
                View all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotificationMenu;
