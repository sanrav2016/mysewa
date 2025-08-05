import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, Tag, Search, Edit } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { mockEvents, mockSignups } from '../data/mockData';
import { format, isAfter, isBefore } from 'date-fns';

export default function EventDetail() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600 sticky top-0 z-50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
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
      </div>

      {/* Sessions List */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
          Available Sessions ({filteredInstances.length})
        </h2>

        <div className="space-y-4">
          {filteredInstances.map(instance => {
            const isPast = new Date(instance.startDate) < new Date();

            return (
              <div
                key={instance.id}
                onClick={() => navigate(`/sessions/${instance.id}`)}
                className={`cursor-pointer p-6 rounded-2xl border-4 border-dashed shadow-lg transition-colors duration-200 ${isPast
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

      {/* Event Info & Participation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Event Details</h3>
          <div className="space-y-3 text-slate-600 dark:text-slate-300">
            <p><strong>Created:</strong> {format(new Date(event.createdAt), 'MMM d, yyyy')}</p>
            <p><strong>Total Sessions:</strong> {event.instances.length}</p>
            <p><strong>Type:</strong> {event.isRecurring ? 'Recurring' : 'One-time'}</p>
            <div>
              <strong>Tags:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {event.tags.map(tag => (
                  <span key={tag} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Your Participation</h3>
          <div className="space-y-3 text-slate-600 dark:text-slate-300">
            <p><strong>Sessions Signed Up:</strong> {userSignups.length}</p>
            <p><strong>Hours Earned:</strong> {userSignups.reduce((sum, signup) => sum + (signup.hoursEarned || 0), 0)}</p>
            {userSignups.length > 0 && (
              <div>
                <strong>Your Sessions:</strong>
                <div className="mt-2 space-y-1">
                  {userSignups.map(signup => {
                    const instance = event.instances.find(i => i.id === signup.instanceId);
                    return instance ? (
                      <div key={signup.id} className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        {format(new Date(instance.startDate), 'MMM d, yyyy h:mm a')} - {signup.status}
                      </div>
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