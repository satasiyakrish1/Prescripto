import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, Archive, Trash2, Check, X, Inbox } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationMenu = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [notifications, setNotifications] = useState([]);
    const [archivedNotifications, setArchivedNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'archive'
    const [loading, setLoading] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/user/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchArchivedNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/user/notifications/archive`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setArchivedNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching archived notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'archive') {
            fetchArchivedNotifications();
        } else {
            fetchNotifications();
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`${backendUrl}/api/user/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const archiveNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.put(`${backendUrl}/api/user/notifications/${id}/archive`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Notification archived');
        } catch (error) {
            toast.error('Failed to archive');
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`${backendUrl}/api/user/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setArchivedNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If less than 24 hours
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <div className="flex bg-gray-200 rounded-lg p-1">
                                <button
                                    onClick={() => handleTabChange('inbox')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'inbox'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Inbox
                                </button>
                                <button
                                    onClick={() => handleTabChange('archive')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'archive'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Archive
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {activeTab === 'inbox' ? (
                                notifications.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-blue-50/30' : ''
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                                                        }`} />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                                {formatDate(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                                        <button
                                                            onClick={(e) => archiveNotification(notification._id, e)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Archive"
                                                        >
                                                            <Archive size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Inbox size={40} className="mb-3 opacity-20" />
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                )
                            ) : (
                                // Archive Tab
                                loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : archivedNotifications.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {archivedNotifications.map((notification) => (
                                            <div key={notification._id} className="p-4 hover:bg-gray-50 transition-colors group">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-gray-300" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-sm font-medium text-gray-600">
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                                {formatDate(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => deleteNotification(notification._id, e)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Archive size={40} className="mb-3 opacity-20" />
                                        <p className="text-sm">Archive is empty</p>
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationMenu;
