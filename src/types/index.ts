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
  studentCapacity: number;
  parentCapacity: number;
  studentSignups: string[]; // user IDs
  parentSignups: string[]; // user IDs
  description?: string;
  enabled?: boolean;
  waitlistEnabled?: boolean;
  restrictions?: {
    prerequisiteEvents?: string[]; // event IDs
    minAge?: number;
    maxAge?: number;
    minHours?: number;
    maxHours?: number;
  };
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

export interface UserEventSignup {
  id: string;
  userId: string;
  eventId: string;
  instanceId: string;
  signupDate: string;
  status: 'CONFIRMED' | 'WAITLIST' | 'WAITLIST_PENDING' | 'CANCELLED';
  hoursEarned?: number;
  attendance?: 'PRESENT' | 'ABSENT' | 'NOT_MARKED';
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  members: User[];
}