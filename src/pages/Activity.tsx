import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, XCircle, Clock, Users, Calendar, MapPin, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

export default function Activity() {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'signup' | 'hours_awarded' | 'reminder'>('all');

  const [stickyControls, setStickyControls] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const controlsElement = document.getElementById("controls");
      if (controlsElement) {
        setStickyControls(window.scrollY > controlsElement.offsetHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock recent activities based on user actions
  const recentActivities = [
    {
      id: '1',
      type: 'signup',
      title: 'Successfully signed up!',
      message: 'You have been confirmed for Community Garden Cleanup',
      timestamp: '2 hours ago',
      eventTitle: 'Community Garden Cleanup',
      eventId: '1',
      sessionId: '1-1'
    },
    {
      id: '2',
      type: 'hours_awarded',
      title: 'Volunteer hours awarded',
      message: 'You earned 3 volunteer hours for attending Senior Center Bingo Night',
      timestamp: '1 day ago',
      eventTitle: 'Senior Center Bingo Night',
      eventId: '3',
      sessionId: '3-1'
    },
    {
      id: '3',
      type: 'reminder',
      title: 'Event reminder',
      message: 'Community Garden Cleanup is tomorrow at 9:00 AM',
      timestamp: '2 days ago',
      eventTitle: 'Community Garden Cleanup',
      eventId: '1',
      sessionId: '1-1'
    },
    {
      id: '4',
      type: 'waitlist_moved',
      title: 'Moved from waitlist',
      message: 'A spot opened up and you have been confirmed for Food Bank Sorting',
      timestamp: '3 days ago',
      eventTitle: 'Food Bank Sorting',
      eventId: '2',
      sessionId: '2-1'
    },
    {
      id: '5',
      type: 'event_cancelled',
      title: 'Event cancelled',
      message: 'Unfortunately, the Library Reading Program has been cancelled due to low enrollment',
      timestamp: '1 week ago',
      eventTitle: 'Library Reading Program',
      eventId: '4',
      sessionId: '4-1'
    }
  ];

  const filteredActivities = recentActivities.filter(activity => {
    const matchesSearch = search === '' ||
      activity.title.toLowerCase().includes(search.toLowerCase()) ||
      activity.message.toLowerCase().includes(search.toLowerCase()) ||
      activity.eventTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || activity.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'hours_awarded':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-yellow-600" />;
      case 'waitlist_moved':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'event_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signup':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'hours_awarded':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'reminder':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'waitlist_moved':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'event_cancelled':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700';
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Activity Feed
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Stay updated with your volunteer activities and notifications
        </p>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg transform border-orange-200 dark:border-slate-600 sticky w-full top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b-4 -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "border-4 p-6"}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2 text-sm" : "py-3 text-base"}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'signup', 'hours_awarded', 'reminder'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${stickyControls ? "text-sm" : "text-base"} ${
                  filter === filterType
                    ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                    : 'bg-orange-100 dark:bg-slate-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-slate-600'
                }`}
              >
                {filterType === 'all' ? 'All' : 
                 filterType === 'signup' ? 'Signups' :
                 filterType === 'hours_awarded' ? 'Hours' : 'Reminders'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center border-4 border-orange-200 dark:border-slate-600">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              No activities found matching your criteria
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-6 rounded-2xl shadow-lg border-4 border-dashed transition-all hover:scale-102 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                      {activity.title}
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-3">
                    {activity.message}
                  </p>
                  {activity.eventTitle && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <Link
                        to={`/sessions/${activity.sessionId}`}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-sm"
                      >
                        {activity.eventTitle}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}