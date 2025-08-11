import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, TrendingUp, MapPin, ArrowRight, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, notificationsAPI, eventsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { formatLocalDate } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import EventInstanceDisplay from '../components/EventInstanceDisplay';

interface DashboardStats {
  totalHours: number;
  upcomingEvents: number;
  pastEvents: number;
  totalEvents: number;
  hoursThisMonth: number;
}

interface EventSignup {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    category: string;
  };
  instance: {
    id: string;
    hours: number;
    startDate: string;
    endDate: string;
    location: string;
  };
}

interface Event {
  id: string;
  title: string;
  category: string;
  status: string;
  instances: Array<{
    id: string;
    hours: number;
    startDate: string;
    location: string;
    signups?: Array<any>;
    studentCapacity?: number;
    parentCapacity?: number;
  }>;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  isRead: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalEvents: 0,
    hoursThisMonth: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState<EventSignup[]>([]);
  const [recentActivity, setRecentActivity] = useState<EventSignup[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [newEvents, setNewEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, upcomingData, recentData, notificationsData, eventsData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getUpcomingEvents(3),
          dashboardAPI.getRecentActivity(3),
          notificationsAPI.getAll({ limit: 3 }),
          eventsAPI.getAll({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' })
        ]);

        setStats(statsData.stats);
        setUpcomingEvents(upcomingData.upcomingEvents);
        setRecentActivity(recentData.recentActivity);
        setRecentNotifications(notificationsData.notifications || []);

        // Filter out events the user is already signed up for and disabled instances
        const userSignupInstanceIds = new Set(upcomingData.upcomingEvents.map((signup: EventSignup) => signup.instance.id));
        const availableEvents = (eventsData.events || []).filter((event: Event) => {
          const nextInstance = event.instances?.find((instance: any) => instance.enabled !== false); // First enabled instance
          return nextInstance && !userSignupInstanceIds.has(nextInstance.id);
        });
        setNewEvents(availableEvents.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Transform server notifications to display format
  const displayNotifications = recentNotifications.map((notification: Notification) => ({
    id: notification.id,
    type: notification.type.toLowerCase(),
    title: notification.title,
    isRead: notification.isRead,
    message: notification.description,
    timestamp: formatDistanceToNow(new Date(notification.date), { addSuffix: true })
  }));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'info':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center flex w-full h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Ready to make a difference today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Hours</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.totalHours}</p>
            </div>
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium">This Month</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.hoursThisMonth}</p>
            </div>
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Upcoming Events</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.upcomingEvents}</p>
            </div>
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Events Completed</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.pastEvents}</p>
            </div>
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - My Events & Notifications */}
        <div className="xl:col-span-2 space-y-4">
          {/* My Upcoming Events */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  My Agenda
                </h2>
                <Link
                  to="/activity"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:scale-105 transition-all"
                >
                  View All
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                      No upcoming events signed up for
                    </p>
                    <Link
                      to="/events"
                      className="text-xs px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm hover:scale-105 hover:shadow-md"
                    >
                      Browse Events
                    </Link>
                  </div>
                ) : upcomingEvents.map((signup: EventSignup, index) => (
                  <Link
                    key={signup.id}
                    to={`/sessions/${signup.instance.id}`}
                    className="block"
                  >
                    <div className="border border-slate-200 dark:border-slate-700/50 flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-[1.02]">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {signup.event.title}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <EventInstanceDisplay instance={signup.instance} />
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${signup.status === 'CONFIRMED'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : signup.status === 'WAITLIST_PENDING'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : signup.status === 'WAITLIST' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}>
                        {signup.status === 'WAITLIST_PENDING' ? 'Pending Response' : signup.status.charAt(0).toUpperCase() + signup.status.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* New Events */}
          <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-white dark:border-slate-700/50 shadow-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  New Events
                </h2>
                <Link
                  to="/events"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:scale-105 transition-all"
                >
                  View All
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : newEvents.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-300 text-sm p-6 text-center">
                    No new events available
                  </p>
                ) : newEvents.map((event: Event, index) => {
                  const nextInstance = event.instances?.[0];
                  if (!nextInstance) return null;

                  const totalSignups = nextInstance.signups?.length || 0;
                  const totalCapacity = (nextInstance.studentCapacity || 0) + (nextInstance.parentCapacity || 0);

                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block"
                    >
                      <div className="border border-slate-200 dark:border-slate-700/50 flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-[1.02]">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {totalSignups}/{totalCapacity} spots
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {event.category}
                            </span>
                            <EventInstanceDisplay instance={nextInstance} />
                          </div>
                        </div>
                        <button className="text-xs px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm hover:scale-105 hover:shadow-md">
                          Join
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notifications */}
        <div className="space-y-4">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Recent
                </h2>
                <Link
                  to="/notifications"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:scale-105 transition-all"
                >
                  View All
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {displayNotifications.length > 0 ? displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border border-slate-200 dark:border-slate-700/50 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1">
                          {notification.title}
                          {!notification.isRead && <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                            <div className="w-1 h-1 rounded-full bg-orange-600 dark:bg-orange-400"></div>
                            New
                          </span>}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 text-xs mb-1">
                          {notification.message}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                      No recent notifications
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/calendar"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all border border-blue-200 dark:border-blue-800"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Browse Calendar</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">See all events running this month</p>
              </div>
            </Link>

            <Link
              to="/events"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-all border border-emerald-200 dark:border-emerald-800"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Discover Events</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Find new volunteer opportunities</p>
              </div>
            </Link>

            <Link
              to="/chapter"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all border border-purple-200 dark:border-purple-800"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">View Chapter</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Meet new volunteers in your area</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}