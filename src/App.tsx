import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import History from './pages/History';
import Calendar from './pages/Calendar';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SessionDetail from './pages/SessionDetail';
import EditEvent from './pages/EditEvent';
import Chapter from './pages/Chapter';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:userId" element={<Profile />} />
                <Route path="activity" element={<Activity />} />
                <Route path="history" element={<History />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:eventId" element={<EventDetail />} />
                <Route path="sessions/:sessionId" element={<SessionDetail />} />
                <Route path="create-event" element={
                  <ProtectedRoute requiredRole="admin">
                    <EditEvent />
                  </ProtectedRoute>
                } />
                <Route path="edit-event/:eventId" element={
                  <ProtectedRoute requiredRole="admin">
                    <EditEvent />
                  </ProtectedRoute>
                } />
                <Route path="edit-session/:sessionId" element={
                  <ProtectedRoute requiredRole="admin">
                    <EditEvent />
                  </ProtectedRoute>
                } />
                <Route path="chapter" element={<Chapter />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;