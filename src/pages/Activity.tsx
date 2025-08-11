import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Filter, Search, CheckCircle, XCircle, Users2, SortAsc, SortDesc, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, eventsAPI, signupsAPI } from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Activity() {
  const { user } = useAuth();
  const { userId } = useParams();

  // Determine which user's history to show
  const targetUserId = userId || user?.id;
  const [targetUser, setTargetUser] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waitlist' | 'waitlist_pending' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [stickyControls, setStickyControls] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Add refs for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  const loadMore = useCallback(() => {
    if (loadingMore) return;

    setLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setOffset(prev => prev + 10);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore]);

  // Load user and history data
  useEffect(() => {
    const loadHistoryData = async () => {
      if (!targetUserId) return;

      try {
        setLoading(true);
        console.log('Loading history for user:', targetUserId);

        const [userData, signupsData] = await Promise.all([
          usersAPI.getById(targetUserId),
          signupsAPI.getAll({ userId: targetUserId })
        ]);

        console.log('API responses:', { userData, signupsData });

        setTargetUser(userData.user);

        // Get events for the signups
        const signups = signupsData.signups || [];
        const eventIds = [...new Set(signups.map((s: any) => s.eventId))] as string[];
        const eventsData = await Promise.all(
          eventIds.map((id: string) => eventsAPI.getById(id))
        );
        const events = eventsData.map((response: any) => response.event);

        // Create session history from signups
        const sessions = signups.map((signup: any) => {
          const event = events.find((e: any) => e.id === signup.eventId);
          const instance = event?.instances.find((i: any) => i.id === signup.instanceId);

          return {
            ...signup,
            event,
            instance,
            sessionDate: instance && instance.startDate ? new Date(instance.startDate) : null,
            sessionLocation: instance?.location || '',
            sessionDescription: instance?.description || '',
            eventTitle: event?.title || 'Unknown Event',
            eventCategory: event?.category || 'Unknown Category'
          };
        });

        console.log('History data loaded:', {
          signupsCount: signups.length,
          eventsCount: events.length,
          sessionsCount: sessions.length,
          sessions: sessions
        });

        setSessionHistory(sessions);
      } catch (error) {
        console.error('Failed to load history data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, [targetUserId]);

  // Apply filters and sorting
  const filteredSessions = sessionHistory
    .filter(session => {
      // Fix filter logic
      let matchesFilter = false;
      if (filter === 'all') {
        matchesFilter = true;
      } else if (filter === 'waitlist_pending') {
        matchesFilter = session.status === 'WAITLIST_PENDING';
      } else {
        matchesFilter = session.status === filter.toUpperCase();
      }

      const matchesSearch = search === '' ||
        session.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
        session.eventCategory.toLowerCase().includes(search.toLowerCase()) ||
        (session.sessionLocation && session.sessionLocation.toLowerCase().includes(search.toLowerCase()));

      console.log('Filtering session:', {
        sessionId: session.id,
        status: session.status,
        filter,
        matchesFilter,
        search,
        matchesSearch,
        eventTitle: session.eventTitle
      });

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = (new Date(a.signupDate).getTime()) - (new Date(b.signupDate).getTime());
          break;
        case 'title':
          comparison = a.eventTitle.localeCompare(b.eventTitle);
          break;
        case 'category':
          comparison = a.eventCategory.localeCompare(b.eventCategory);
          break;
        case 'hours':
          comparison = (a.hoursEarned || 0) - (b.hoursEarned || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'sessionDate':
          comparison = (a.sessionDate?.getTime() || 0) - (b.sessionDate?.getTime() || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const displayedSessions = filteredSessions.slice(0, offset + 10);
  const hasMoreSessions = offset + 10 < filteredSessions.length;

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMoreSessions && !loadingMore) {
            loadMore();
          }
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1,
        }
      );

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMoreSessions, loadingMore]);

  if (loading) {
    return (
      <div className="text-center flex w-full h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalHours = sessionHistory.reduce((sum, session) => sum + (session.hoursEarned || 0), 0);
  const confirmedSessions = sessionHistory.filter(session => session.status === 'CONFIRMED').length;
  const totalSessions = sessionHistory.length;

  console.log('History state:', {
    sessionHistoryLength: sessionHistory.length,
    filteredSessionsLength: filteredSessions.length,
    displayedSessionsLength: displayedSessions.length,
    filter,
    search,
    totalHours,
    confirmedSessions,
    totalSessions
  });

  if (!targetUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">User not found</p>
        <Link to="/activity" className="text-orange-600 dark:text-orange-400 hover:underline">
          Back to Your History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold shrink-0">
            {targetUser.name.charAt(0)}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
              {targetUser.name}'s Activity
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track volunteer journey and contributions
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Recorded Hours</p>
              <p className="text-2xl font-semibold">{totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">Sessions Participated</p>
              <p className="text-2xl font-semibold">{confirmedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-xs font-medium">Total Sessions</p>
              <p className="text-2xl font-semibold">{totalSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 sticky w-full top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6"}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 border border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white py-2 text-sm`}
          />
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 w-full max-w-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {filteredSessions.length} result{filteredSessions.length === 1 ? '' : 's'} found
          </h2>
          
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'waitlist', 'waitlist_pending', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors capitalize text-xs ${filter === status
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                  : 'bg-indigo-100 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-slate-600'
                  }`}
              >
                {status === 'waitlist_pending' ? 'pending' : status.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                <thead className="dark:text-white">
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        Event
                        {sortBy === 'title' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('sessionDate')}
                        className="flex text-left items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                      >
                        Date
                        {sortBy === 'sessionDate' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('hours')}
                        className="flex text-left items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        Hours
                        {sortBy === 'hours' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium hidden md:table-cell">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex text-left items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                      >
                        Signed Up
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {displayedSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-16 pb-12 text-sm text-slate-500">
                        No sessions found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    displayedSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {session.eventTitle.charAt(0)}
                            </div>
                            <div>
                              <Link className="transition-colors dark:text-white text-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400" to={`/events/${session.eventId}`}>
                                <span className="font-medium">{session.eventTitle}</span>
                              </Link>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{session.eventCategory}</div>
                            </div>
                          </div>
                        </td>
                        <Link className="group" to={`/sessions/${session.instanceId}`}>
                          <td className="py-3 px-2 sm:px-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {session.sessionDate ? formatLocalDate(session.sessionDate, 'MMM d, yyyy h:mm a') : 'Date TBD'}
                            </div>
                            {session.sessionLocation && (
                              <div className="text-xs text-slate-500 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {session.sessionLocation}
                              </div>
                            )}
                          </td>
                        </Link>
                        <td className="py-3 px-2 sm:px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              <span className="font-medium text-slate-800 dark:text-white">
                                {session.hoursEarned || 0}
                              </span>
                            </div>
                            {/* Show attendance */}
                            <div>
                              {session.attendance ? (
                                <div className="flex items-center gap-1">
                                  {session.attendance === 'PRESENT' ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                      <span className="text-xs text-green-600 font-medium">Present</span>
                                    </>
                                  ) : session.attendance === 'ABSENT' ? (
                                    <>
                                      <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Absent</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {session.attendance === 'NOT_MARKED' ? '' : session.attendance}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${session.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                            session.status === 'WAITLIST' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                              session.status === 'WAITLIST_PENDING' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                                session.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                                  'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                            {session.status === 'WAITLIST_PENDING' ? 'pending response' : session.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <div>{formatLocalDate(session.signupDate, 'MMM d, yyyy')}</div>
                            {session.status === 'CANCELLED' && session.cancelledAt && (
                              <div className="text-xs text-red-600 dark:text-red-400">
                                Cancelled: {formatLocalDate(session.cancelledAt, 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Load More Section */}
        {hasMoreSessions && (
          <div className="mt-6 text-center">
            <div ref={loadMoreRef} className="py-4">
              {loadingMore ? (
                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                  <LoadingSpinner size="sm" />
                  <span>Loading more sessions...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Load More Sessions
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div >
  );
}