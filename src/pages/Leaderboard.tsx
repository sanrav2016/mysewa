import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Clock,
  Calendar,
  Users,
  Search,
  Filter,
  Building,
  MapPin
} from 'lucide-react';
import { usersAPI, signupsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Types
type SortBy = 'hours' | 'events';
type FilterBy = 'all' | 'student' | 'parent' | 'admin';
type ViewType = 'individual' | 'chapter' | 'city';

export default function Leaderboard() {
  const [viewType, setViewType] = useState<ViewType>('individual');
  const [sortBy, setSortBy] = useState<SortBy>('hours');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [stickyControls, setStickyControls] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load users and signups data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, signupsData] = await Promise.all([
          usersAPI.getChapterMembers(),
          signupsAPI.getAll()
        ]);
        setUsers(usersData.users || []);
        setSignups(signupsData.signups || []);
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const chapters = useMemo(() => {
    const unique = new Set(users.map(u => u.chapter).filter(Boolean));
    return Array.from(unique) as string[];
  }, [users]);

  const cities = useMemo(() => {
    const unique = new Set(users.map(u => u.city).filter(Boolean));
    return Array.from(unique) as string[];
  }, [users]);

  const userStats = useMemo(() => {
    return users.map(user => {
      const userSignups = signups.filter(signup => signup.userId === user.id);
      const completedEvents = userSignups.filter(signup => signup.status === 'CONFIRMED').length;
      const totalHours = userSignups.reduce((sum, signup) => {
        // Only count hours for approved signups
        if (signup.status === 'CONFIRMED' && signup.approval === 'APPROVED') {
          return sum + (signup.hoursEarned || 0);
        }
        return sum;
      }, 0);

      return {
        ...user,
        completedEvents,
        calculatedHours: totalHours
      };
    });
  }, [users, signups]);

  const filteredUsers = useMemo(() => {
    return userStats
      .filter(user => {
        const matchesRole = filterBy === 'all' || user.role === filterBy.toUpperCase();
        const matchesChapter = chapterFilter === 'all' || user.chapter === chapterFilter;
        const matchesCity = cityFilter === 'all' || user.city === cityFilter;
        const matchesSearch =
          search === '' ||
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.chapter && user.chapter.toLowerCase().includes(search.toLowerCase())) ||
          (user.city && user.city.toLowerCase().includes(search.toLowerCase()));
        return matchesRole && matchesChapter && matchesCity && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'hours') return b.calculatedHours - a.calculatedHours;
        return b.completedEvents - a.completedEvents;
      });
  }, [userStats, filterBy, chapterFilter, cityFilter, search, sortBy]);

  const locationStats = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredUsers.slice(0, 10).forEach(user => {
      const key = viewType === 'chapter' ? user.chapter : user.city;
      if (!key) return;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          memberCount: 0,
          totalHours: 0,
          totalEvents: 0
        };
      }
      groups[key].memberCount++;
      groups[key].totalHours += user.calculatedHours;
      groups[key].totalEvents += user.completedEvents;
    });

    return Object.values(groups).map(loc => ({
      ...loc,
      avgHours: Math.round(loc.totalHours / loc.memberCount)
    })).sort((a, b) => {
      return sortBy === 'hours' ? b.totalHours - a.totalHours : b.totalEvents - a.totalEvents;
    });
  }, [filteredUsers, viewType, sortBy]);

  const displayData = viewType === 'individual' ? filteredUsers : locationStats;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-600 to-amber-800';
      default:
        return 'from-orange-400 to-red-500';
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          See who's making the biggest impact in our community
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-yellow-100 text-xs font-medium">Top {
                viewType == 'individual' ? 'Volunteer' :
                  viewType == 'chapter' ? 'Chapter' :
                    'City'
              }</p>
              <p className="text-xl font-semibold">
                {viewType === 'individual'
                  ? (filteredUsers[0]?.name || 'N/A')
                  : (locationStats[0]?.name || 'N/A')
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Hours</p>
              <p className="text-2xl font-semibold">
                {viewType === 'individual'
                  ? filteredUsers.reduce((sum, user) => sum + user.calculatedHours, 0)
                  : locationStats.reduce((sum, loc) => sum + loc.totalHours, 0)
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">
                Active {viewType === 'individual' ? 'Volunteers' : viewType === 'chapter' ? 'Chapters' : 'Cities'}
              </p>
              <p className="text-2xl font-semibold">{displayData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 transition-all ${stickyControls ? "border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6 rounded-xl"}`}>
        <div className="flex gap-3 flex-wrap">
          {/* View Type Selector */}
          <div className="flex gap-2 flex-wrap">
            {(['individual', 'chapter', 'city'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`rounded-lg font-medium transition-colors capitalize px-3 py-2 text-sm ${viewType === type
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                  : 'bg-indigo-100 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-slate-600'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto max-w-full flex gap-3">

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white p-2 text-sm`}
            >
              <option value="hours">Sort by Hours</option>
              <option value="events">Sort by Events</option>
            </select>

            {viewType === 'individual' && (
              <>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                  className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white p-2 text-sm`}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white p-2 text-sm`}
                >
                  <option value="all">All Chapters</option>
                  {chapters.map(chapter => (
                    <option key={chapter} value={chapter}>{chapter}</option>
                  ))}
                </select>

                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white p-2 text-sm`}
                >
                  <option value="all">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                No {viewType}s found matching your criteria
              </p>
            </div>
          ) : (
            displayData.map((item, index) => {
              const rank = index + 1;

              if (viewType === 'individual') {
                const user = item as any;
                return (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="block"
                  >
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border-2 transition-all hover:scale-102 group backdrop-blur-md bg-opacity-60 overflow-hidden
    ${rank === 1
                          ? 'bg-yellow-100/60 dark:bg-yellow-300/10 border-yellow-500 shadow-[0_4px_30px_rgba(255,215,0,0.4)]'
                          : rank === 2
                            ? 'bg-gray-200/60 dark:bg-gray-400/10 border-gray-400 shadow-[0_4px_30px_rgba(192,192,192,0.3)]'
                            : rank === 3
                              ? 'bg-orange-200/60 dark:bg-amber-300/10 border-amber-700 shadow-[0_4px_30px_rgba(205,127,50,0.25)]'
                              : 'border-orange-200 dark:border-slate-500 hover:bg-orange-50 dark:hover:bg-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {
                          rank <= 3 ?
                            <div className="w-6 h-6 relative">
                              {/* Trophy Icon - smaller and centered */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                {
                                  rank == 1 ?
                                    <Trophy className="-rotate-12 w-20 h-20  ml-2 shrink-0 opacity-15 text-yellow-700 dark:text-yellow-300" /> :
                                    rank == 2 ?
                                      <Award className="rotate-12 w-16 h-16 ml-1 shrink-0 opacity-10 text-black dark:text-white" /> :
                                      <Award className="-rotate-12 w-12 h-12 shrink-0 opacity-10 text-black dark:text-white" />
                                }
                              </div>

                              {/* Large stylized rank number */}
                              <div className="absolute inset-0 left-[-10px] flex items-center justify-center pointer-events-none w-10">
                                <div
                                  className={`w-full font-extrabold italic text-transparent bg-clip-text text-center select-none leading-none drop-shadow-[1px_1px_0px_rgba(58,0,56,1)]
                                ${rank === 1
                                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-4xl'
                                      : rank === 2
                                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-4xl'
                                        : rank === 3
                                          ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-4xl'
                                          : ''
                                    }`}
                                >
                                  {rank}
                                </div>
                              </div>
                            </div>
                            :
                            <span className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">{rank}</span>
                        }
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-xl flex items-center justify-center text-white font-bold transform transition-all group-hover:rotate-6`}>
                          {user.name.charAt(0)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                            {user.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg inline-block text-sm font-medium w-auto capitalize ${user.role === 'ADMIN'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : user.role === 'PARENT'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}>
                            {user.role.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-300">
                          <span className="truncate">{user.email}</span>
                          {user.chapter && (
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                              {user.chapter}
                            </span>
                          )}
                          {user.city && (
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                              {user.city}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex justify-center sm:items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-xl sm:text-2xl font-bold">{user.calculatedHours}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">hours</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xl sm:text-2xl font-bold">{user.completedEvents}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">events</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              } else {
                const location = item as any;
                return (
                  <div
                    key={location.name}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border-2  border-orange-200 dark:border-slate-500 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all hover:scale-102 group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {getRankIcon(rank)}
                      <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-xl flex items-center justify-center text-white font-bold transform transition-all group-hover:rotate-6`}>
                        {viewType === 'chapter' ? <Building className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">
                        {location.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                          {location.memberCount} members
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                          {location.avgHours} hours on average
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xl sm:text-2xl font-bold">{location.totalHours}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">hours</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xl sm:text-2xl font-bold">{location.totalEvents}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
