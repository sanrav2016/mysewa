import React, { useState } from 'react';
import { Bell, Calendar, Users, Clock, CheckCircle, AlertCircle, XCircle, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday, subDays } from 'date-fns';

interface ActivityNotification {
  id: string;
  type: 'signup' | 'waitlist_moved' | 'event_cancelled' | 'event_updated' | 'hours_awarded' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  eventTitle?: string;
  eventId?: string;
  sessionId?: string;
  read: boolean;
}

// Mock notifications data
const mockNotifications: ActivityNotification[] = [
  {
    id: '1',
    type: 'signup',
    title: 'Successfully signed up!',
    message: 'You have been confirmed for Community Garden Cleanup on Jan 25, 2025',
    timestamp: '2025-01-20T10:30:00',
    eventTitle: 'Community Garden Cleanup',
    eventId: '1',
    sessionId: '1-1',
    read: false
  },
  {
    id: '2',
    type: 'waitlist_moved',
    title: 'Moved from waitlist!',
    message: 'A spot opened up! You are now confirmed for Food Bank Sorting',
    timestamp: '2025-01-19T14:15:00',
    eventTitle: 'Food Bank Sorting',
    eventId: '2',
    sessionId: '2-1',
    read: false
  },
  {
    id: '3',
    type: 'hours_awarded',
    title: 'Volunteer hours awarded',
    message: 'You earned 3 volunteer hours for attending Senior Center Bingo Night',
    timestamp: '2025-01-18T20:30:00',
    eventTitle: 'Senior Center Bingo Night',
    eventId: '3',
    sessionId: '3-1',
    read: true
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Event reminder',
    message: 'Community Garden Cleanup is tomorrow at 9:00 AM. Don\'t forget your Sewa t-shirt!',
    timestamp: '2025-01-17T18:00:00',
    eventTitle: 'Community Garden Cleanup',
    eventId: '1',
    sessionId: '1-1',
    read: true
  },
  {
    id: '5',
    type: 'event_updated',
    title: 'Event location changed',
    message: 'The location for Food Bank Sorting has been updated to Central Food Bank',
    timestamp: '2025-01-16T11:45:00',
    eventTitle: 'Food Bank Sorting',
    eventId: '2',
    sessionId: '2-1',
    read: true
  },
  {
    id: '6',
    type: 'event_cancelled',
    title: 'Event cancelled',
    message: 'Unfortunately, the Beach Cleanup event scheduled for Jan 15 has been cancelled due to weather',
    timestamp: '2025-01-14T08:00:00',
    eventTitle: 'Beach Cleanup',
    read: true
  }
];

export default function Activity() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'today'>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const getNotificationIcon = (type: ActivityNotification['type']) => {
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

  const getNotificationColor = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'signup':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'waitlist_moved':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'event_cancelled':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'event_updated':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
      case 'hours_awarded':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'reminder':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  const getTimeDisplay = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (date > subDays(new Date(), 7)) {
      return format(date, 'EEEE \'at\' h:mm a');
    } else {
      return format(date, 'MMM d \'at\' h:mm a');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'today':
        return isToday(new Date(notification.timestamp));
      default:
        return true;
    }
  });

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Activity Feed
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Stay updated with your volunteer activities and notifications
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Bell className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Notifications</p>
              <p className="text-3xl font-bold">{notifications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-orange-200" />
            <div>
              <p className="text-orange-100 text-sm font-medium">Unread</p>
              <p className="text-3xl font-bold">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-green-200" />
            <div>
              <p className="text-green-100 text-sm font-medium">Today</p>
              <p className="text-3xl font-bold">
                {notifications.filter(n => isToday(new Date(n.timestamp))).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2">
          {(['all', 'unread', 'today'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === filterType
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                  : 'bg-orange-100 dark:bg-slate-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-slate-600'
                }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center border-4 border-orange-200 dark:border-slate-600">
            <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              {filter === 'unread' ? 'No unread notifications' :
                filter === 'today' ? 'No notifications today' :
                  'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={`p-6 rounded-2xl shadow-lg border-4 border-dashed cursor-pointer transition-all hover:shadow-xl ${getNotificationColor(notification.type)
                } ${!notification.read ? 'ring-2 ring-orange-400 dark:ring-orange-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-bold text-slate-800 dark:text-white mb-1 ${!notification.read ? 'text-lg' : 'text-base'
                        }`}>
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block"></span>
                        )}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-2">
                        {notification.message}
                      </p>
                      {notification.eventTitle && (
                        <span className="inline-block bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-medium">
                          {notification.eventTitle}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {getTimeDisplay(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}