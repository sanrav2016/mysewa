import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone, Calendar, Clock, Users, Award, GraduationCap, Handshake, MapPin, Building } from 'lucide-react';
import { mockUsers, mockSignups } from '../data/mockData';
import { format } from 'date-fns';

export default function Chapter() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [stickyControls, setStickyControls] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const controlsElement = document.getElementById("controls");
      if (controlsElement) {
        setStickyControls(window.scrollY > controlsElement.offsetHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredMembers = mockUsers.filter(member => {
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

  const totalMembers = mockUsers.length;
  const studentCount = mockUsers.filter(u => u.role === 'student').length;
  const parentCount = mockUsers.filter(u => u.role === 'parent').length;
  const adminCount = mockUsers.filter(u => u.role === 'admin').length;

  const chapters = Array.from(new Set(mockUsers.map(u => u.chapter).filter(Boolean)));
  const cities = Array.from(new Set(mockUsers.map(u => u.city).filter(Boolean)));
  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 transform">
          Chapter Members
        </h1>
        <p className="text-slate-600 dark:text-slate-300 transform">
          Connect with fellow volunteers in your chapter
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl text-white shadow-lg transform transition-all hover:rotate-2">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-200" />
            <div>
              <p className="text-blue-100 text-sm font-medium">Members</p>
              <p className="text-3xl font-bold">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-2xl text-white shadow-lg transform transition-all hover:-rotate-2">
          <div className="flex items-center gap-4">
            <GraduationCap className="w-8 h-8 text-green-200" />
            <div>
              <p className="text-green-100 text-sm font-medium">Students</p>
              <p className="text-3xl font-bold">{studentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl text-white shadow-lg transform transition-all hover:rotate-2">
          <div className="flex items-center gap-4">
            <Handshake className="w-8 h-8 text-purple-200" />
            <div>
              <p className="text-purple-100 text-sm font-medium">Parents</p>
              <p className="text-3xl font-bold">{parentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-2xl text-white shadow-lg transform transition-all hover:-rotate-2">
          <div className="flex items-center gap-4">
            <Award className="w-8 h-8 text-orange-200" />
            <div>
              <p className="text-orange-100 text-sm font-medium">Admins</p>
              <p className="text-3xl font-bold">{adminCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg transform border-4 border-orange-200 dark:border-slate-600 sticky top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b-4 -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6"}`}>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transform"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            {(['all', 'student', 'parent', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-2"} ${roleFilter === role
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg rotate-1'
                  : 'bg-orange-100 dark:bg-slate-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-slate-600'
                  }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}

            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className={`border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-2"}`}
            >
              <option value="all">All Chapters</option>
              {chapters.map(chapter => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className={`border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "px-3 py-2 text-sm" : "px-4 py-2"}`}
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
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 rounded-2xl shadow-lg text-center transform -rotate-1 border-4 border-orange-200 dark:border-slate-600">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              No members found matching your criteria
            </p>
          </div>
        ) : (
          filteredMembers.map((member, i) => {
            const memberSignups = mockSignups.filter(s => s.userId === member.id);
            const completedEvents = memberSignups.filter(s => s.status === 'confirmed').length;

            return (
              <Link
                key={member.id}
                to={`/profile/${member.id}`}
              >
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600 transform transition-all duration-200 hover:shadow-xl hover:scale-102 group break-inside-avoid mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold transform transition-all ${i % 2 == 0 ? "group-hover:-rotate-6" : "group-hover:rotate-6"} shadow-lg`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        {member.name}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize transform rotate-1 ${member.role === 'admin'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : member.role === 'parent'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </div>
                    )}
                    {member.chapter && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Building className="w-4 h-4" />
                        {member.chapter}
                      </div>
                    )}
                    {member.city && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <MapPin className="w-4 h-4" />
                        {member.city}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <Calendar className="w-4 h-4" />
                      Joined {format(new Date(member.joinedDate), 'MMM yyyy')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 p-3 rounded-xl text-center transform">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
          })
        )}
      </div>
    </div>
  );
}