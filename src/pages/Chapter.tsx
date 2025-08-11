import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone, Calendar, Clock, Users, Award, GraduationCap, Handshake, MapPin, Building } from 'lucide-react';
import { usersAPI, signupsAPI } from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Chapter() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [stickyControls, setStickyControls] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

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
  }, [offset, hasMore, loadingMore, search, roleFilter, chapterFilter, cityFilter]);

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
        console.error('Failed to load chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setOffset(prev => prev + 10);
      setLoadingMore(false);
      setHasMore(offset + 20 < filteredMembers.length);
    }, 500);
  };

  const filteredMembers = users.filter(member => {
    const matchesSearch = search === '' ||
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      (member.chapter && member.chapter.toLowerCase().includes(search.toLowerCase())) ||
      (member.city && member.city.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesChapter = chapterFilter === 'all' || member.chapter === chapterFilter;
    const matchesCity = cityFilter === 'all' || member.city === cityFilter;
    return matchesSearch && matchesRole && matchesChapter && matchesCity;
  });

  const displayedMembers = filteredMembers.slice(0, offset + 10);
  const hasMoreMembers = offset + 10 < filteredMembers.length;

  const totalMembers = users.length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;
  const parentCount = users.filter(u => u.role === 'PARENT').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  const chapters = Array.from(new Set(users.map(u => u.chapter).filter(Boolean)));
  const cities = Array.from(new Set(users.map(u => u.city).filter(Boolean)));
  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Chapter Members
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Connect with fellow volunteers in your chapter
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Members</p>
              <p className="text-2xl font-semibold">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-xs font-medium">Students</p>
              <p className="text-2xl font-semibold">{studentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-xs font-medium">Parents</p>
              <p className="text-2xl font-semibold">{parentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-lg text-white shadow-lg hover:scale-105 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-indigo-100 text-xs font-medium">Admins</p>
              <p className="text-2xl font-semibold">{adminCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6"}`}>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2 text-sm" : "py-2 text-sm"}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            {(['all', 'student', 'parent', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-lg font-medium transition-all hover:scale-105 px-3 py-2 text-sm ${roleFilter === role
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                  : 'bg-indigo-100 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-slate-600'
                  }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}

            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-2"}`}
            >
              <option value="all">All Chapters</option>
              {chapters.map(chapter => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className={`border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-2"}`}
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-12 rounded-xl shadow-lg text-center border border-slate-200 dark:border-slate-700/50">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="col-span-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-12 rounded-xl shadow-lg text-center border border-slate-200 dark:border-slate-700/50">
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            No members found matching your criteria
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6"> 
          {displayedMembers.map((member, i) => {
            const memberSignups = signups.filter(s => s.userId === member.id);
            const completedEvents = memberSignups.filter(s => s.status === 'CONFIRMED').length;

            return (
              <Link
                key={member.id}
                to={`/profile/${member.id}`}
              >
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700/50 transition-all hover:shadow-xl hover:scale-[1.02] group break-inside-avoid mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold transform transition-all ${i % 2 == 0 ? "group-hover:-rotate-6" : "group-hover:rotate-6"} shadow-lg`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        {member.name}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize transform rotate-1 ${member.role === 'ADMIN'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : member.role === 'PARENT'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                        {member.role.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                    {member.city && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <MapPin className="w-4 h-4" />
                        {member.city}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <Calendar className="w-4 h-4" />
                                                  Joined {formatLocalDate(member.createdAt, 'MMM yyyy')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{member.totalHours}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Hours</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 p-3 rounded-xl text-center transform">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{completedEvents}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Events</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}