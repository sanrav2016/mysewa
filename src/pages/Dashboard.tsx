import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, TrendingUp, MapPin, ArrowRight, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockEvents, mockSignups, mockUsers } from '../data/mockData';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();

  // Get upcoming events (next 3)
  const upcomingEvents = mockEvents
    .flatMap(event =>
      event.instances.map(instance => ({
        ...instance,
        eventTitle: event.title,
        category: event.category
      }))
    )
    .filter(instance => new Date(instance.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  // Get user's signups
  const userSignups = mockSignups.filter(signup => signup.userId === user?.id);
  const totalHoursThisMonth = userSignups
    .filter(signup => signup.hoursEarned && new Date(signup.signupDate).getMonth() === new Date().getMonth())
    .reduce((sum, signup) => sum + (signup.hoursEarned || 0), 0);

  // Get user's upcoming events
  const userUpcomingEvents = userSignups
    .map(signup => {
      const event = mockEvents.find(e => e.id === signup.eventId);
      const instance = event?.instances.find(i => i.id === signup.instanceId);
      return { signup, event, instance };
    })
    .filter(item => item.event && item.instance && new Date(item.instance.startDate) > new Date())
    .sort((a, b) => new Date(a.instance!.startDate).getTime() - new Date(b.instance!.startDate).getTime())
    .slice(0, 3);

  // Mock recent notifications
  const recentNotifications = [
    {
      id: '1',
      type: 'signup',
      title: 'Successfully signed up!',
      message: 'You have been confirmed for Community Garden Cleanup',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'hours_awarded',
      title: 'Volunteer hours awarded',
      message: 'You earned 3 volunteer hours for attending Senior Center Bingo Night',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      type: 'reminder',
      title: 'Event reminder',
      message: 'Community Garden Cleanup is tomorrow at 9:00 AM',
      timestamp: '2 days ago'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'hours_awarded':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 transform">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-300 transform">
          Ready to make a difference today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg transform hover:rotate-3 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold">{user?.totalHours}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg transform hover:-rotate-3 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold">{totalHoursThisMonth}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl text-white shadow-lg transform hover:rotate-3 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">My Events</p>
              <p className="text-3xl font-bold">{userSignups.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-2xl text-white shadow-lg transform hover:-rotate-3 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Members</p>
              <p className="text-3xl font-bold">5</p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - My Events & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Upcoming Events */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white transform">
                My Upcoming Events
              </h2>
              <Link
                to="/history"
                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transform hover:scale-105 transition-all duration-200"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {userUpcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-300 text-lg mb-4">
                    No upcoming events signed up for
                  </p>
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Browse Events <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : userUpcomingEvents.map(({ signup, event, instance }, index) => (
                <Link
                  key={signup.id}
                  to={`/sessions/${instance!.id}`}
                  className="block"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl border-2 border-orange-200 dark:border-slate-500 transform hover:scale-102 cursor-pointer transition-transform duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                          {event!.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(instance!.startDate), 'MMM d, h:mm a')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {instance!.location}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            signup.status === 'confirmed' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          }`}>
                            {signup.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* New Events */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white transform">
                New Events
              </h2>
              <Link
                to="/events"
                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transform hover:scale-105 transition-all duration-200"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-300 text-md p-6 text-center">
                  No new events available
                </p>
              ) : upcomingEvents.map((event, index) => (
                <Link
                  key={event.id}
                  to={`/sessions/${event.id}`}
                  className="block"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl border-2 border-blue-200 dark:border-slate-500 transform hover:scale-102 cursor-pointer transition-transform duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                          {event.eventTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.startDate), 'MMM d, h:mm a')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="inline-block bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-lg text-xs font-medium">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {event.studentSignups.length + event.parentSignups.length}/{event.studentCapacity + event.parentCapacity} spots
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Notifications */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white transform">
                Recent Activity
              </h2>
              <Link
                to="/activity"
                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transform hover:scale-105 transition-all duration-200"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border border-slate-200 dark:border-slate-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 dark:text-white text-sm mb-1">
                        {notification.title}
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - moved to bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/calendar"
          className="bg-gradient-to-br from-indigo-400 to-purple-500 p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 hover:rotate-1 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <h3 className="text-xl font-bold mb-1">Browse Calendar</h3>
              <p className="text-indigo-100">See all events running this month</p>
            </div>
          </div>
        </Link>

        <Link
          to="/events"
          className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 hover:-rotate-1 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <h3 className="text-xl font-bold mb-1">Discover Events</h3>
              <p className="text-emerald-100">Find new volunteer opportunities</p>
            </div>
          </div>
        </Link>

        <Link
          to="/chapter"
          className="bg-gradient-to-br from-pink-400 to-red-500 p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 hover:rotate-1 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <h3 className="text-xl font-bold mb-1">View Chapter</h3>
              <p className="text-emerald-100">Meet new volunteers in your area</p>
            </div>
          </div>
        </Link>
      </div>
              <div
                key={event.id}
                className={`bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl border-2 border-orange-200 dark:border-slate-500 transform hover:scale-102 cursor-pointer transition-transform duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                      {event.eventTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.startDate), 'MMM d, h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-lg text-xs font-medium">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {event.studentSignups.length + event.parentSignups.length}/{event.studentCapacity + event.parentCapacity} spots
                    </p>
                  </div>
                </div>
      </div>
    </div>
  );
}