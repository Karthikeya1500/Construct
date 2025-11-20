
import { Task, TaskCategory, TaskStatus, User, UserRole, Notification } from '../types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  role: UserRole.WORKER,
  email: 'alex@example.com',
  phone: '9876543210',
  location_lat: 40.7128,
  location_lng: -74.0060,
  address: 'Downtown District, NY',
  rating: 4.8,
  completedTasks: 12,
  skills: ['Plumbing', 'Heavy Lifting'],
  experienceYears: 3,
  bio: 'Hardworking individual with 3 years of experience in general repairs and shifting.',
  photoURL: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff'
};

export const MOCK_PROVIDER: User = {
  id: 'p1',
  name: 'Sarah Connor',
  role: UserRole.PROVIDER,
  email: 'sarah@example.com',
  phone: '1231231234',
  location_lat: 40.7138,
  location_lng: -74.0055,
  address: '123 Main St',
  completedTasks: 5,
  businessName: 'Connor Logistics',
  photoURL: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=random'
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    providerId: 'p1',
    providerName: 'Sarah Connor',
    providerPhone: '9876543210',
    title: 'Move heavy sofa upstairs',
    description: 'Need help moving a 3-seater sofa to the second floor. No elevator. Please bring a helper if possible.',
    budget: 45,
    category: TaskCategory.SHIFTING,
    location_lat: 40.7138,
    location_lng: -74.0055,
    address: '123 Main St',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 100000,
    date: '2025-11-19',
    skills: ['Heavy Lifting'],
    applicants: [
      {
        workerId: 'u1',
        workerName: 'Alex Johnson',
        workerRating: 4.8,
        skills: ['Heavy Lifting'],
        status: 'pending',
        distanceKm: 0.8,
        workerPhoto: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff'
      }
    ]
  },
  {
    id: 't2',
    providerId: 'p2',
    providerName: 'Mike Ross',
    providerPhone: '9988776655',
    title: 'Deep clean 2BHK apartment',
    description: 'Move-out cleaning required. Needs to be spotless. I will provide the cleaning supplies.',
    budget: 120,
    category: TaskCategory.CLEANING,
    location_lat: 40.7150,
    location_lng: -74.0010,
    address: '456 Park Ave',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 200000,
    date: '2025-11-20',
    skills: ['Cleaning', 'Organizing'],
    applicants: []
  },
  {
    id: 't3',
    providerId: 'p3',
    providerName: 'Jessica Pearson',
    providerPhone: '9123456789',
    title: 'Fix leaking kitchen tap',
    description: 'Kitchen sink tap is dripping constantly. Please bring your own tools.',
    budget: 60,
    category: TaskCategory.REPAIR,
    location_lat: 40.7090,
    location_lng: -74.0100,
    address: '789 Broadway',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 300000,
    date: 'ASAP',
    skills: ['Plumbing'],
    applicants: []
  },
  {
    id: 't4',
    providerId: 'p4',
    providerName: 'Harvey Specter',
    title: 'Urgent Document Delivery',
    description: 'Deliver a package to the courthouse. Must be done within 1 hour.',
    budget: 30,
    category: TaskCategory.DELIVERY,
    location_lat: 40.7110,
    location_lng: -74.0080,
    address: '500 Center St',
    status: TaskStatus.IN_PROGRESS, 
    workerId: 'u1', 
    createdAt: Date.now() - 50000,
    date: 'Today',
    skills: ['Driving'],
    applicants: []
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'New Job Nearby', message: 'A new cleaning task has been posted 0.5km away.', time: '2m ago', read: false, type: 'info' },
  { id: 'n2', title: 'Payment Received', message: 'You received $45 for the Moving Task.', time: '1h ago', read: true, type: 'success' },
  { id: 'n3', title: 'Application Viewed', message: 'Sarah Connor viewed your application.', time: '3h ago', read: true, type: 'info' },
  { id: 'n4', title: 'Task Assigned', message: 'Harvey Specter assigned you "Urgent Document Delivery".', time: '5h ago', read: true, type: 'success' },
  { id: 'n5', title: 'Message from Provider', message: 'Can you come 30 mins early?', time: '1d ago', read: true, type: 'warning' }
];
