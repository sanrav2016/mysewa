import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, Tag, Search, Edit, Filter, SortAsc, SortDesc, User, Users2, Award } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, signupsAPI, usersAPI } from '../services/api';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import EventInstanceDisplay from '../components/EventInstanceDisplay';

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [userSignups, setUserSignups] = useState<any[]>([]);
  const [allSignups, setAllSignups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Statistics table state
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');
  const [volunteerRoleFilter, setVolunteerRoleFilter] = useState('all');
  const [volunteerSortBy, setVolunteerSortBy] = useState('name');
  const [volunteerSortOrder, setVolunteerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedVolunteerId, setExpandedVolunteerId] = useState<string | null>(null);

  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        const [eventData, signupsData, usersData] = await Promise.all([
          eventsAPI.getById(eventId),
          signupsAPI.getAll({ eventId }),
          usersAPI.getAll()
        ]);

        setEvent(eventData.event);
        setAllSignups(signupsData.signups || []);
        setUserSignups((signupsData.signups || []).filter(signup => signup.userId === user?.id));
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Failed to load event data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user?.id]);

  const handleSignup = (instanceId: string) => {
    alert(`Signed up for event instance ${instanceId}!`);
  };

  const isSignedUp = (instanceId: string) => userSignups.some(signup => signup.instanceId === instanceId);

  const canSignUp = (instance: any) => {
    if (isSignedUp(instance.id)) return false;
    const userRole = user?.role;

    // Count signups by role from the actual signup data
    const studentSignups = instance.signups?.filter((s: any) => s.user?.role === 'STUDENT').length || 0;
    const parentSignups = instance.signups?.filter((s: any) => s.user?.role === 'PARENT').length || 0;

    if (userRole === 'STUDENT') {
      return studentSignups < (instance.studentCapacity || 0);
    } else if (userRole === 'PARENT') {
      return parentSignups < (instance.parentCapacity || 0);
    }
    return false;
  };

  // Get all confirmed volunteers for this event with aggregated session data
  const getAllEventVolunteers = () => {
    if (!event) return [];

    const confirmedSignups = allSignups.filter(signup => signup.status === 'CONFIRMED');

    // Group signups by user
    const volunteerMap = new Map();

    confirmedSignups.forEach(signup => {
      const user = users.find(u => u.id === signup.userId);
      const instance = event.instances.find(i => i.id === signup.instanceId);

      if (!user) return;

      if (!volunteerMap.has(signup.userId)) {
        volunteerMap.set(signup.userId, {
          userId: signup.userId,
          user,
          sessions: [],
          totalEventHours: 0,
          totalSignups: 0
        });
      }

      const volunteer = volunteerMap.get(signup.userId);
      volunteer.sessions.push({
        ...signup,
        instance,
        sessionDate: instance && instance.startDate ? new Date(instance.startDate) : null,
        sessionLocation: instance?.location || '',
        sessionDescription: instance?.description || ''
      });
      volunteer.totalEventHours += signup.hoursEarned || 0;
      volunteer.totalSignups += 1;
    });

    return Array.from(volunteerMap.values());
  };

  const volunteerData = getAllEventVolunteers();

  // Filter and sort volunteers
  const filteredVolunteers = volunteerData
    .filter(volunteer => {
      const user = volunteer.user;
      if (!user) return false;

      const nameMatch = user.name.toLowerCase().includes(volunteerSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(volunteerSearchTerm.toLowerCase());
      const roleMatch = volunteerRoleFilter === 'all' || user.role === volunteerRoleFilter;

      return nameMatch && roleMatch;
    })
    .sort((a, b) => {
      const userA = a.user;
      const userB = b.user;
      if (!userA || !userB) return 0;

      let comparison = 0;
      switch (volunteerSortBy) {
        case 'name':
          comparison = userA.name.localeCompare(userB.name);
          break;
        case 'role':
          comparison = userA.role.localeCompare(userB.role);
          break;
        case 'hours':
          comparison = a.totalEventHours - b.totalEventHours;
          break;
        case 'signupDate':
          // Use the earliest signup date for comparison
          const aEarliestDate = Math.min(...a.sessions.map((s: any) => new Date(s.signupDate).getTime()));
          const bEarliestDate = Math.min(...b.sessions.map((s: any) => new Date(s.signupDate).getTime()));
          comparison = aEarliestDate - bEarliestDate;
          break;
        case 'totalHours':
          comparison = userA.totalHours - userB.totalHours;
          break;
        case 'joinedDate':
          comparison = new Date(userA.joinedDate).getTime() - new Date(userB.joinedDate).getTime();
          break;
        case 'sessions':
          comparison = a.totalSignups - b.totalSignups;
          break;
        default:
          comparison = 0;
      }

      return volunteerSortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: string) => {
    if (volunteerSortBy === field) {
      setVolunteerSortOrder(volunteerSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setVolunteerSortBy(field);
      setVolunteerSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="text-center flex w-full h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">Event not found</p>
        <Link to="/events" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  const shouldShowExpandButton = event.description.length > 300;
  const displayDescription = shouldShowExpandButton && !isDescriptionExpanded
    ? event.description.substring(0, 300) + '...'
    : event.description;

  const filteredInstances = event.instances
    .filter(instance => {
      const textMatch = [instance.description, instance.location].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      const date = instance.startDate ? new Date(instance.startDate) : new Date(0);
      const afterMatch = afterDate ? isAfter(date, new Date(afterDate)) : true;
      const beforeMatch = beforeDate ? isBefore(date, new Date(beforeDate)) : true;
      return textMatch && afterMatch && beforeMatch;
    })
          .sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return aDate - bDate;
      });

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <Link to="/events" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:scale-105 transition-all">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-0">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-semibold shadow-lg shrink-0">
              {event.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-4 break-words">{event.title}</h1>
              <div className="text-slate-600 dark:text-slate-300 mb-4 prose prose-lg dark:prose-invert max-w-none">
                <div
                  className="ProseMirror"
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    minHeight: 0
                  }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayDescription) }}
                />
                {shouldShowExpandButton && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium mt-2"
                  >
                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-xl font-medium">
                  {event.category}
                </span>
                {event.isRecurring && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-xl font-medium">
                    Recurring Event
                  </span>
                )}
                {event.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="flex flex-wrap md:flex-col gap-2">

              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full font-medium capitalize text-center text-sm">
                {event.status.toLowerCase()}
              </span>

              <Link
                to={`/edit-event/${event.id}`}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-md text-white px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 text-nowrap text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Event
              </Link>

            </div>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Sessions ({filteredInstances.length})
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
          {/* Search Input */}
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white py-2 text-sm"
              />
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex gap-2 items-center h-full">
            <input
              type="date"
              value={afterDate}
              onChange={(e) => setAfterDate(e.target.value)}
              className="p-2 border text-sm border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:indigo-orange-400 dark:focus:indigo-orange-400"
            />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-center">to</span>
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              className="p-2 border text-sm border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredInstances.length == 0 && <div className="p-16 text-sm text-center text-slate-500">No sessions match your search</div>}
          {filteredInstances.sort((a, b) => {
            const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
            const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
            return bDate - aDate; // Reverse order (newest first)
          }).map(instance => {
            const hasStartDate = instance.startDate && instance.startDate !== '';
            const isPast = hasStartDate ? new Date(instance.startDate) < new Date() : false;
            const isEnabled = instance.enabled !== false;

            const studentCount = instance.signups?.filter((s: any) => s.user?.role === 'STUDENT' && s.status === 'CONFIRMED').length || 0;
            const parentCount = instance.signups?.filter((s: any) => s.user?.role === 'PARENT' && s.status === 'CONFIRMED').length || 0;
            const totalCapacity = (instance.studentCapacity || 0) + (instance.parentCapacity || 0);
            const totalSignups = studentCount + parentCount;
            const fillPercentage = totalCapacity > 0 ? (totalSignups / totalCapacity) * 100 : 0;

            return (
              <div
                key={instance.id}
                onClick={() => navigate(`/sessions/${instance.id}`)}
                className={`group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${!isEnabled
                  ? 'bg-slate-100 dark:bg-slate-800 opacity-60'
                  : isPast
                    ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 opacity-80'
                    : 'bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-700 hover:from-orange-50 hover:to-orange-100 dark:hover:from-slate-700 dark:hover:to-slate-600'
                  }`}
              >
                {/* Status Bar */}
                <div className={`h-2 w-full ${!isEnabled
                  ? 'bg-red-400'
                  : isPast
                    ? 'bg-slate-400'
                    : 'bg-gradient-to-r from-green-400 to-green-500'
                  }`} />

                <div className="p-6">
                  {/* Header with Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <EventInstanceDisplay 
                        instance={instance} 
                        className="text-base font-medium text-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="ml-4">
                      {!isEnabled ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          Closed
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400">
                          Past
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Session Description */}
                  {instance.description && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                        "{instance.description}"
                      </p>
                    </div>
                  )}

                  {/* Capacity Information */}
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Capacity
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          {totalSignups}/{totalCapacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${fillPercentage >= 100 
                            ? 'bg-red-500' 
                            : fillPercentage >= 80 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            Students
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white">
                          {studentCount}<span className="text-sm font-normal text-slate-500">/{instance.studentCapacity || 0}</span>
                        </div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                            Parents
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white">
                          {parentCount}<span className="text-sm font-normal text-slate-500">/{instance.parentCapacity || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Click to view details & sign up
                      </span>
                      <ArrowLeft className="w-4 h-4 text-indigo-500 transform rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volunteer Statistics Table */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Volunteers ({volunteerData.length})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Award className="w-4 h-4" />
            <span>Total Hours: {volunteerData.reduce((sum, v) => sum + (v.hoursEarned || 0), 0)}</span>
          </div>
        </div>

        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={volunteerSearchTerm}
                onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={volunteerRoleFilter}
              onChange={(e) => setVolunteerRoleFilter(e.target.value)}
              className="px-3 py-2 border-2 border-orange-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-orange-400 dark:focus:border-orange-400"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Statistics Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-orange-200 dark:divide-slate-600">
                <thead className="dark:text-white">
                  <tr className="border-b-2 border-orange-200 dark:border-slate-600">
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        Volunteer
                        {volunteerSortBy === 'name' && (
                          volunteerSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        Role
                        {volunteerSortBy === 'role' && (
                          volunteerSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('sessions')}
                        className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        Sessions
                        {volunteerSortBy === 'sessions' && (
                          volunteerSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium">
                      <button
                        onClick={() => handleSort('hours')}
                        className="flex items-center gap-1 text-left hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        Hours
                        {volunteerSortBy === 'hours' && (
                          volunteerSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm font-medium hidden md:table-cell">Earliest Signup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 dark:divide-slate-700">
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No volunteers match your search criteria
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map((volunteer, index) => {
                      const user = volunteer.user;
                      if (!user) return null;

                      // Get earliest signup date
                      const earliestSignup = volunteer.sessions.length > 0
                        ? Math.min(...volunteer.sessions.map((s: any) => new Date(s.signupDate).getTime()))
                        : 0;

                      return (
                        <React.Fragment key={volunteer.userId}>
                                                  <tr
                          className="border-b border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Link className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors dark:text-white text-slate-800 truncate" to={`/profile/${user.id}`}>
                                    <span className="font-medium truncate">{user.name}</span>
                                  </Link>
                                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                              <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${user.role === 'STUDENT' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                                user.role === 'PARENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                                }`}>
                                {user.role.toLowerCase()}
                              </span>
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="font-bold text-orange-600 dark:text-orange-400 text-base sm:text-lg">
                                  {volunteer.totalSignups}
                                </span>
                                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  session{volunteer.totalSignups !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              <span className="font-medium text-slate-800 dark:text-white">
                                {volunteer.totalEventHours}
                              </span>
                            </td>
                            <td className="py-3 px-2 sm:px-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                              {earliestSignup > 0 ? format(new Date(earliestSignup), 'MMM d, yyyy') : 'N/A'}
                            </td>
                          </tr>


                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Event Info */}
      <div className="bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Event Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 dark:text-slate-300">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{format(new Date(event.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Sessions:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{event.instances.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Type:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${event.isRecurring ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                }`}>
                {event.isRecurring ? 'Recurring' : 'One-time'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Category:</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{event.category}</span>
            </div>
            <div className="flex justify-between text-right">
              <span className="font-medium">Chapters:</span>
              <span>{event.chapters.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Cities:</span>
              <span>{event.cities.join(', ')}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-slate-600">
          <div className="flex flex-wrap gap-2">
            {event.tags.map(tag => (
              <span key={tag} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}