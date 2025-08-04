import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Plus, Edit, Trash2, Search, Filter, UserPlus, Building, MapPin, Mail, Phone } from 'lucide-react';
import { mockUsers, mockEvents, chapters, cities } from '../data/mockData';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'events'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'student' | 'parent' | 'admin'>('all');
  const [eventFilter, setEventFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as 'student' | 'parent' | 'admin',
    phone: '',
    chapter: '',
    city: '',
    emergencyContact: ''
  });

  // Filter users
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter events
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.category.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesFilter = eventFilter === 'all' || event.status === eventFilter;
    return matchesSearch && matchesFilter;
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Please fill in required fields');
      return;
    }
    
    console.log('Adding new user:', newUser);
    alert('User added successfully!');
    setNewUser({
      name: '',
      email: '',
      role: 'student',
      phone: '',
      chapter: '',
      city: '',
      emergencyContact: ''
    });
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user:', userId);
      alert('User deleted successfully!');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      console.log('Deleting event:', eventId);
      alert('Event deleted successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage users and events across all chapters
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-orange-200 dark:border-slate-600">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 border-2 border-dashed ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            Users ({mockUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 border-2 border-dashed ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Events ({mockEvents.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors border-2 border-dashed border-green-400"
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-xl border-2 border-dashed border-green-200 dark:border-slate-500">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    onClick={() => setShowAddUser(false)}
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

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-dashed border-orange-200 dark:border-slate-600">
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Hours</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-dashed border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <Link
                              to={`/profile/${user.id}`}
                              className="font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"
                            >
                              {user.name}
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-sm font-medium capitalize ${
                          user.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : user.role === 'parent'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {user.totalHours}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Event Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                  />
                </div>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value as any)}
                  className="px-4 py-3 border-2 border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Link
                to="/create-event"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors border-2 border-dashed border-green-400"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-dashed border-orange-200 dark:border-slate-600">
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Event</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Sessions</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-dashed border-orange-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {event.title.charAt(0)}
                          </div>
                          <div>
                            <Link
                              to={`/events/${event.id}`}
                              className="font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"
                            >
                              {event.title}
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {event.chapters.join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-lg text-sm font-medium">
                          {event.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-lg text-sm font-medium capitalize ${
                          event.status === 'published'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : event.status === 'draft'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {event.instances.length}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {format(new Date(event.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
        )}
      </div>
    </div>
  );
}