import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Plus, Edit, Trash2, Search, Filter, UserPlus, Building, MapPin, Mail, Phone, ChevronDown, Upload, FileText, Download, SortAsc, SortDesc } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { mockUsers, mockEvents, chapters, cities } from '../data/mockData';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'users' | 'events'>('users');
  const [stickyControls, setStickyControls] = useState(false);

  // User filters and sorting
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');

  // Event filters and sorting
  const [eventSearch, setEventSearch] = useState('');
  const [eventSortBy, setEventSortBy] = useState('title');
  const [eventSortOrder, setEventSortOrder] = useState<'asc' | 'desc'>('asc');

  // Add user dropdown
  const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
  const [addUserMethod, setAddUserMethod] = useState<'manual' | 'csv' | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as 'student' | 'parent' | 'admin',
    phone: '',
    chapter: '',
    city: '',
    emergencyContact: ''
  });

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

  // Filter and sort users
  const filteredUsers = mockUsers
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (userSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'location':
          comparison = (a.chapter || '').localeCompare(b.chapter || '');
          break;
        case 'hours':
          comparison = a.totalHours - b.totalHours;
          break;
        case 'joinedDate':
          comparison = new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
          break;
        default:
          comparison = 0;
      }

      return userSortOrder === 'asc' ? comparison : -comparison;
    });

  // Filter and sort events
  const filteredEvents = mockEvents
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        event.category.toLowerCase().includes(eventSearch.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (eventSortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'sessions':
          comparison = a.instances.length - b.instances.length;
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return eventSortOrder === 'asc' ? comparison : -comparison;
    });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      addNotification('error', 'Error', 'Please fill in required fields');
      return;
    }

    console.log('Adding new user:', newUser);
    addNotification('success', 'Success!', 'User added successfully!');
    setNewUser({
      name: '',
      email: '',
      role: 'student',
      phone: '',
      chapter: '',
      city: '',
      emergencyContact: ''
    });
    setAddUserMethod(null);
    setShowAddUserDropdown(false);
  };

  const handleCSVImport = () => {
    console.log('CSV import functionality would be implemented here');
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user:', userId);
      addNotification('success', 'Success!', 'User deleted successfully!');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      console.log('Deleting event:', eventId);
      addNotification('success', 'Success!', 'Event deleted successfully!');
    }
  };

  // Sorting functions
  const handleUserSort = (field: string) => {
    if (userSortBy === field) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortBy(field);
      setUserSortOrder('asc');
    }
  };

  const handleEventSort = (field: string) => {
    if (eventSortBy === field) {
      setEventSortOrder(eventSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setEventSortBy(field);
      setEventSortOrder('asc');
    }
  };

  // Function to gather all input data for server processing
  const gatherUserData = () => {
    return {
      method: addUserMethod,
      manualData: addUserMethod === 'manual' ? newUser : null,
      csvData: addUserMethod === 'csv' ? 'CSV file data would be processed here' : null
    };
  };

  return (
    <div className="space-y-6 p-4 lg:p-8" onClick={() => setShowAddUserDropdown(false)}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage users and events across all chapters
        </p>
      </div>

      {/* Sticky Controls Section */}
      <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg transform border-orange-200 dark:border-slate-600 sticky w-full top-0 z-50 transition-all ${stickyControls ? "rounded-none border-0 border-b-4 -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "border-4 p-6"}`}>
        {/* Tab Navigation */}
        <div className={`flex gap-4 ${stickyControls ? "mb-3" : "mb-6"}`}>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border-2 border-dashed whitespace-nowrap ${stickyControls ? "px-3 py-2 text-sm" : "px-6 py-3"} ${activeTab === 'users'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
              }`}
          >
            <Users className="w-5 h-5" />
            Users ({mockUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap border-2 border-dashed ${stickyControls ? "px-3 py-2 text-sm" : "px-6 py-3"} ${activeTab === 'events'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
              }`}
          >
            <Calendar className="w-5 h-5" />
            Events ({mockEvents.length})
          </button>
        </div>

        {/* Users Tab Filters */}
        {activeTab === 'users' && (
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2 text-sm" : "py-3 text-base"}`}
                />
              </div>
            </div>

            {/* Add User Button + Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddUserDropdown(!showAddUserDropdown);
                }}
                className={`flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white border-2 border-dashed border-green-400 rounded-xl font-medium transition-colors whitespace-nowrap ${stickyControls ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"}`}
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden md:block">Add User</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showAddUserDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-600 rounded-xl shadow-xl p-4 min-w-64 z-50">
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setAddUserMethod('manual');
                        setShowAddUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <UserPlus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="font-medium text-slate-800 dark:text-white">Add Manually</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Enter user details one by one</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setAddUserMethod('csv');
                        setShowAddUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="font-medium text-slate-800 dark:text-white">Import from CSV</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Upload a CSV file with user data</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab Filters */}
        {activeTab === 'events' && (
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white ${stickyControls ? "py-2 text-sm" : "py-3 text-base"}`}
                />
              </div>
            </div>

            {/* Create Event Button */}
            <Link
              to="/create-event"
              className={`flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white border-2 border-dashed border-green-400 rounded-xl font-medium transition-colors whitespace-nowrap ${stickyControls ? "px-4 py-2 text-sm" : "px-6 py-3 text-base"}`}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:block">Create Event</span>
            </Link>
          </div>
        )}

      </div>

      {/* Content Section */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Add User Forms */}
            {addUserMethod === 'manual' && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 p-4 sm:p-6 rounded-xl border-2 border-dashed border-green-200 dark:border-slate-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New User Manually</h3>
                  <button
                    onClick={() => setAddUserMethod(null)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  />
                  <select
                    value={newUser.chapter}
                    onChange={(e) => setNewUser({ ...newUser, chapter: e.target.value })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(chapter => (
                      <option key={chapter} value={chapter}>{chapter}</option>
                    ))}
                  </select>
                  <select
                    value={newUser.city}
                    onChange={(e) => setNewUser({ ...newUser, city: e.target.value })}
                    className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {newUser.role === 'parent' && (
                    <input
                      type="tel"
                      placeholder="Emergency Contact"
                      value={newUser.emergencyContact}
                      onChange={(e) => setNewUser({ ...newUser, emergencyContact: e.target.value })}
                      className="px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                    />
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setAddUserMethod(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors border-2 border-dashed border-green-400"
                  >
                    Add User
                  </button>
                </div>
              </div>
            )}

            {addUserMethod === 'csv' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 p-4 sm:p-6 rounded-xl border-2 border-dashed border-blue-200 dark:border-slate-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Import Users from CSV</h3>
                  <button
                    onClick={() => setAddUserMethod(null)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-slate-600">
                    <h4 className="font-medium text-slate-800 dark:text-white mb-2">CSV Import Guidelines</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p><strong>Required columns:</strong> name, email, role</p>
                      <p><strong>Optional columns:</strong> phone, chapter, city, emergencyContact</p>
                      <p><strong>Role values:</strong> student, parent, admin</p>
                      <p><strong>File format:</strong> CSV with headers in first row</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <Upload className="w-4 h-4" />
                      Choose CSV File
                    </button>
                    <a href="#" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      <Download className="w-4 h-4" />
                      Download Template
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setAddUserMethod(null)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCSVImport}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Import Users
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-orange-200 dark:divide-slate-600">
                    <thead>
                      <tr className="border-b-2 border-dashed border-orange-200 dark:border-slate-600">
                        <th className="text-left py-3 px-2 sm:px-4">
                          <button
                            onClick={() => handleUserSort('name')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            User
                            {userSortBy === 'name' && (
                              userSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <button
                            onClick={() => handleUserSort('role')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Role
                            {userSortBy === 'role' && (
                              userSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell">
                          <button
                            onClick={() => handleUserSort('location')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Location
                            {userSortBy === 'location' && (
                              userSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell font-semibold text-slate-800 dark:text-white">Contact</th>
                        <th className="text-left py-3 px-2 sm:px-4">
                          <button
                            onClick={() => handleUserSort('hours')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Hours
                            {userSortBy === 'hours' && (
                              userSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-800 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100 dark:divide-slate-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-dashed border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50">
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {user.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/profile/${user.id}`}
                                  className="font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate"
                                >
                                  {user.name}
                                </Link>
                                <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${user.role === 'admin'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : user.role === 'parent'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              {user.chapter && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Building className="w-3 h-3" />
                                  {user.chapter}
                                </div>
                              )}
                              {user.city && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {user.city}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              {user.phone && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {user.totalHours}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/profile/${user.id}`}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View Profile"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Events Table */}
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-orange-200 dark:divide-slate-600">
                    <thead>
                      <tr className="border-b-2 border-dashed border-orange-200 dark:border-slate-600">
                        <th className="text-left py-3 px-2 sm:px-4">
                          <button
                            onClick={() => handleEventSort('title')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Event
                            {eventSortBy === 'title' && (
                              eventSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <button
                            onClick={() => handleEventSort('category')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Category
                            {eventSortBy === 'category' && (
                              eventSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell">
                          <button
                            onClick={() => handleEventSort('status')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Status
                            {eventSortBy === 'status' && (
                              eventSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4">
                          <button
                            onClick={() => handleEventSort('sessions')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Sessions
                            {eventSortBy === 'sessions' && (
                              eventSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                          <button
                            onClick={() => handleEventSort('created')}
                            className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold text-slate-800 dark:text-white"
                          >
                            Created
                            {eventSortBy === 'created' && (
                              eventSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 sm:px-4 font-semibold text-slate-800 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100 dark:divide-slate-700">
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b border-dashed border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50">
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {event.title.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/events/${event.id}`}
                                  className="font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block"
                                >
                                  <div className="truncate">{event.title}</div>
                                </Link>
                                <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                  {event.chapters.join(', ')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-lg text-xs font-medium">
                              {event.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${event.status === 'published'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : event.status === 'draft'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                              }`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {event.instances.length}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {format(new Date(event.createdAt), 'MMM d, yyyy')}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/edit-event/${event.id}`}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit Event"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}