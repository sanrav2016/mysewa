import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, MapPin, Users, Calendar as CalendarIcon, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay, setHours } from 'date-fns';
import { formatLocalDate } from '../utils/dateUtils';
import { eventsAPI, signupsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

type ViewType = 'month' | 'week' | 'day';

export default function Calendar() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showUserEventsOnly, setShowUserEventsOnly] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [liveDate, setLiveDate] = useState(new Date());
  const [stickyControls, setStickyControls] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const controlsElement = document.getElementById("controls");
      if (controlsElement) {
        const rect = controlsElement.getBoundingClientRect();
        setStickyControls(rect.top <= 0);
      }
    };

    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load events and signups from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [eventsResponse, signupsResponse] = await Promise.all([
          eventsAPI.getAll(),
          signupsAPI.getAll()
        ]);
        setEvents(eventsResponse.events || []);
        setSignups(signupsResponse.signups || []);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = Array.from(new Set(events.map(e => e.category)));

  // Get user's signups for filtering
  const userSignups = signups.filter(signup => signup.userId === user?.id && signup.status == "CONFIRMED");
  const userSessionIds = userSignups.map(signup => signup.instanceId);

  // Get date ranges based on view type
  const getDateRange = () => {
    switch (viewType) {
      case 'month': {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
        return {
          start,
          end,
          days: eachDayOfInterval({ start, end })
        };
      }
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
          days: eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) })
        };
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
          days: [currentDate]
        };
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
          days: eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
        };
    }
  };

  const { start: rangeStart, end: rangeEnd, days } = getDateRange();

  // Get all event instances for the current range
  const rangeEvents = events
    .flatMap(event =>
      event.instances
        .filter((instance: any) => {
          // Only include instances with valid start dates
          if (!instance.startDate) return false;
          const instanceDate = new Date(instance.startDate);
          return instanceDate >= rangeStart && instanceDate <= rangeEnd;
        })
        .map((instance: any) => ({
          ...instance,
          eventTitle: event.title,
          category: event.category,
          tags: event.tags,
          eventId: event.id
        }))
    )
    .filter(event => {
      const matchesSearch = search === '' ||
        event.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
        event.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      const matchesUserFilter = !showUserEventsOnly || userSessionIds.includes(event.id);
      return matchesSearch && matchesCategory && matchesUserFilter;
    });

  const getEventsForDay = (day: Date) => {
    return rangeEvents.filter(event =>
      isSameDay(new Date(event.startDate), day)
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewType) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'prev' ? addDays(currentDate, -7) : addDays(currentDate, 7));
        break;
      case 'day':
        setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1));
        break;
    }
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewType('day');
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(startOfWeek(currentDate), 'MMMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

    const calendarDays = [];
    let day = start;

    while (day <= end) {
      calendarDays.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 lg:gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-slate-600 dark:text-slate-300 py-1 text-xs lg:text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 lg:gap-2">
          {calendarDays.map(day => {
            const normalizedDay = startOfDay(day);
            const dayEvents = getEventsForDay(normalizedDay);
            const isToday = isSameDay(normalizedDay, new Date());
            const isCurrentMonth = isSameMonth(normalizedDay, currentDate);

            return (
              <div
                key={normalizedDay.toISOString()}
                onClick={() => handleDayClick(normalizedDay)}
                className={`transition-all min-h-16 md:min-h-24 p-1 lg:p-2 rounded-lg border cursor-pointer
                  ${isCurrentMonth
                    ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                  ${isToday ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}
                `}
              >
                <div className={`text-xs lg:text-sm font-semibold mb-1 lg:mb-2 ${isToday
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : isCurrentMonth
                    ? 'text-slate-800 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                  }`}>
                  {format(normalizedDay, 'd')}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 1).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded font-medium truncate ${
                        event.status === 'CANCELLED'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                      }`}
                      title={`${event.eventTitle} at ${event.location}${event.status === 'CANCELLED' ? ' (Cancelled)' : ''}`}
                    >
                      <div className="hidden lg:block">
                        {event.startDate ? formatLocalDate(event.startDate, 'h:mm a') + ' - ' : ''}{event.eventTitle}
                        {event.status === 'CANCELLED' && ' (Cancelled)'}
                      </div>
                      <div className="lg:hidden">
                        {event.eventTitle}
                        {event.status === 'CANCELLED' && ' (Cancelled)'}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 1 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      +{dayEvents.length - 1} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="space-y-4">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 lg:gap-2">
        {days.map(day => (
          <div key={day.toISOString()} className="text-center">
            <div className="font-semibold text-slate-600 dark:text-slate-300 text-xs lg:text-sm">
              {format(day, 'EEE')}
            </div>
                         <div className={`text-sm lg:text-lg font-bold mt-1 ${isSameDay(day, new Date())
               ? 'text-indigo-600 dark:text-indigo-400'
               : 'text-slate-800 dark:text-white'
               }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-1 lg:gap-2">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
                             className={`min-h-[120px] lg:min-h-[160px] p-2 lg:p-3 rounded-lg border-2  transition-colors duration-200 cursor-pointer bg-white dark:bg-slate-700 border-indigo-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600 ${isToday ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''
                 }`}
            >
              <div className="lg:hidden mb-2">
                <div className="font-semibold text-slate-800 dark:text-white text-sm">
                  {format(day, 'EEE, MMM d')}
                </div>
              </div>

              <div className="space-y-2">
                                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded-lg ${
                      event.status === 'CANCELLED'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                    }`}
                  >
                    <div className="font-semibold text-xs lg:text-sm truncate">
                      {event.eventTitle}
                      {event.status === 'CANCELLED' && ' (Cancelled)'}
                    </div>
                    {event.startDate && (
                      <div className="text-xs lg:text-sm">
                        {formatLocalDate(event.startDate, 'h:mm a')}
                      </div>
                    )}
                    <div className="text-xs truncate">
                      {event.location}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);

    // Sort events by start time
    const sortedEvents = [...dayEvents].sort(
      (a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return aDate - bDate;
      }
    );

    // Group events into columns to handle overlaps
    const columns: any[][] = [];

    sortedEvents.forEach(event => {
      const start = event.startDate ? new Date(event.startDate).getTime() : 0;
      const end = event.endDate ? new Date(event.endDate).getTime() : start;

      let placed = false;
      for (const col of columns) {
        const lastInCol = col[col.length - 1];
        const lastEnd = lastInCol.endDate ? new Date(lastInCol.endDate).getTime() : (lastInCol.startDate ? new Date(lastInCol.startDate).getTime() : 0);
        if (start >= lastEnd) {
          col.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([event]);
    });

    // Time slots: every hour from 6am to 10pm
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
             <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border-2 border-indigo-200 dark:border-slate-500 overflow-x-auto">
        <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white mb-3">
          Events for {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>

        {dayEvents.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-300 text-sm text-center py-12">
            No events found matching your criteria
          </p>
        ) : (
          <div className="relative w-full border-l border-slate-300 dark:border-slate-500 pl-12">
            {
              isSameDay(liveDate, currentDate) && hours.includes(liveDate.getHours()) &&
              <div className="transition-all absolute h-1  border-t-2 border-slate-300 dark:border-slate-500 w-full left-0" style={{ top: `${(liveDate.getHours() + liveDate.getMinutes() / 60) * 64 - 1}px` }}>
                <span className="absolute text-xs bottom-full mb-1 right-0 font-bold text-slate-300 dark:text-slate-500">{format(liveDate, 'h:mm a')}</span>
              </div>
            }

            {/* Time labels */}
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 border-b border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm absolute left-0 w-full pl-1 pt-1 text-left"
                style={{ top: `${hour * 64}px` }}
              >
                {format(new Date(0, 0, 0, hour), 'h a')}
              </div>
            ))}

            {/* Container for events */}
            <div style={{ height: `${64 * hours.length}px` }} className="relative">
              {columns.map((col, colIdx) =>
                col.map(event => {
                  const start = event.startDate ? new Date(event.startDate) : new Date();
                  const end = event.endDate ? new Date(event.endDate) : start;
                  const top = ((start.getHours() + start.getMinutes() / 60)) * 64;
                  const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 64;
                  const widthPercent = 100 / columns.length;
                  const leftPercent = colIdx * widthPercent;

                  return (
                    <div
                      key={event.id}
                      className="absolute p-1 overflow-hidden"
                      style={{
                        top,
                        height,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`
                      }}
                    >
                      <div className={`p-2 rounded-lg text-sm shadow-md h-full overflow-hidden ${
                        event.status === 'CANCELLED'
                          ? 'bg-red-200/40 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          : 'bg-indigo-200/40 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
                      }`}>
                        <Link to={`/sessions/${event.id}`} className={`transition-colors ${
                          event.status === 'CANCELLED'
                            ? 'hover:text-red-600 dark:hover:text-red-400'
                            : 'hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}>
                          <span className="font-semibold">{event.eventTitle}</span>
                          {event.status === 'CANCELLED' && ' (Cancelled)'}
                        </Link>
                        <div className="text-xs">
                          {formatLocalDate(start, 'h:mm a')} - {formatLocalDate(end, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Event Calendar
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          View all volunteer opportunities by {viewType}
        </p>
      </div>

      {/* Controls */}
            <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 transition-all ${stickyControls ? "border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6 rounded-xl"}`}>

        <div className={stickyControls ? "space-y-3" : "space-y-4"}>
          {/* Date Navigation + View Type */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-center">
            {/* Navigation */}
            <div className="flex items-center gap-3 flex-1 w-full">
              <button
                onClick={() => navigateDate('prev')}
                className={`${stickyControls ? "p-1" : "p-2"} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-300 dark:border-indigo-700 hover:scale-105 cursor-pointer transition-all`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex-1 text-center">
                {getViewTitle()}
              </h2>
              <button
                onClick={() => navigateDate('next')}
                className={`${stickyControls ? "p-1" : "p-2"} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-300 dark:border-indigo-700 hover:scale-105 cursor-pointer transition-all`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View Type Selector */}
            <div className="flex flex-wrap gap-2">
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`transition-all hover:scale-105 px-3 py-2 rounded-lg font-medium text-sm ${viewType === view
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                    : 'bg-indigo-100 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300'
                    }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white py-2 text-sm`}
                />
              </div>
            </div>

            {/* Category Filter + My Events */}
            <div className="flex gap-4 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none text-sm p-2`}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowUserEventsOnly(!showUserEventsOnly)}
                className={`hover:scale-105 transition-all flex items-center gap-2 rounded-lg font-medium border px-4 py-2 text-sm ${showUserEventsOnly
                  ? 'bg-blue-500 text-white border-blue-400'
                  : 'bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-slate-600'
                  }`}
              >
                <User className="w-4 h-4" />
                <span className={stickyControls ? "hidden" : "hidden lg:inline"}>My Events</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {viewType === 'month' && renderMonthView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'day' && renderDayView()}
          </>
        )}
      </div>
    </div>

  );
}