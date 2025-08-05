import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Mail, Phone, Settings, MapPin, Award, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUsers, mockEvents, mockSignups } from '../data/mockData';
import { format } from 'date-fns';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  // If userId is provided, show that user's profile, otherwise show current user's profile
  const user = userId ? mockUsers.find(u => u.id === userId) : currentUser && mockUsers.find(u => u.id === currentUser.id);
  const isOwnProfile = !userId || userId === currentUser?.id;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">User not found</p>
      </div>
    );
  }

  // Get user's signups and events
  const userSignups = mockSignups.filter(signup => signup.userId === user.id);
  const upcomingEvents = userSignups
    .map(signup => {
      const event = mockEvents.find(e => e.id === signup.eventId);
      const instance = event?.instances.find(i => i.id === signup.instanceId);
      return { signup, event, instance };
    })
    .filter(item => item.event && item.instance && new Date(item.instance.startDate) > new Date())
    .sort((a, b) => new Date(a.instance!.startDate).getTime() - new Date(b.instance!.startDate).getTime());

  const pastEvents = userSignups
    .map(signup => {
      const event = mockEvents.find(e => e.id === signup.eventId);
      const instance = event?.instances.find(i => i.id === signup.instanceId);
      return { signup, event, instance };
    })
    .filter(item => item.event && item.instance && new Date(item.instance.startDate) <= new Date())
    .sort((a, b) => new Date(b.instance!.startDate).getTime() - new Date(a.instance!.startDate).getTime());

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Profile Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

          {/* Avatar + Details side-by-side even on mobile */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold transform hover:-rotate-3 hover:scale-105 shadow-lg transition-all duration-300 shrink-0">
              {user.name.charAt(0)}
            </div>

            {/* Info block */}
            <div className="flex flex-col justify-center">
              <h1 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 transform rotate-1">
                {user.name}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600 dark:text-slate-300 mb-2">
                <span className="capitalize bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-lg font-medium transform -rotate-1 inline-block w-fit">
                  {user.role}
                </span>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Joined {format(new Date(user.joinedDate), 'MMM yyyy')}</span>
                </div>
              </div>

              <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-1 gap-x-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4 shrink-0" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 shrink-0" />
                    {user.phone}
                  </div>
                )}
                {user.chapter && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building className="w-4 h-4 shrink-0" />
                    {user.chapter}
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {user.city}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          {isOwnProfile && (
            <div className="self-end md:self-start">
              <Link
                to="/settings"
                className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 transform hover:rotate-2 hover:scale-105 transition-all whitespace-nowrap"
              >
                <Settings className="w-4 h-4 shrink-0" />
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg transform hover:rotate-2 transition-all">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold">{user.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg transform hover:-rotate-2 transition-all">
          <div className="flex items-center gap-4">
            <Award className="w-8 h-8 text-green-200" />
            <div>
              <p className="text-green-100 text-sm font-medium">Events Completed</p>
              <p className="text-3xl font-bold">{pastEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl text-white shadow-lg transform hover:rotate-2 transition-all">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-purple-200" />
            <div>
              <p className="text-purple-100 text-sm font-medium">Upcoming Events</p>
              <p className="text-3xl font-bold">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 transform">
          Upcoming Events
        </h2>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map(({ signup, event, instance }) => (
              <div
                key={signup.id}
                className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl border-2 border-orange-200 dark:border-slate-500 transform hover:scale-102 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                      {event!.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 shrink-0" />
                        {format(new Date(instance!.startDate), 'MMM d, h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {instance!.location}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${signup.status === 'confirmed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}
                  >
                    {signup.status.slice(0, 1).toUpperCase() + signup.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 text-md p-6 text-center">
            No events found matching your criteria
          </p>
        )}
      </div>

      {/* Past Events */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 transform">
          Recent Activity
        </h2>
        {pastEvents.length > 0 ? (
          <div className="space-y-4">
            {pastEvents.slice(0, 5).map(({ signup, event, instance }) => (
              <div
                key={signup.id}
                className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-500 transform transition-all hover:scale-102 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-1">
                      {event!.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 shrink-0" />
                        {format(new Date(instance!.startDate), 'MMM d, yyyy')}
                        {signup.attendance && (
                          <span className={`ml-2 text-xs ${signup.attendance === 'present' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            ({signup.attendance})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {instance!.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {signup.hoursEarned && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-lg text-sm font-medium">
                        {signup.hoursEarned} hours
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 text-md p-6 text-center">
            No events found matching your criteria
          </p>
        )}
      </div>
    </div>
  );
}