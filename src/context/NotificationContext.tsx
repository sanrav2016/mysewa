import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle, XCircle, Clock, Users, Info } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification['type'], title: string, message: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification['type'], title: string, message: string) => {
    const newNotification: Notification = {
      type,
      title,
      message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 6000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/90';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/90';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/90';
      case 'warning':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/90';
      default:
        return 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 md:right-4 left-4 md:left-auto z-[300] space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`relative p-4 rounded-2xl shadow-lg border-4 border-dashed cursor-pointer transition-all duration-300 transform ${getNotificationColor(notification.type)}`}
          style={{
            animation: `slideIn 0.7s ${index * 0.1}s both`,
            animationTimingFunction: `cubic-bezier(0.34, 1.56, 0.64, 1)`,
            transform: `translateY(${index * 4}px)`
          }}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {notification.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-slate-300 dark:bg-slate-600 w-full overflow-hidden rounded-b-md">
            <div className="h-full bg-slate-500 dark:bg-slate-200 animate-progress" />
          </div>
        </div>
      ))}
      <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%) translateY(0);
            }
            to {
              opacity: 1;
              transform: translateX(0) translateY(0);
            }
          }
          @keyframes progress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
          .animate-progress {
            animation: progress 6s linear forwards;
          }
        `}</style>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}