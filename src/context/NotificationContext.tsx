import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, XCircle, Clock, Users, Info } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  serverNotifications: any[];
  addNotification: (type: Notification['type'], title: string, message: string, saveToServer?: boolean) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loadNotifications: () => void;
  triggerUpdate: (component: string) => void;
  subscribeToUpdates: (component: string, callback: () => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serverNotifications, setServerNotifications] = useState<any[]>([]);
  const [updateSubscribers, setUpdateSubscribers] = useState<Map<string, () => void>>(new Map());
  const { user } = useAuth();

  // Load notifications from server on mount
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsAPI.getAll({ unreadOnly: 'true' });
      setServerNotifications(response.notifications || []);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const addNotification = useCallback(async (type: Notification['type'], title: string, message: string, saveToServer = true) => {
    // Check if a notification with the same title and message already exists
    const existingNotification = notifications.find(n => n.title === title && n.message === message);
    if (existingNotification) {
      console.log('Skipping duplicate notification:', title);
      return;
    }

    const newNotification: Notification = {
      type,
      title,
      message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, message.split(" ").length / 2 * 1000);

    // Save to server if requested and user is logged in
    if (saveToServer && user) {
      try {
        await notificationsAPI.create({
          title,
          description: message,
          type: type.toUpperCase(),
          userId: user.id,
          isRead: true
        });
        // Reload notifications from server
        loadNotifications();
      } catch (error) {
        console.error('Failed to save notification to server:', error);
      }
    }
  }, [user, loadNotifications, notifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      // Reload notifications to update the count in sidebar
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      // Reload notifications to update the count in sidebar
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [loadNotifications]);

  const triggerUpdate = useCallback((component: string) => {
    const callback = updateSubscribers.get(component);
    if (callback) {
      callback();
    }
  }, [updateSubscribers]);

  const subscribeToUpdates = useCallback((component: string, callback: () => void) => {
    setUpdateSubscribers(prev => new Map(prev).set(component, callback));
    
    // Return unsubscribe function
    return () => {
      setUpdateSubscribers(prev => {
        const newMap = new Map(prev);
        newMap.delete(component);
        return newMap;
      });
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      serverNotifications,
      addNotification, 
      removeNotification, 
      clearAll,
      markAsRead,
      markAllAsRead,
      loadNotifications,
      triggerUpdate,
      subscribeToUpdates
    }}>
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
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
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
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/90';
      default:
        return 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 left-auto z-[300] space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`relative p-3 rounded-xl shadow-lg border cursor-pointer transition-all max-w-full transform backdrop-blur-md ${getNotificationColor(notification.type)}`}
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
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs">
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
          <div className="absolute bottom-0 left-0 h-1 bg-slate-300 dark:bg-slate-600 w-full overflow-hidden rounded-b-xl">
            <div className="h-full bg-slate-500 dark:bg-slate-200"
            style={{
              animation: `progress ${notification.message.split(" ").length / 2}s linear forwards`
            }} />
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