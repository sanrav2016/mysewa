import React, { useState } from 'react';
import { User, Lock, Bell, Palette, Save, Eye, EyeOff, Download, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { chapters, cities } from '../data/mockData';

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'tools' | 'appearance'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || '',
    chapter: user?.chapter || '',
    city: user?.city || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    eventReminders: true,
    newEvents: true,
    weeklyDigest: false,
    emailNotifications: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ] as const;

  const handleSaveProfile = () => {
    // Mock save logic
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    // Mock password change logic
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveNotifications = () => {
    // Mock save logic
    alert('Notification preferences updated!');
  };

  const handleRequestExport = () => {
    // Mock export logic
    alert('Data export request submitted! You will receive an email when your data is ready for download.');
  };

  const handleViewCertificate = () => {
    // Mock certificate logic
    alert('Opening volunteer hours certificate...');
  };

  return (
    <div className="space-y-6 relative p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-4 border-dashed border-orange-200 dark:border-slate-600 transition-all duration-200">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-caveat">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-4 border-dashed border-orange-200 dark:border-slate-600 transition-all duration-200 lg:sticky top-6">
            <nav className="space-y-2">
              {tabs.map((tab, i) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:${i % 2 == 0 ? '-' : ''}rotate-1 border-2 border-dashed ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border-4 border-dashed border-orange-200 dark:border-slate-600 transition-all duration-200">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                  Profile Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chapter
                    </label>
                    <select
                      value={profileData.chapter}
                      onChange={(e) => setProfileData({ ...profileData, chapter: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                    >
                      <option value="">Select a chapter</option>
                      {chapters.map(chapter => (
                        <option key={chapter} value={chapter}>{chapter}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      City
                    </label>
                    <select
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                    >
                      <option value="">Select a city</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  {user?.role === 'parent' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact}
                        onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200 hover:scale-105"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2 border-dashed border-orange-300"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-110 transition-all duration-200"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-all duration-200 hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:scale-110 transition-all duration-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2 border-dashed border-orange-300"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value], i) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500 transition-all duration-200">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {key === 'eventReminders' && 'Get reminded about upcoming events you\'re signed up for'}
                          {key === 'newEvents' && 'Be notified when new volunteer opportunities are posted'}
                          {key === 'weeklyDigest' && 'Receive a weekly summary of chapter activities'}
                          {key === 'emailNotifications' && 'Receive notifications via email'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer hover:scale-110 transition-all">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2 border-dashed border-orange-300"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                  Export Tools
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500 transition-all duration-200">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-white mb-2">
                        Request Data Export
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Export chapter data as an Excel file
                      </p>
                    </div>
                    <button
                      onClick={handleRequestExport}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2 border-dashed border-blue-300"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500 transition-all duration-200">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-white mb-2">
                        Download Certificate
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Export volunteer certificate from Sewa International
                      </p>
                    </div>
                    <button
                      onClick={handleViewCertificate}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2 border-dashed border-blue-300"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                  Appearance Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500 transition-all duration-200">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-white mb-2">
                        Theme Preference
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Choose between light and dark mode
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2 border-dashed hover:rotate-2 hover:scale-105 ${isDark
                        ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-600'
                        : 'bg-white text-slate-800 hover:bg-slate-50 shadow-lg border-orange-200'
                        }`}
                    >
                      {isDark ? (
                        <>
                          <div className="w-4 h-4 bg-slate-600 rounded-full"></div>
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                          Light Mode
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}