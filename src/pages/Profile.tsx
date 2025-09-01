import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Mail, Phone, Settings, MapPin, Award, Building, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, eventsAPI, signupsAPI } from '../services/api';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import EventInstanceDisplay from '../components/EventInstanceDisplay';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const targetUserId = userId || currentUser?.id;

        if (!targetUserId) return;

        const [userData, signupsData] = await Promise.all([
          usersAPI.getById(targetUserId),
          signupsAPI.getAll({ userId: targetUserId })
        ]);

        setUser(userData.user);

        // Get events for the signups
        const signups = signupsData.signups || [];
        const eventIds = [...new Set(signups.map((s: any) => s.eventId))] as string[];
        const eventsData = await Promise.all(
          eventIds.map((id: string) => eventsAPI.getById(id))
        );
        const events = eventsData.map((response: any) => response.event);

        // Process signups with events
        const processedSignups = signups.map((signup: any) => {
          const event = events.find((e: any) => e.id === signup.eventId);
          const instance = event?.instances.find((i: any) => i.id === signup.instanceId);
          return { signup, event, instance };
        }).filter((item: any) => item.event && item.instance);

        const now = new Date();
        const upcoming = processedSignups
          .filter((item: any) => {
            const startDate = item.instance!.startDate;
            return startDate && new Date(startDate) > now && item.instance!.enabled !== false;
          })
          .sort((a: any, b: any) => {
            const aDate = a.instance!.startDate ? new Date(a.instance!.startDate).getTime() : 0;
            const bDate = b.instance!.startDate ? new Date(b.instance!.startDate).getTime() : 0;
            return aDate - bDate;
          });

        const past = processedSignups
          .filter((item: any) => {
            const startDate = item.instance!.startDate;
            return startDate && new Date(startDate) <= now;
          })
          .sort((a: any, b: any) => {
            const aDate = a.instance!.startDate ? new Date(a.instance!.startDate).getTime() : 0;
            const bDate = b.instance!.startDate ? new Date(b.instance!.startDate).getTime() : 0;
            return bDate - aDate;
          });

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="text-center flex w-full h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-300">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Profile Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          {/* Avatar + Details side-by-side even on mobile */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl font-semibold hover:scale-105 shadow-lg transition-all duration-300 shrink-0">
              {user.name.charAt(0)}
            </div>

            {/* Info block */}
            <div className="flex flex-col justify-center">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                {user.name}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600 dark:text-slate-300 mb-2">
                <span className="capitalize bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs font-medium inline-block w-fit">
                  {user.role.toLowerCase()}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>Joined {format(new Date(user.joinedDate), 'MMM yyyy')}</span>
                </div>
              </div>

              <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-1 gap-x-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-3 h-3 shrink-0" />
                    {user.phone}
                  </div>
                )}
                {user.chapter && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building className="w-3 h-3 shrink-0" />
                    {user.chapter}
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {user.city}
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Hours</p>
              <p className="text-2xl font-semibold">{user.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">Events Completed</p>
              <p className="text-2xl font-semibold">{pastEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-xs font-medium">Upcoming Events</p>
              <p className="text-2xl font-semibold">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">
          Upcoming Events
        </h2>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.slice(0, 2).map(({ signup, event, instance }) => (
              <div
                key={signup.id}
                className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-white mb-1 text-sm">
                      {event!.title}
                    </h3>
                    <EventInstanceDisplay instance={instance!} />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${signup.status === 'CONFIRMED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : signup.status === "WAITLIST" ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : signup.status === "WAITLIST_PENDING" ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' }`}
                  >
                    {signup.status === "WAITLIST_PENDING" ? "Pending Response" : signup.status.toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 text-sm p-6 text-center">
            No upcoming events
          </p>
        )}
      </div>

      {/* Past Events */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">
            Recent Activity
          </h2>
          {
            isOwnProfile &&
            <Link
              to="/activity"
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:scale-105 transition-all duration-200 whitespace-nowrap text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          }
        </div>
        {pastEvents.length > 0 ? (
          <div className="space-y-4">
            {pastEvents.slice(0, 2).map(({ signup, event, instance }) => (
              <Link
                to={`/sessions/${instance!.id}`}
                key={signup.id}
                className="block bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex flex-col md:flex-row items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-white mb-1 text-sm">
                      {event!.title}
                    </h3>
                    <div className="flex flex-col md:flex-row items-start gap-0 md:gap-4 md:items-center text-sm text-slate-600 dark:text-slate-300">
                      <EventInstanceDisplay instance={instance!} showTime={false} />
                      {signup.approval && (
                        <div className="flex items-center gap-1 ml-2">
                          {signup.approval === 'APPROVED' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Approved</span>
                            </>
                          ) : signup.approval === 'DENIED' ? (
                            <>
                              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Denied</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {signup.approval === 'NOT_MARKED' ? 'Not Marked' : signup.approval}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 text-sm p-6 text-center">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}