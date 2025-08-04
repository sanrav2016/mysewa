import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Activity,
  Calendar,
  List,
  Users,
  Clock,
  Settings,
  Plus,
  LogOut,
  Sun,
  Moon,
  Heart,
  Menu,
  X,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/events', icon: List, label: 'Events' },
    { path: '/chapter', icon: Users, label: 'Chapter' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (user?.role === 'admin') {
    navItems.splice(-1, 0, { path: '/create-event', icon: Plus, label: 'Create Event' });
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Chalky texture overlay */}
      <div className="fixed inset-0 opacity-20 dark:opacity-10 pointer-events-none"></div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600"
      >
        <Menu className="w-6 h-6 text-slate-800 dark:text-white" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } 
      fixed inset-y-0 left-0 z-[100] w-64 bg-white/80 dark:bg-slate-800/80 
      backdrop-blur-sm border-r-4 border-dashed border-orange-200 dark:border-slate-600 
      shadow-xl transition-transform duration-300 ease-in-out h-full
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
            <div className="flex items-center gap-3 p-6 sticky top-0 bg-white/80 dark:bg-slate-800/80 border-b-2 border-dashed border-orange-200 dark:border-slate-500 z-[100]">
              <div className="w-16 h-16 py-2 px-1 flex items-center justify-center hover:scale-110 hover:rotate-3 transition-all duration-200">
                <img src="/sewa_bird.svg" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white font-caveat">
                  MySewa
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Making a difference
                </p>
              </div>
            </div>

            {/* Scrollable nav section */}
            <nav className="flex-1 overflow-y-auto space-y-2 p-6">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:${i % 2 == 1 ? '-' : ''
                      }rotate-1 border-2 border-dashed ${isActive
                        ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg border-orange-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-700 border-transparent hover:border-orange-200 dark:hover:border-slate-600'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {
                      item.label == "Activity" && !isActive && <span className="bg-gradient-to-r from-orange-400 to-red-500 px-2 py-1 rounded-2xl text-white font-bold text-sm w-8 text-center" title="2 new notifications">2</span>
                    }
                  </Link>
                );
              })}
            </nav>

            {/* Bottom sticky footer */}
            <div className="sticky bottom-0 m-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-slate-700 dark:to-slate-600 p-4 shadow-lg rounded-xl border-2 border-dashed border-orange-200 dark:border-slate-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-110 transition-transform duration-200">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white font-caveat">
                    {user?.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-200 hover:scale-105 border border-dashed border-orange-200 dark:border-slate-600"
                >
                  {isDark ? <Sun className="w-4 h-4 text-slate-300" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-105 border border-dashed border-red-200 dark:border-red-800"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 lg:p-8 transition-all duration-300 lg:ml-64">
          <Outlet />
        </div>
      </div>
    </div>
  );
}