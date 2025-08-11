import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Palette, Save, Eye, EyeOff, Download, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { usersAPI, authAPI, preferencesAPI, dashboardAPI } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'tools' | 'appearance'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
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
    weeklyDigest: false
  });

  // Load chapters and cities from users data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, preferencesData] = await Promise.all([
          usersAPI.getChaptersCities(),
          preferencesAPI.get()
        ]);
        setChapters(data.chapters || []);
        setCities(data.cities || []);

        // Load user preferences
        if (preferencesData.preferences) {
          setNotifications({
            eventReminders: preferencesData.preferences.eventReminders ?? true,
            newEvents: preferencesData.preferences.newEvents ?? true,
            weeklyDigest: preferencesData.preferences.weeklyDigest ?? false
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ] as const;

  const handleSaveProfile = async () => {
    try {
      await usersAPI.update(user?.id!, profileData);
      addNotification('success', 'Profile Updated', 'Your profile has been updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      addNotification('error', 'Update Failed', error.toString() || 'Failed to update profile', false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      addNotification('error', 'Current Password Required', 'Please enter your current password', false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('error', 'Password Mismatch', 'New passwords do not match!', false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification('error', 'Password Too Short', 'New password must be at least 6 characters long', false);
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      addNotification('error', 'Same Password', 'New password must be different from your current password', false);
      return;
    }

    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      addNotification('success', 'Password Changed', 'Your password has been changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      addNotification('error', 'Password Change Failed', error.response?.data?.message || 'Failed to change password', false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await preferencesAPI.update(notifications);
      addNotification('success', 'Preferences Updated', 'Your notification preferences have been updated!');
    } catch (error: any) {
      console.error('Failed to update notifications:', error);
      addNotification('error', 'Update Failed', error.response?.data?.message || 'Failed to update notification preferences', false);
    }
  };

  const handleRequestExport = async () => {
    try {
      addNotification('info', 'Preparing Export', 'Generating Excel file...', false);

      const blob = await dashboardAPI.exportChapterData();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chapter-data-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification('success', 'Export Complete', 'Chapter data has been downloaded successfully!');
    } catch (error: any) {
      console.error('Export failed:', error);
      addNotification('error', 'Export Failed', 'Failed to export chapter data. Please try again.', false);
    }
  };

  const handleViewCertificate = async () => {
    try {
      addNotification('info', 'Generating Certificate', 'Creating your volunteer certificate...', false);

      const blob = await dashboardAPI.generateCertificate();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `volunteer-certificate-${user?.name?.replace(/\s+/g, '-') || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification('success', 'Certificate Ready', 'Your volunteer certificate has been downloaded successfully!');
    } catch (error: any) {
      console.error('Certificate generation failed:', error);
      addNotification('error', 'Certificate Failed', error.toString() || 'Failed to generate certificate. Please try again.', false);
    }
  };

  return (
    <div className="space-y-6 relative p-4 lg:p-8">
      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 lg:sticky top-4">
            <nav className="space-y-2">
              {tabs.map((tab, i) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:scale-105 text-sm ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Profile information is managed by your organization. Please contact your administrator to update your details.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-white text-sm">
                      {profileData.name || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-white text-sm">
                      {profileData.email || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-white text-sm">
                      {profileData.phone || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chapter
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-white text-sm">
                      {profileData.chapter || 'Not assigned'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      City
                    </label>
                    <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-slate-800 dark:text-white text-sm">
                      {profileData.city || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-12 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
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
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-12 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
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
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-12 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
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
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all hover:scale-105 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value], i) => (
                    <>
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-white">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {key === 'eventReminders' && 'Get reminded about upcoming events you\'re signed up for'}
                            {key === 'newEvents' && 'Be notified when new volunteer opportunities are posted'}
                            {key === 'weeklyDigest' && 'Receive a weekly summary of chapter activities'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer hover:scale-110 transition-all">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>
                    </>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all hover:scale-105 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Export Tools
                </h2>

                <div className="space-y-4">
                  {user?.role === "ADMIN" &&
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">
                          Request Data Export
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Export chapter data as an Excel file
                        </p>
                      </div>
                      <button
                        onClick={handleRequestExport}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2  border-blue-300"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  }

                  {user?.role !== "ADMIN" &&
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white">
                          Download Certificate
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Export volunteer certificate from Sewa International
                        </p>
                      </div>
                      <button
                        onClick={handleViewCertificate}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 hover:rotate-1 border-2  border-blue-300"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  }
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Appearance Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-white">
                        Theme Preference
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Choose between light and dark mode
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2  hover:rotate-2 hover:scale-105 ${isDark
                        ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-600'
                        : 'bg-white text-slate-800 hover:bg-slate-50 shadow-lg border-slate-200'
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