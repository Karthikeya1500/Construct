
import { Task, TaskCategory, TaskStatus, User, UserRole } from '../types';

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
  skills: ['Plumbing', 'Heavy Lifting']
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    providerId: 'p1',
    providerName: 'Sarah Connor',
    providerPhone: '9876543210',
    providerRating: 4.9,
    title: 'Move heavy sofa upstairs',
    description: 'Need help moving a 3-seater sofa to the second floor. No elevator.',
    budget: 25,
    category: TaskCategory.SHIFTING,
    location_lat: 40.7138,
    location_lng: -74.0055,
    address: '123 Main St',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 100000,
    date: '2025-11-19'
  },
  {
    id: 't2',
    providerId: 'p2',
    providerName: 'Mike Ross',
    providerPhone: '9988776655',
    providerRating: 4.5,
    title: 'Deep clean 2BHK apartment',
    description: 'Move-out cleaning required. Needs to be spotless.',
    budget: 80,
    category: TaskCategory.CLEANING,
    location_lat: 40.7150,
    location_lng: -74.0010,
    address: '456 Park Ave',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 200000,
    date: '2025-11-20'
  },
  {
    id: 't3',
    providerId: 'p3',
    providerName: 'Jessica Pearson',
    providerPhone: '9123456789',
    providerRating: 5.0,
    title: 'Fix leaking kitchen tap',
    description: 'Kitchen sink tap is dripping constantly. Bring tools.',
    budget: 40,
    category: TaskCategory.REPAIR,
    location_lat: 40.7090,
    location_lng: -74.0100,
    address: '789 Broadway',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 300000,
    date: 'ASAP'
  }
];

export const generateRandomCoordinates = (baseLat: number, baseLng: number) => {
  // Generate coordinates within roughly 2-3km
  const lat = baseLat + (Math.random() - 0.5) * 0.03;
  const lng = baseLng + (Math.random() - 0.5) * 0.03;
  return { lat, lng };
};
