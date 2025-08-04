import { Event, EventInstance, User, UserEventSignup } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Chen',
    email: 'alex@student.edu',
    role: 'student',
    totalHours: 45,
    joinedDate: '2024-01-15',
    phone: '(555) 123-4567',
    chapter: 'Central New Jersey',
    city: 'Edison'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@parent.com',
    role: 'parent',
    totalHours: 78,
    joinedDate: '2023-09-10',
    phone: '(555) 987-6543',
    emergencyContact: '(555) 111-2222',
    chapter: 'Central New Jersey',
    city: 'Monroe'
  },
  {
    id: '3',
    name: 'Dr. Maria Rodriguez',
    email: 'maria@admin.org',
    role: 'admin',
    totalHours: 120,
    joinedDate: '2023-01-01',
    phone: '(555) 555-5555',
    chapter: 'Central New Jersey',
    city: 'Edison'
  },
  {
    id: '4',
    name: 'Jamie Park',
    email: 'jamie@student.edu',
    role: 'student',
    totalHours: 32,
    joinedDate: '2024-02-01',
    phone: '(555) 234-5678',
    chapter: 'North Jersey',
    city: 'Parsippany'
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael@parent.com',
    role: 'parent',
    totalHours: 56,
    joinedDate: '2023-11-15',
    phone: '(555) 345-6789',
    chapter: 'Central New Jersey',
    city: 'Monroe'
  }
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Community Garden Cleanup',
    description: 'Help maintain our local community garden by weeding, planting, and general maintenance.',
    category: 'Environment',
    createdBy: '3',
    createdAt: '2024-01-01',
    isRecurring: true,
    status: 'published',
    chapters: ['Central New Jersey'],
    cities: ['Edison', 'Monroe'],
    tags: ['outdoor', 'environment', 'physical'],
    instances: [
      {
        id: '1-1',
        eventId: '1',
        startDate: '2025-01-25T09:00:00',
        endDate: '2025-01-25T12:00:00',
        location: 'Riverside Community Garden',
        studentCapacity: 8,
        parentCapacity: 4,
        studentSignups: ['1', '4'],
        parentSignups: ['2'],
        description: 'Winter preparation and tool maintenance'
      },
      {
        id: '1-2',
        eventId: '1',
        startDate: '2025-08-08T09:00:00',
        endDate: '2025-08-08T12:00:00',
        location: 'Riverside Community Garden',
        studentCapacity: 8,
        parentCapacity: 4,
        studentSignups: ['1'],
        parentSignups: ['5'],
        description: 'Spring planting preparation'
      }
    ]
  },
  {
    id: '2',
    title: 'Food Bank Sorting',
    description: `<div>
  <h1>Volunteer Opportunity Overview</h1>
  <p>
    We're excited to have you join us for the upcoming event. Please review the details below:
  </p>

  <h2>What You’ll Be Doing</h2>
  <ul>
    <li>Preparing and serving food</li>
    <li>Helping with setup and cleanup</li>
    <li>Assisting attendees with directions</li>
  </ul>

  <h2>Schedule</h2>
  <ol>
    <li>8:00 AM – Arrive and check in</li>
    <li>8:30 AM – Begin food preparation</li>
    <li>12:00 PM – Serve meals</li>
    <li>2:00 PM – Cleanup and closing</li>
  </ol>

  <p>
    Make sure to wear comfortable clothing and closed-toe shoes. For questions, please visit
    <a href="https://example.com/faq" target="_blank" rel="noopener noreferrer">our FAQ page</a>.
  </p>
</div>`,
    category: 'Community Service',
    createdBy: '3',
    createdAt: '2024-01-05',
    isRecurring: false,
    status: 'published',
    chapters: ['Central New Jersey', 'North Jersey'],
    cities: ['Edison', 'Parsippany'],
    tags: ['indoor', 'community', 'sorting'],
    instances: [
      {
        id: '2-1',
        eventId: '2',
        startDate: '2025-08-05T14:00:00',
        endDate: '2025-08-05T17:00:00',
        location: '123 Central Food Bank, Edison, NJ 08820 District 7',
        studentCapacity: 1,
        parentCapacity: 1,
        studentSignups: ['4'],
        parentSignups: ['5'],
        description: 'Monthly food sorting and inventory'
      }
    ]
  },
  {
    id: '3',
    title: 'Senior Center Bingo Night',
    description: 'Assist with bingo night activities at the senior center.',
    category: 'Senior Care',
    createdBy: '3',
    createdAt: '2024-01-10',
    isRecurring: true,
    status: 'published',
    chapters: ['Central New Jersey'],
    cities: ['Edison'],
    tags: ['indoor', 'seniors', 'social'],
    instances: [
      {
        id: '3-1',
        eventId: '3',
        startDate: '2025-01-28T18:00:00',
        endDate: '2025-01-28T20:00:00',
        location: 'Sunset Senior Center',
        studentCapacity: 6,
        parentCapacity: 3,
        studentSignups: ['1', '4'],
        parentSignups: [],
        description: 'Help with setup, calling numbers, and cleanup'
      }
    ]
  }
];

export const chapters = [
  'Central New Jersey',
  'North Jersey',
  'South Jersey',
  'New York Metro',
  'Philadelphia',
  'Connecticut',
  'Long Island'
];

export const cities = [
  'Edison',
  'Monroe',
  'Parsippany',
  'Princeton',
  'New Brunswick',
  'Piscataway',
  'Somerset',
  'Franklin',
  'East Brunswick',
  'South Brunswick'
];
export const mockSignups: UserEventSignup[] = [
  {
    id: '1',
    userId: '1',
    eventId: '1',
    instanceId: '1-1',
    signupDate: '2025-01-15',
    status: 'confirmed',
    hoursEarned: 3,
    attendance: 'present'
  },
  {
    id: '2',
    userId: '1',
    eventId: '3',
    instanceId: '3-1',
    signupDate: '2025-01-16',
    status: 'confirmed',
    attendance: 'absent'
  },
  {
    id: '3',
    userId: '2',
    eventId: '1',
    instanceId: '1-1',
    signupDate: '2025-01-14',
    status: 'confirmed',
    hoursEarned: 3,
    attendance: 'present'
  },
  {
    id: '4',
    userId: '1',
    eventId: '2',
    instanceId: '2-1',
    signupDate: '2025-01-17',
    status: 'confirmed'
  },
  {
    id: '5',
    userId: '4',
    eventId: '1',
    instanceId: '1-1',
    signupDate: '2025-01-18',
    status: 'waitlist'
  },
  {
    id: '6',
    userId: '5',
    eventId: '1',
    instanceId: '1-1',
    signupDate: '2025-01-19',
    status: 'waitlist'
  }
];