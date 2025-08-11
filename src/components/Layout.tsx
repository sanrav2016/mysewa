import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Activity,
  Calendar,
  List,
  Users,
  Bell,
  Settings,
  Plus,
  LogOut,
  Sun,
  Moon,
  Heart,
  Shield,
  Menu,
  X,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { serverNotifications, loadNotifications } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/events', icon: List, label: 'Events' },
    { path: '/chapter', icon: Users, label: 'Chapter' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.splice(-1, 0, { path: '/create-event', icon: Plus, label: 'Create Event' });
    navItems.splice(-1, 0, { path: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Chalky texture overlay */}
      <div className="fixed inset-0 opacity-20 dark:opacity-10 pointer-events-none"></div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-[100] p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-slate-700/50 hover:scale-105 transition-all"
      >
        <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[100]"
          onClick={closeSidebar}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } 
      fixed inset-y-0 left-0 z-[100] w-64 bg-white/70 dark:bg-slate-800/70 
      backdrop-blur-md border-r border-slate-200 dark:border-slate-700/50 
      shadow-lg transition-transform duration-300 ease-in-out h-full
      lg:translate-x-0`}
        >
          {/* Close button for mobile */}
          <button
            onClick={closeSidebar}
            className="lg:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 z-[150]"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col h-full">
            {/* Top sticky header */}
            <div className="flex items-center gap-3 p-6 sticky top-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 z-[100]">
              <div className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-all duration-200">
                <img src="/sewa_bird.svg"/>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  MySewa
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Making a difference
                </p>
              </div>
            </div>

            {/* Scrollable nav section */}
            <nav className="flex-1 overflow-y-auto space-y-1 p-4">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {
                      item.label == "Notifications" && !isActive && serverNotifications.filter((n: any) => !n.isRead).length > 0 && (
                        <span 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.5 rounded-full text-white font-bold text-xs min-w-[1.25rem] text-center" 
                          title={`${serverNotifications.filter((n: any) => !n.isRead).length} unread notifications`}
                        >
                          {serverNotifications.filter((n: any) => !n.isRead).length}
                        </span>
                      )
                    }
                  </Link>
                );
              })}
            </nav>

            {/* Bottom sticky footer */}
            <div className="sticky bottom-0 m-4 bg-slate-50 dark:bg-slate-700/50 p-4 shadow-sm rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform duration-200">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {user?.role.toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center px-2 py-1.5 bg-white dark:bg-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-500 transition-all duration-200 hover:scale-105"
                >
                  {isDark ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 transition-all duration-300 lg:ml-64 max-w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}