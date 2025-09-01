import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithToken: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session and validate with backend
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');

      if (storedUser && token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          handleAuthError(error);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithToken = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');

    // Only redirect if we're not already on the login page
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}