import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Filter, Search, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockEvents, mockSignups } from '../data/mockData';
import { format } from 'date-fns';

export default function History() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'waitlist' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
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

  // Get user's signups with event details
  const userSignups = mockSignups
    .filter(signup => signup.userId === user?.id)
    .map(signup => {
      const event = mockEvents.find(e => e.id === signup.eventId);
      const instance = event?.instances.find(i => i.id === signup.instanceId);
      return { signup, event, instance };
    })
    .filter(item => item.event && item.instance)
    .sort((a, b) => new Date(b.signup.signupDate).getTime() - new Date(a.signup.signupDate).getTime());

  // Apply filters
  const filteredSignups = userSignups.filter(({ signup, event }) => {
    const matchesFilter = filter === 'all' || signup.status === filter;
    const matchesSearch = search === '' ||
      event!.title.toLowerCase().includes(search.toLowerCase()) ||
      event!.category.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalHours = userSignups.reduce((sum, { signup }) => sum + (signup.hoursEarned || 0), 0);
  const confirmedEvents = userSignups.filter(({ signup }) => signup.status === 'confirmed').length;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Volunteer History
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Track your volunteer journey and contributions
        </p>
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
              <p className="text-green-100 text-sm font-medium">Events Completed</p>
              <p className="text-3xl font-bold">{confirmedEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Filter className="w-8 h-8 text-purple-200" />
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Signups</p>
              <p className="text-3xl font-bold">{userSignups.length}</p>
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
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2" : "py-3"}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'waitlist', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === status
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

      {/* History List */}
      <div className="space-y-4">
        {filteredSignups.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center border-4 border-orange-200 dark:border-slate-600">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              No activities found matching your criteria
            </p>
          </div>
        ) : (
          filteredSignups.map(({ signup, event, instance }, index) => (
            <Link
              to={`/sessions/${instance!.id}`}
              key={signup.id}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600 block transition-all hover:scale-102"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {event!.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {event!.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span className="truncate">{format(new Date(instance!.startDate), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{instance!.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="truncate">Signed up {format(new Date(signup.signupDate), 'MMM d, yyyy')}</span>
                        </div>
                        {signup.attendance && (
                          <div className="flex items-center gap-1">
                            {signup.attendance === 'present' ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">Present</span>
                              </>
                            ) : signup.attendance === 'absent' ? (
                              <>
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Absent</span>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg text-sm font-medium">
                          {event!.category}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${signup.status === 'confirmed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : signup.status === 'waitlist'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                          {signup.status.charAt(0).toUpperCase() + signup.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {signup.hoursEarned && (
                  <div className="text-right">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-xl font-bold text-lg">
                      {signup.hoursEarned} hrs
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div >
  );
}