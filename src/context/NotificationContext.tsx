import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bell, CheckCircle, AlertCircle, XCircle, Clock, Users } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'signup' | 'waitlist_moved' | 'event_cancelled' | 'event_updated' | 'hours_awarded' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  eventTitle?: string;
  eventId?: string;
  sessionId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
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
      case 'signup':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'waitlist_moved':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'event_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'event_updated':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'hours_awarded':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'signup':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/90';
      case 'waitlist_moved':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/90';
      case 'event_cancelled':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/90';
      case 'event_updated':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/90';
      case 'hours_awarded':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/90';
      case 'reminder':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/90';
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
              {notification.eventTitle && (
                <span className="inline-block bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg text-xs font-medium mt-2">
                  {notification.eventTitle}
                </span>
              )}
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