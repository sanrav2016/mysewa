const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

// Re-export types for convenience
export type {
  User,
  Event,
  EventInstance,
  UserEventSignup,
  Notification,
  UserPreferences,
  AuthResponse,
  UsersResponse,
  UserResponse,
  EventsResponse,
  EventResponse,
  SignupsResponse,
  NotificationsResponse,
  PreferencesResponse,
  ChaptersCitiesResponse,
  ChapterMembersResponse,
  DashboardStatsResponse,
  UpcomingEventsResponse,
  RecentActivityResponse,
  AuthAPI,
  UsersAPI,
  EventsAPI,
  SignupsAPI,
  DashboardAPI,
  NotificationsAPI,
  PreferencesAPI
} from './api.d';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // Handle 401 errors by clearing auth data
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to handle network errors
const handleNetworkError = (error: any) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('Failed to connect to backend');
  }
  throw error;
};

// API request helper
const apiRequest = async (endpoint: string, options: any = {}) => {
  const token = getAuthToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return handleResponse(response);
  } catch (error) {
    handleNetworkError(error);
  }
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    
    return response;
  },

  register: async (userData: any) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  refreshToken: async () => {
    const response = await apiRequest('/auth/refresh', { method: 'POST' });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Users API
export const usersAPI = {
  getChaptersCities: async () => {
    return apiRequest('/users/chapters-cities');
  },

  getChapterMembers: async () => {
    return apiRequest('/users/chapter-members');
  },
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users?${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, { method: 'DELETE' });
  },

  getSignups: async (id: string) => {
    return apiRequest(`/users/${id}/signups`);
  },
};

// Events API
export const eventsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/events?${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/events/${id}`);
  },

  create: async (eventData: any) => {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  update: async (id: string, eventData: any) => {
    return apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/events/${id}`, { method: 'DELETE' });
  },

  createInstance: async (eventId: string, instanceData: any) => {
    return apiRequest(`/events/${eventId}/instances`, {
      method: 'POST',
      body: JSON.stringify(instanceData),
    });
  },

  updateInstance: async (instanceId: string, instanceData: any) => {
    return apiRequest(`/events/instances/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(instanceData),
    });
  },

  deleteInstance: async (instanceId: string) => {
    return apiRequest(`/events/instances/${instanceId}`, { method: 'DELETE' });
  },

  getInstanceById: async (instanceId: string) => {
    return apiRequest(`/events/instances/${instanceId}`);
  },

  updateSessionStatus: async (instanceId: string, statusData: { status: string; reason?: string }) => {
    return apiRequest(`/events/instances/${instanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },
};

// Signups API
export const signupsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/signups?${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/signups/${id}`);
  },

  create: async (signupData: any) => {
    return apiRequest('/signups', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  },

  update: async (id: string, signupData: any) => {
    return apiRequest(`/signups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(signupData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/signups/${id}`, { method: 'DELETE' });
  },

  bulkUpdateApproval: async (signups: any[]) => {
    return apiRequest('/signups/bulk-approval', {
      method: 'PATCH',
      body: JSON.stringify({ signups }),
    });
  },

  bulkUpdateWithRemovals: async (data: { removals: string[], updates: any[] }) => {
    return apiRequest('/signups/bulk-update-with-removals', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  parentBulkUpdate: async (sessionId: string, updates: any[]) => {
    return apiRequest(`/signups/parent-bulk-update/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  },

  getWaitlistPosition: async (instanceId: string) => {
    return apiRequest(`/signups/waitlist-position/${instanceId}`);
  },

  checkConflicts: async (instanceId: string) => {
    return apiRequest(`/signups/check-conflicts/${instanceId}`);
  },

  acceptWaitlist: async (instanceId: string) => {
    return apiRequest(`/signups/accept-waitlist/${instanceId}`, {
      method: 'POST',
    });
  },

  declineWaitlist: async (instanceId: string) => {
    return apiRequest(`/signups/decline-waitlist/${instanceId}`, {
      method: 'POST',
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    return apiRequest('/dashboard/stats');
  },

  getUpcomingEvents: async (limit = 3) => {
    return apiRequest(`/dashboard/upcoming-events?limit=${limit}`);
  },

  getRecentActivity: async (limit = 5) => {
    return apiRequest(`/dashboard/recent-activity?limit=${limit}`);
  },

  getAdminStats: async () => {
    return apiRequest('/dashboard/admin-stats');
  },

  getAvailableEvents: async (limit = 10) => {
    return apiRequest(`/dashboard/available-events?limit=${limit}`);
  },

  exportChapterData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/export-chapter-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  },

  generateCertificate: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/generate-certificate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/notifications?${queryString}`);
  },

  create: async (notificationData: any) => {
    return apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  markAsRead: async (id: string) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  },
};

// Preferences API
export const preferencesAPI = {
  get: async () => {
    return apiRequest('/preferences');
  },

  update: async (preferencesData: any) => {
    return apiRequest('/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    });
  },
};

// Health check
export const healthCheck = async () => {
  return fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.json());
}; 