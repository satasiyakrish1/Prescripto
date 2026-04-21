import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FiTrash2, FiInfo, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const typeInfo = {
  info: {
    icon: <FiInfo className="w-6 h-6 text-blue-400" />,
    colors: ' #5f6FFF text-primary-700',
    badge: 'Info'
  },
  warning: {
    icon: <FiAlertTriangle className="w-6 h-6 text-yellow-400" />,
    colors: 'bg-yellow-50 text-yellow-700',
    badge: 'Warning'
  },
  success: {
    icon: <FiCheckCircle className="w-6 h-6 text-green-400" />,
    colors: 'bg-green-50 text-green-700',
    badge: 'Success'
  },
  error: {
    icon: <FiXCircle className="w-6 h-6 text-red-400" />,
    colors: 'bg-red-50 text-red-700',
    badge: 'Error'
  }
};

const NotificationCard = ({ notification, onRead, onDelete, isAdminView = false }) => {
  const {
    _id,
    title,
    message,
    createdAt,
    isRead,
    type = 'info',
    sender
  } = notification;

  const info = typeInfo[type] || typeInfo.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-4 p-5 rounded-xl shadow-sm ${info.colors} border border-transparent hover:shadow-md transition-shadow duration-200`}
    >
      <div className="shrink-0 mt-1">{info.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          <h3 className={`font-semibold text-base ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-opacity-20 ${
            type === 'info' ? 'bg-blue-100 text-primary' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
            type === 'success' ? 'bg-green-100 text-green-600' :
            'bg-red-100 text-red-500'}
          `}>{info.badge}</span>
        </div>
        {message && <p className="text-gray-600 text-sm mb-1 truncate max-w-lg">{message}</p>}
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{sender ? `From: ${sender}` : 'System'}</span>
          <span className="mx-1">·</span>
          <span>{format(new Date(createdAt), 'PPp')}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 ml-2">
        {!isRead && (
          <button
            onClick={() => onRead(_id)}
            title="Mark as read"
            className="text-primary hover:text-primary-700 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{ lineHeight: 0 }}
          >
            <FiCheckCircle className="w-5 h-5" />
          </button>
        )}
        {onDelete && isAdminView && (
          <button
            onClick={() => onDelete(_id)}
            title="Delete notification"
            className="text-red-400 hover:text-red-600 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-100"
            style={{ lineHeight: 0 }}
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCard; 