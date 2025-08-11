import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { notificationsAPI } from '../services/api';

interface WebSocketContextType {
  socket: Socket | null;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loadNotifications, addNotification } = useNotification();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      
      // Join user room for notifications
      if (user?.id) {
        socket.emit('join-user', user.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for real-time notifications
    socket.on('notification-created', (data) => {
      console.log('📧 Received real-time notification:', data);
      
      // Display the notification immediately for online users
      if (data.notification) {
        const notificationType = data.notification.type?.toLowerCase() || 'info';
        addNotification(
          notificationType as any,
          data.notification.title,
          data.notification.description,
          false // Don't save to server since it's already saved
        );
        
        // Mark the notification as read since the user has seen it
        if (data.notification.id) {
          notificationsAPI.markAsRead(data.notification.id).catch(error => {
            console.error('Failed to mark notification as read:', error);
          });
        }
        
        // Don't reload notifications here since we're displaying it immediately
        // The notification count will be updated when the user next navigates or refreshes
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification, loadNotifications]);

  const joinSession = (sessionId: string) => {
    if (socketRef.current && isConnected) {
      console.log(`👥 Joining session: ${sessionId}`);
      socketRef.current.emit('join-session', sessionId);
    } else {
      console.log(`❌ Cannot join session ${sessionId}: socket=${!!socketRef.current}, connected=${isConnected}`);
    }
  };

  const leaveSession = (sessionId: string) => {
    if (socketRef.current && isConnected) {
      console.log(`👋 Leaving session: ${sessionId}`);
      socketRef.current.emit('leave-session', sessionId);
    }
  };

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      joinSession,
      leaveSession,
      isConnected
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
} 