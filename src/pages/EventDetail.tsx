import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, Tag, Search, Edit, Filter, SortAsc, SortDesc, User, Users2, Award } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { mockEvents, mockSignups, mockUsers } from '../data/mockData';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const event = mockEvents.find(e => e.id === eventId);
  const userSignups = mockSignups.filter(signup => signup.userId === user?.id && signup.eventId === event?.id);

  const handleSignup = (instanceId: string) => {
    alert(`Signed up for event instance ${instanceId}!`);
  };

  const isSignedUp = (instanceId: string) => userSignups.some(signup => signup.instanceId === instanceId);

  const canSignUp = (instance: any) => {
    if (isSignedUp(instance.id)) return false;
    const userRole = user?.role;
    if (userRole === 'student') {
      return instance.studentSignups.length < instance.studentCapacity;
    } else if (userRole === 'parent') {
      return instance.parentSignups.length < instance.parentCapacity;
    }
    return false;
  };

  // Get all confirmed volunteers for this event with aggregated session data
  const getAllEventVolunteers = () => {
    if (!event) return [];

    const allSignups = mockSignups.filter(signup => signup.eventId === event.id && signup.status === 'confirmed');

    // Group signups by user
    const volunteerMap = new Map();

    allSignups.forEach(signup => {
      const user = mockUsers.find(u => u.id === signup.userId);
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
        sessionDate: instance ? new Date(instance.startDate) : null,
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

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">Event not found</p>
        <Link to="/events" className="text-orange-600 dark:text-orange-400 hover:underline">
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
      const date = new Date(instance.startDate);
      const afterMatch = afterDate ? isAfter(date, new Date(afterDate)) : true;
      const beforeMatch = beforeDate ? isBefore(date, new Date(beforeDate)) : true;
      return textMatch && afterMatch && beforeMatch;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <Link to="/events" className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transform hover:scale-105 transition-all duration-200">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {event.title.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">{event.title}</h1>
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
          {user?.role === 'admin' && (
            <Link
              to={`/edit-event/${event.id}`}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors border-2 border-dashed border-blue-400 text-nowrap"
            >
              <Edit className="w-4 h-4" />
              Edit Event
            </Link>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
          Available Sessions ({filteredInstances.length})
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white py-2`}
              />
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="date"
              value={afterDate}
              onChange={(e) => setAfterDate(e.target.value)}
              className="px-3 py-2 border-2 border-orange-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-orange-400 dark:focus:border-orange-400"
            />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-center">to</span>
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              className="px-3 py-2 border-2 border-orange-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-orange-400 dark:focus:border-orange-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredInstances.length == 0 && <div className="p-4 text-center text-slate-500">No sessions match your search</div>}
          {filteredInstances.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(instance => {
            const isPast = new Date(instance.startDate) < new Date();

            return (
              <div
                key={instance.id}
                onClick={() => navigate(`/sessions/${instance.id}`)}
                className={`hover:scale-102 cursor-pointer p-6 rounded-2xl border-4 border-dashed shadow-lg transition-all duration-200 ${isPast
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 opacity-60'
                  : 'bg-orange-50 dark:bg-slate-700 border-orange-200 dark:border-slate-500 hover:bg-orange-100 dark:hover:bg-slate-600'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-5 h-5" />
                          <span>{format(new Date(instance.startDate), 'EEEE, MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Clock className="w-5 h-5" />
                          <span>
                            {format(new Date(instance.startDate), 'h:mm a')} - {format(new Date(instance.endDate), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-5 h-5" />
                          <span>{instance.location}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Users className="w-5 h-5" />
                          <span>Students: {instance.studentSignups.length}/{instance.studentCapacity}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Users className="w-5 h-5" />
                          <span>Parents: {instance.parentSignups.length}/{instance.parentCapacity}</span>
                        </div>
                        {instance.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {instance.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <div className="text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                        Click to view details
                      </div>
                      {isPast ? (
                        <span className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg text-sm font-medium">
                          Past
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-lg text-sm font-medium">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volunteer Statistics Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Volunteers ({volunteerData.length})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Award className="w-4 h-4" />
            <span>Total Hours: {volunteerData.reduce((sum, v) => sum + (v.hoursEarned || 0), 0)}</span>
          </div>
        </div>

        {/* Table Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={volunteerSearchTerm}
                onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
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
          <table className="w-full">
            <thead className="dark:text-white">
              <tr className="border-b-2 border-orange-200 dark:border-slate-600">
                <th className="text-left py-3 px-4">
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
                <th className="text-left py-3 px-4">
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
                <th className="text-left py-3 px-4">
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
                <th className="text-left py-3 px-4">
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
                <th className="text-left py-3 px-4">Earliest Signup</th>
              </tr>
            </thead>
            <tbody>
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
                        className="border-b border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedVolunteerId(expandedVolunteerId === volunteer.userId ? null : volunteer.userId)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <Link className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors dark:text-white text-slate-800" to={`/profile/${user.id}`}>
                                <div className="font-medium">{user.name}</div>
                              </Link>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'student' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                            user.role === 'parent' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                              'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                            }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                              {volunteer.totalSignups}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              session{volunteer.totalSignups !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 dark:text-white">
                            {volunteer.totalEventHours}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                          {earliestSignup > 0 ? format(new Date(earliestSignup), 'MMM d, yyyy') : 'N/A'}
                        </td>
                      </tr>

                      {/* Expandable Sessions Row */}
                      {expandedVolunteerId === volunteer.userId && (
                        <tr className="bg-orange-50 dark:bg-slate-700/30">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-orange-200 dark:border-slate-600 p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <Users2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                <h4 className="font-bold text-slate-800 dark:text-white">
                                  {user.name}'s Sessions ({volunteer.sessions.length})
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {volunteer.sessions.map((session: any) => (
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
                                      </div>
                                      <div className="text-right ml-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                          Confirmed
                                        </span>
                                        {session.hoursEarned && (
                                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                            {session.hoursEarned}h
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Info & Participation - Restyled */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details - Enhanced */}
        <div className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
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
              <div className="flex justify-between">
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
            <div className="text-slate-600 dark:text-slate-300 font-medium mb-2">Tags:</div>
            <div className="flex flex-wrap gap-2">
              {event.tags.map(tag => (
                <span key={tag} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Your Participation */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl shadow-lg border-4 border-green-200 dark:border-slate-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Participation</h3>
          </div>
          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="font-medium">Sessions Signed Up:</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-lg">{userSignups.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Hours Earned:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                {userSignups.reduce((sum, signup) => sum + (signup.hoursEarned || 0), 0)}
              </span>
            </div>
            {userSignups.length > 0 && (
              <div className="pt-4 border-t border-green-200 dark:border-slate-600">
                <div className="font-medium mb-3">Your Sessions:</div>
                <div className="space-y-2">
                  {userSignups.map(signup => {
                    const instance = event.instances.find(i => i.id === signup.instanceId);
                    return instance ? (
                      <Link to={`/sessions/${instance.id}`} key={signup.id} className="bg-white/50 dark:bg-slate-700/50 p-3 rounded-lg border border-green-200 dark:border-slate-600 block hover:bg-green-50 dark:hover:bg-slate-600/50 transition-colors">
                        <div className="text-sm font-medium text-slate-800 dark:text-white">
                          {format(new Date(instance.startDate), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {instance.location}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${signup.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                            signup.status === 'waitlist' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}>
                            {signup.status.charAt(0).toUpperCase() + signup.status.slice(1)}
                          </span>
                          {signup.hoursEarned && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {signup.hoursEarned}h
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}