import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Award, Clock, Calendar, Users, Search, Filter } from 'lucide-react';
import { mockUsers, mockSignups } from '../data/mockData';

type SortBy = 'hours' | 'events';
type FilterBy = 'all' | 'student' | 'parent' | 'admin';

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortBy>('hours');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [search, setSearch] = useState('');

  // Calculate user stats
  const userStats = mockUsers.map(user => {
    const userSignups = mockSignups.filter(signup => signup.userId === user.id);
    const completedEvents = userSignups.filter(signup => signup.status === 'confirmed').length;
    const totalHours = userSignups.reduce((sum, signup) => sum + (signup.hoursEarned || 0), 0);

    return {
      ...user,
      completedEvents,
      calculatedHours: totalHours
    };
  });

  // Filter and sort users
  const filteredUsers = userStats
    .filter(user => {
      const matchesRole = filterBy === 'all' || user.role === filterBy;
      const matchesSearch = search === '' ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.chapter && user.chapter.toLowerCase().includes(search.toLowerCase())) ||
        (user.city && user.city.toLowerCase().includes(search.toLowerCase()));
      return matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'hours') {
        return b.calculatedHours - a.calculatedHours;
      } else {
        return b.completedEvents - a.completedEvents;
      }
    });

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
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-orange-400 to-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          See who's making the biggest impact in our community
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-yellow-200" />
            <div>
              <p className="text-yellow-100 text-sm font-medium">Top Volunteer</p>
              <p className="text-xl font-bold">{filteredUsers[0]?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold">
                {filteredUsers.reduce((sum, user) => sum + user.calculatedHours, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-green-200" />
            <div>
              <p className="text-green-100 text-sm font-medium">Active Volunteers</p>
              <p className="text-3xl font-bold">{filteredUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
            >
              <option value="hours">Sort by Hours</option>
              <option value="events">Sort by Events</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="px-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                No volunteers found matching your criteria
              </p>
            </div>
          ) : (
            filteredUsers.map((user, index) => {
              const rank = index + 1;
              return (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500 hover:bg-orange-50 dark:hover:bg-slate-700 transition-all hover:scale-102 group">
                    <div className="flex items-center gap-4">
                      {getRankIcon(rank)}
                      <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-xl flex items-center justify-center text-white font-bold transform transition-all group-hover:rotate-6`}>
                        {user.name.charAt(0)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                          {user.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                          user.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : user.role === 'parent'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <span>{user.email}</span>
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
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-2xl font-bold">{user.calculatedHours}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">hours</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-2xl font-bold">{user.completedEvents}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}