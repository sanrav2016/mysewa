export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  avatar?: string;
  totalHours: number;
  joinedDate: string;
  phone?: string;
  emergencyContact?: string;
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
  status: 'draft' | 'published' | 'archived';
  chapters: string[];
  cities: string[];
}

export interface UserEventSignup {
  id: string;
  userId: string;
  eventId: string;
  instanceId: string;
  signupDate: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  hoursEarned?: number;
  attendance?: 'present' | 'absent' | 'not_marked';
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  members: User[];
}