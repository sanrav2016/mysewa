import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import EventInstanceDisplay from '../components/EventInstanceDisplay';

export default function Events() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [stickyControls, setStickyControls] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setOffset(0);
        const response = await eventsAPI.getAll({
          search,
          category: categoryFilter,
          sortBy: sortBy === 'date' ? 'startDate' : sortBy,
          sortOrder: 'asc'
        });
        setEvents(response.events);
        setHasMore(response.events.length >= 10);

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(response.events.map((e: any) => e.category))).filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [search, categoryFilter, sortBy]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setOffset(prev => prev + 10);
    setLoadingMore(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const controlsElement = document.getElementById("controls");
      if (controlsElement) {
        setStickyControls(window.scrollY > controlsElement.offsetHeight);
      }

      // Infinite scroll detection
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, hasMore, loadingMore, search, categoryFilter, sortBy]);

  const convert = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  }

  const displayedEvents = events.slice(0, offset + 10);
  const hasMoreEvents = offset + 10 < events.length;

  return (
    <div className="space-y-6 relative p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          All Events
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Discover volunteer opportunities and make a difference
        </p>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 sticky w-full top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6"}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transform ${stickyControls ? "py-2 text-sm" : "py-3 text-base"}`}
              />
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 md:gap-4">
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
        {loading ? (
          <div className="col-span-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center transform border-4 border-orange-200 dark:border-slate-600">
            <LoadingSpinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center transform border-4 border-orange-200 dark:border-slate-600">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              No events found matching your criteria
            </p>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 gap-6">
              {
                events.map((event: any, i: number) => {
                  const nextInstance = event.instances.find((i: any) => i.startDate && new Date(i.startDate) > new Date());

                  return (
                    <Link key={event.id} to={`/events/${event.id}`}>
                      <div
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700/50 transition-all hover:scale-[1.02] hover:shadow-xl group break-inside-avoid mb-4 space-y-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm transition-all hover:scale-105">
                            {event.title.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                              {event.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-xs mb-3 line-clamp-2">
                              {convert(event.description)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                {event.category}
                              </span>
                              {event.isRecurring && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                  Recurring
                                </span>
                              )}
                              {user?.role === 'ADMIN' && event.status !== 'PUBLISHED' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${event.status === 'DRAFT'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                                  }`}>
                                  {event.status.toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {nextInstance && (
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                            <h4 className="font-medium text-slate-800 dark:text-white mb-1 text-sm">Next Session:</h4>
                            <EventInstanceDisplay instance={nextInstance} />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              }
            </div>
            {loadingMore && (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Loading more events...
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}