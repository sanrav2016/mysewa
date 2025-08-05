import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { mockEvents } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function Events() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [stickyControls, setStickyControls] = useState(false);

  window.addEventListener('scroll', () => {
    setStickyControls(window.scrollY > document.getElementById("controls")!.offsetHeight);
  })

  const categories = Array.from(new Set(mockEvents.map(e => e.category)));

  const convert = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  }

  // Filter and sort events
  const filteredEvents = mockEvents
    .filter(event => {
      // Hide archived events from non-admins
      if (user?.role !== 'admin' && event.status === 'archived') {
        return false;
      }
      // Hide draft events from non-admins
      if (user?.role !== 'admin' && event.status === 'draft') {
        return false;
      }
      return true;
    })
    .filter(event => {
      const matchesSearch = search === '' ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        convert(event.description).toLowerCase().includes(search.toLowerCase()) ||
        event.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          const aNextInstance = a.instances.find(i => new Date(i.startDate) > new Date());
          const bNextInstance = b.instances.find(i => new Date(i.startDate) > new Date());
          if (!aNextInstance && !bNextInstance) return 0;
          if (!aNextInstance) return 1;
          if (!bNextInstance) return -1;
          return new Date(aNextInstance.startDate).getTime() - new Date(bNextInstance.startDate).getTime();
      }
    });

  return (
    <div className="space-y-6 relative p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 transform">
          All Events
        </h1>
        <p className="text-slate-600 dark:text-slate-300 transform">
          Discover volunteer opportunities and make a difference
        </p>
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
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transform ${stickyControls ? "py-2" : "py-3"}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transform ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-3"}`}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'category')}
              className={`border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transform ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-3"}`}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div>
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center transform border-4 border-orange-200 dark:border-slate-600">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              No events found matching your criteria
            </p>
          </div>
        ) : <div className="columns-1 md:columns-2 gap-6">
          {
            filteredEvents.map((event, i) => {
              const nextInstance = event.instances.find(i => new Date(i.startDate) > new Date());
              const totalSignups = nextInstance
                ? nextInstance.studentSignups.length + nextInstance.parentSignups.length
                : 0;
              const totalCapacity = nextInstance
                ? nextInstance.studentCapacity + nextInstance.parentCapacity
                : 0;

              return (
                <Link to={`/events/${event.id}`}>
                  <div
                    key={event.id}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600 transform transition-all hover:scale-102 hover:shadow-xl group break-inside-avoid mb-6 space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold transform transition-all ${i % 2 == 1 ? "group-hover:rotate-6" : "group-hover:-rotate-6"}`}>
                        {event.title.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                          {event.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">
                          {convert(event.description)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg text-sm font-medium">
                            {event.category}
                          </span>
                          {event.isRecurring && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-lg text-sm font-medium">
                              Recurring
                            </span>
                          )}
                          {user?.role === 'admin' && event.status !== 'published' && (
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${event.status === 'draft'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                              }`}>
                              {event.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {nextInstance && (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl mb-4 transform">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Next Session:</h4>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(nextInstance.startDate), 'MMM d, yyyy h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {nextInstance.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {totalSignups}/{totalCapacity} spots filled
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {event.instances.length} session{event.instances.length !== 1 ? 's' : ''} available
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          }
        </div>
        }
      </div>
    </div>
  );
}