import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, Users, Calendar, MapPin, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { formatLocalDate } from '../utils/dateUtils';
import { notificationsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, loadNotifications } = useNotification();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [serverNotifications, setServerNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stickyControls, setStickyControls] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const controlsElement = document.getElementById("controls");
      if (controlsElement) {
        const rect = controlsElement.getBoundingClientRect();
        setStickyControls(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounce search to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      if (user) {
        try {
          setLoading(true);
          const response = await notificationsAPI.getAll({
            page: 1,
            limit: 10,
            ...(filter === 'unread' && { unreadOnly: 'true' }),
            ...(debouncedSearch && { search: debouncedSearch })
          });

          setServerNotifications(response.notifications || []);
          setCurrentPage(1);
          setTotalPages(response.pagination?.pages || 1);
          setTotalCount(response.pagination?.total || 0);
          setHasMore(response.pagination?.page < response.pagination?.pages);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialNotifications();
  }, [user, filter, debouncedSearch]);

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection observer triggered:', {
          isIntersecting: entry.isIntersecting,
          hasMore,
          loadingMore,
          currentPage
        });
        if (entry.isIntersecting && hasMore && !loadingMore) {
          console.log('Loading more notifications...');
          loadMoreNotifications();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
      console.log('Observer attached to loading element');
    } else {
      console.log('Loading element not found');
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  // Load more notifications for infinite scroll
  const loadMoreNotifications = useCallback(async () => {
    console.log('loadMoreNotifications called:', { loadingMore, hasMore, currentPage });
    if (loadingMore || !hasMore) {
      console.log('Early return from loadMoreNotifications');
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log('Fetching page:', nextPage);

      const response = await notificationsAPI.getAll({
        page: nextPage,
        limit: 10,
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const newNotifications = response.notifications || [];
      console.log('Received notifications:', newNotifications.length);
      console.log('Pagination info:', response.pagination);

      if (newNotifications.length > 0) {
        setServerNotifications(prev => [...prev, ...newNotifications]);
        setCurrentPage(nextPage);
        const newHasMore = nextPage < (response.pagination?.pages || 1);
        console.log('Setting hasMore to:', newHasMore);
        setHasMore(newHasMore);
      } else {
        console.log('No new notifications, setting hasMore to false');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, filter]);

  // Scroll-based infinite scroll fallback
  useEffect(() => {
    const handleScrollForInfinite = () => {
      if (hasMore && !loadingMore && loadingRef.current) {
        const rect = loadingRef.current.getBoundingClientRect();
        const isNearBottom = rect.top <= window.innerHeight + 200;

        if (isNearBottom) {
          console.log('Scroll-based trigger for loading more');
          loadMoreNotifications();
        }
      }
    };

    window.addEventListener('scroll', handleScrollForInfinite);
    return () => window.removeEventListener('scroll', handleScrollForInfinite);
  }, [hasMore, loadingMore, loadMoreNotifications]);

  // Transform server notifications to activity format
  const recentActivities = serverNotifications.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.description,
    date: notification.date,
    timestamp: formatDistanceToNow(new Date(notification.date), { addSuffix: true }),
    isRead: notification.isRead,
    sessionId: notification.sessionId,
    session: notification.session,
    event: notification.event
  }));

  // No need for frontend filtering since we're using backend search
  const filteredActivities = recentActivities;

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      // Reload notifications to update the UI and sidebar count
      const response = await notificationsAPI.getAll({
        page: 1,
        limit: 10,
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(debouncedSearch && { search: debouncedSearch })
      });
      setServerNotifications(response.notifications || []);
      setCurrentPage(1);
      setTotalPages(response.pagination?.pages || 1);
      setTotalCount(response.pagination?.total || 0);
      setHasMore(response.pagination?.page < response.pagination?.pages);

      // Trigger notification context update to refresh sidebar count
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      // Update the local state to reflect the change
      setServerNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      // Trigger notification context update to refresh sidebar count
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'INFO':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'WARNING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'INFO':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'WARNING':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'ERROR':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Notifications
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Stay updated with your volunteer activities and notifications
        </p>
      </div>

      {/* Filters */}
            <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 transition-all ${stickyControls ? "border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6 rounded-xl"}`}>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white py-2 text-sm`}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white p-2 text-sm`}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
            </select>

            <button
              onClick={handleMarkAllAsRead}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 rounded-lg font-medium hover:shadow-md transition-all hover:scale-105 text-sm"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-12 rounded-xl shadow-lg text-center border border-slate-200 dark:border-slate-700/50">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-16 rounded-lg shadow-lg text-center border border-slate-200 dark:border-slate-700/50">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              No notifications found
            </p>
          </div>
        ) : (
          <>
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg shadow-lg border transition-all hover:scale-[1.02] cursor-pointer ${getActivityColor(activity.type)} ${activity.isRead ? 'opacity-90' : 'ring ring-indigo-500'}`}
                onClick={() => handleNotificationClick(activity.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white text-base">
                        {activity.title}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4" title={formatLocalDate(activity.date, 'MMM d, yyyy h:mm a')}>
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {activity.message}
                    </p>
                    {activity.session && (
                      <div className="mt-2">
                        <Link
                          to={`/sessions/${activity.session.id}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="w-3 h-3" />
                          View Session Details
                        </Link>
                      </div>
                    )}
                    {activity.event && !activity.session && (
                      <div className="mt-2">
                        <Link
                          to={`/events/${activity.event.id}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="w-3 h-3" />
                          View Event Details
                        </Link>
                      </div>
                    )}
                    {!activity.isRead && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator for infinite scroll */}
            {hasMore && (
              <div
                ref={loadingRef}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-lg text-center border border-slate-200 dark:border-slate-700/50"
              >
                {loadingMore && (
                  <div className="flex items-center justify-center gap-3">
                    <LoadingSpinner size="md" />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}