
// src/components/common/Notification/Notification.tsx
import React, { useEffect } from 'react';
import { FiInfo, FiCheck, FiAlertTriangle, FiX } from 'react-icons/fi';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  isVisible,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration, onClose]);
  
  // Icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="h-6 w-6 text-success-500" />;
      case 'warning':
        return <FiAlertTriangle className="h-6 w-6 text-warning-500" />;
      case 'error':
        return <FiX className="h-6 w-6 text-danger-500" />;
      case 'info':
      default:
        return <FiInfo className="h-6 w-6 text-primary-500" />;
    }
  };
  
  // Background color based on type
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 dark:bg-success-900 dark:bg-opacity-20';
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-900 dark:bg-opacity-20';
      case 'error':
        return 'bg-danger-50 dark:bg-danger-900 dark:bg-opacity-20';
      case 'info':
      default:
        return 'bg-primary-50 dark:bg-primary-900 dark:bg-opacity-20';
    }
  };
  
  // Border color based on type
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-success-500';
      case 'warning':
        return 'border-warning-500';
      case 'error':
        return 'border-danger-500';
      case 'info':
      default:
        return 'border-primary-500';
    }
  };
  
  return (
    <div
      className={`w-full max-w-sm rounded-lg shadow-lg border-l-4 ${getBgColor()} ${getBorderColor()} ${
        isVisible ? 'animate-slide-in' : 'animate-slide-out'
      }`}
    >
      <div className="p-4 flex">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
          {message && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{message}</p>}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="bg-transparent rounded-md inline-flex text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span className="sr-only">Close</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
