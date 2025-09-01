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
}

export interface EventInstance {
  id: string;
  eventId: string;
  startDate: string;
  endDate: string;
  location: string;
  hours: number;
  capacity: number;
  waitlistCapacity: number;
  description?: string;
  enabled: boolean;
  waitlistEnabled: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  scheduledPublishDate: string | null;
  createdAt: string;
  updatedAt: string;
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  chapters: string[];
  cities: string[];
  scheduledPublishDate: string | null;
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

export interface Chapter {
  id: string;
  name: string;
  description: string;
  members: User[];
}