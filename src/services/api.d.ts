// API Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'ADMIN';
  avatar?: string;
  totalHours: number;
  joinedDate: string;
  phone?: string;
  chapter?: string;
  city?: string;
  createdAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  createdAt: string;
  instances: EventInstance[];
  isRecurring: boolean;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  chapters: string[];
  cities: string[];
}

export interface EventInstance {
  id: string;
  eventId: string;
  startDate: string;
  endDate: string;
  location: string;
  studentCapacity: number;
  parentCapacity: number;
  studentSignups: string[];
  parentSignups: string[];
  description?: string;
}

export interface UserEventSignup {
  id: string;
  userId: string;
  eventId: string;
  instanceId: string;
  signupDate: string;
  status: 'CONFIRMED' | 'WAITLIST' | 'WAITLIST_PENDING' | 'CANCELLED';
  hoursEarned?: number;
  approval?: 'APPROVED' | 'DENIED' | 'NOT_MARKED';
  comment?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  isRead: boolean;
  date: string;
  sessionId?: string;
  session?: {
    id: string;
    eventId: string;
    startDate: string;
    endDate: string;
    location: string;
    event: {
      id: string;
      title: string;
      category: string;
    };
  };
}

export interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  hoursUpdates: boolean;
  waitlistUpdates: boolean;
  eventCancellations: boolean;
}

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserResponse {
  user: User;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EventResponse {
  event: Event;
}

export interface SignupsResponse {
  signups: UserEventSignup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PreferencesResponse {
  preferences: UserPreferences;
}

export interface ChaptersCitiesResponse {
  chapters: string[];
  cities: string[];
}

export interface ChapterMembersResponse {
  users: User[];
}

export interface DashboardStatsResponse {
  stats: {
    totalHours: number;
    upcomingEvents: number;
    pastEvents: number;
    totalEvents: number;
    hoursThisMonth: number;
  };
}

export interface UpcomingEventsResponse {
  upcomingEvents: any[];
}

export interface RecentActivityResponse {
  recentActivity: any[];
}

// API Function Types
export interface AuthAPI {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthResponse>;
  refreshToken: () => Promise<AuthResponse>;
}

export interface UsersAPI {
  getChaptersCities: () => Promise<ChaptersCitiesResponse>;
  getChapterMembers: () => Promise<ChapterMembersResponse>;
  getAll: (params?: any) => Promise<UsersResponse>;
  getById: (id: string) => Promise<UserResponse>;
  update: (id: string, userData: any) => Promise<UserResponse>;
  delete: (id: string) => Promise<void>;
}

export interface EventsAPI {
  getAll: (params?: any) => Promise<EventsResponse>;
  getById: (id: string) => Promise<EventResponse>;
  create: (eventData: any) => Promise<EventResponse>;
  update: (id: string, eventData: any) => Promise<EventResponse>;
  delete: (id: string) => Promise<void>;
  createInstance: (eventId: string, instanceData: any) => Promise<any>;
  updateInstance: (instanceId: string, instanceData: any) => Promise<any>;
  deleteInstance: (instanceId: string) => Promise<void>;
}

export interface SignupsAPI {
  getAll: (params?: any) => Promise<SignupsResponse>;
  getById: (id: string) => Promise<any>;
  create: (signupData: any) => Promise<any>;
  update: (id: string, signupData: any) => Promise<any>;
  delete: (id: string) => Promise<void>;
  bulkUpdateApproval: (signups: any[]) => Promise<any>;
  bulkUpdateWithRemovals: (data: { removals: string[], updates: any[] }) => Promise<any>;
  parentBulkUpdate: (sessionId: string, updates: any[]) => Promise<any>;
  getWaitlistPosition: (instanceId: string) => Promise<any>;
  checkConflicts: (instanceId: string) => Promise<any>;
  acceptWaitlist: (instanceId: string) => Promise<any>;
  declineWaitlist: (instanceId: string) => Promise<any>;
}

export interface DashboardAPI {
  getStats: () => Promise<DashboardStatsResponse>;
  getUpcomingEvents: (limit?: number) => Promise<UpcomingEventsResponse>;
  getRecentActivity: (limit?: number) => Promise<RecentActivityResponse>;
  getAdminStats: () => Promise<any>;
  getAvailableEvents: (limit?: number) => Promise<any>;
}

export interface NotificationsAPI {
  getAll: (params?: any) => Promise<NotificationsResponse>;
  create: (notificationData: any) => Promise<any>;
  markAsRead: (id: string) => Promise<any>;
  markAllAsRead: () => Promise<any>;
  delete: (id: string) => Promise<void>;
}

export interface PreferencesAPI {
  get: () => Promise<PreferencesResponse>;
  update: (preferencesData: any) => Promise<PreferencesResponse>;
}

// Export the API objects
export declare const authAPI: AuthAPI;
export declare const usersAPI: UsersAPI;
export declare const eventsAPI: EventsAPI;
export declare const signupsAPI: SignupsAPI;
export declare const dashboardAPI: DashboardAPI;
export declare const notificationsAPI: NotificationsAPI;
export declare const preferencesAPI: PreferencesAPI;

// Health check function
export declare const healthCheck: () => Promise<any>; 