import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Filter, Search, CheckCircle, XCircle, Users2, SortAsc, SortDesc, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockEvents, mockSignups, mockUsers } from '../data/mockData';
import { format } from 'date-fns';

export default function History() {
  const { user } = useAuth();
  const { userId } = useParams();

  // Determine which user's history to show
  const targetUserId = userId || user?.id;
  const targetUser = mockUsers.find(u => u.id === targetUserId);

  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waitlist' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [stickyControls, setStickyControls] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Get user's signups grouped by event
  const getUserEventHistory = () => {
    if (!targetUserId) return [];

    const userSignups = mockSignups.filter(signup => signup.userId === targetUserId);

    // Group signups by event
    const eventMap = new Map();

    userSignups.forEach(signup => {
      const event = mockEvents.find(e => e.id === signup.eventId);
      if (!event) return;

      if (!eventMap.has(signup.eventId)) {
        eventMap.set(signup.eventId, {
          eventId: signup.eventId,
          event,
          sessions: [],
          totalEventHours: 0,
          totalSignups: 0,
          earliestSignup: null,
          latestSignup: null
        });
      }

      const eventData = eventMap.get(signup.eventId);
      const instance = event.instances.find(i => i.id === signup.instanceId);

      eventData.sessions.push({
        ...signup,
        instance,
        sessionDate: instance ? new Date(instance.startDate) : null,
        sessionLocation: instance?.location || '',
        sessionDescription: instance?.description || ''
      });
      eventData.totalEventHours += signup.hoursEarned || 0;
      eventData.totalSignups += 1;

      const signupDate = new Date(signup.signupDate);
      if (!eventData.earliestSignup || signupDate < eventData.earliestSignup) {
        eventData.earliestSignup = signupDate;
      }
      if (!eventData.latestSignup || signupDate > eventData.latestSignup) {
        eventData.latestSignup = signupDate;
      }
    });

    return Array.from(eventMap.values());
  };

  const eventHistory = getUserEventHistory();

  // Apply filters and sorting
  const filteredEvents = eventHistory
    .filter(eventData => {
      const matchesFilter = filter === 'all' || eventData.sessions.some((s: any) => s.status === filter);
      const matchesSearch = search === '' ||
        eventData.event.title.toLowerCase().includes(search.toLowerCase()) ||
        eventData.event.category.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = (a.latestSignup?.getTime() || 0) - (b.latestSignup?.getTime() || 0);
          break;
        case 'title':
          comparison = a.event.title.localeCompare(b.event.title);
          break;
        case 'category':
          comparison = a.event.category.localeCompare(b.event.category);
          break;
        case 'hours':
          comparison = a.totalEventHours - b.totalEventHours;
          break;
        case 'sessions':
          comparison = a.totalSignups - b.totalSignups;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalHours = eventHistory.reduce((sum, event) => sum + event.totalEventHours, 0);
  const confirmedEvents = eventHistory.filter(event => event.sessions.some((s: any) => s.status === 'confirmed')).length;
  const totalEvents = eventHistory.length;

  if (!targetUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">User not found</p>
        <Link to="/history" className="text-orange-600 dark:text-orange-400 hover:underline">
          Back to Your History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
            {targetUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              {targetUser.name}'s Volunteer History
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track volunteer journey and contributions
            </p>
          </div>
        </div>
        {userId && userId !== user?.id && (
          <Link to="/history" className="text-orange-600 dark:text-orange-400 hover:underline text-sm">
            ← Back to Your History
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Hours Earned</p>
              <p className="text-3xl font-bold">{totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-green-200" />
            <div>
              <p className="text-green-100 text-sm font-medium">Events Participated</p>
              <p className="text-3xl font-bold">{totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Users2 className="w-8 h-8 text-purple-200" />
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Sessions</p>
              <p className="text-3xl font-bold">{eventHistory.reduce((sum, event) => sum + event.totalSignups, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg transform border-orange-200 dark:border-slate-600 sticky w-full top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b-4 -mx-4 lg:-mx-8 w-[calc(100%_+_32px)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "border-4 p-6"}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2 text-sm" : "py-3 text-base"}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'waitlist', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${stickyControls ? "text-sm" : "text-base"} ${filter === status
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                  : 'bg-orange-100 dark:bg-slate-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-slate-600'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {filteredEvents.length} results found
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full dark:text-white">
            <thead>
              <tr className="border-b-2 border-orange-200 dark:border-slate-600">
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Event
                    {sortBy === 'title' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Category
                    {sortBy === 'category' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('sessions')}
                    className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Sessions
                    {sortBy === 'sessions' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('hours')}
                    className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Hours
                    {sortBy === 'hours' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    Last Activity
                    {sortBy === 'date' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No events found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredEvents.map((eventData) => (
                  <React.Fragment key={eventData.eventId}>
                    <tr
                      className="border-b border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedEventId(expandedEventId === eventData.eventId ? null : eventData.eventId)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {eventData.event.title.charAt(0)}
                          </div>
                          <div>
                            <Link className="transition-colors dark:text-white text-slate-800 hover:text-orange-600 dark:hover:text-orange-400" to={`/events/${eventData.eventId}`}>
                              <div className="font-medium">{eventData.event.title}</div>
                            </Link>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{eventData.event.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg text-sm font-medium">
                          {eventData.event.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                            {eventData.totalSignups}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            session{eventData.totalSignups !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-white">
                          {eventData.totalEventHours}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {eventData.latestSignup ? format(eventData.latestSignup, 'MMM d, yyyy') : 'N/A'}
                      </td>
                    </tr>

                    {/* Expandable Sessions Row */}
                    {expandedEventId === eventData.eventId && (
                      <tr className="bg-orange-50 dark:bg-slate-700/30">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-orange-200 dark:border-slate-600 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              <h4 className="font-bold text-slate-800 dark:text-white">
                                {eventData.event.title} - Sessions ({eventData.sessions.length})
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {eventData.sessions.map((session: any) => (
                                <Link
                                  key={session.id}
                                  to={`/sessions/${session.instanceId}`}
                                  className="block bg-orange-50 dark:bg-slate-700 p-4 rounded-lg border border-orange-200 dark:border-slate-600 hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-slate-800 dark:text-white">
                                        {session.sessionDate ? format(session.sessionDate, 'MMM d, yyyy h:mm a') : 'Date TBD'}
                                      </div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {session.sessionLocation}
                                      </div>
                                      {session.sessionDescription && (
                                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                          {session.sessionDescription}
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                        Signed up: {format(new Date(session.signupDate), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${session.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                          session.status === 'waitlist' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        }`}>
                                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                      </span>
                                      {session.hoursEarned && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                          {session.hoursEarned}h
                                        </div>
                                      )}
                                      {session.attendance && (
                                        <div className="mt-1">
                                          {session.attendance === 'present' ? (
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Present</span>
                                          ) : session.attendance === 'absent' ? (
                                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">✗ Absent</span>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}