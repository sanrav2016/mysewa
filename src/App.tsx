import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SessionDetail from './pages/SessionDetail';
import EditEvent from './pages/EditEvent';
import Chapter from './pages/Chapter';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <WebSocketProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profile/:userId" element={<Profile />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="activity" element={<Activity />} />
                    <Route path="activity/:userId" element={<Activity />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="events" element={<Events />} />
                    <Route path="events/:eventId" element={<EventDetail />} />
                    <Route path="sessions/:sessionId" element={<SessionDetail />} />
                    <Route path="create-event" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <EditEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="edit-event/:eventId" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <EditEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="edit-session/:sessionId" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <EditEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="chapter" element={<Chapter />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    <Route path="admin" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
  );
}

export default App;