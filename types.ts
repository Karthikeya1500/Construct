
export enum UserRole {
  PROVIDER = 'PROVIDER',
  WORKER = 'WORKER'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  APPLIED = 'APPLIED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskCategory {
  CLEANING = 'Cleaning',
  SHIFTING = 'Shifting',
  HELPER = 'Helper',
  REPAIR = 'Repair',
  DELIVERY = 'Delivery',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  location_lat: number;
  location_lng: number;
  address: string;
  rating?: number; // Only for workers
  completedTasks: number;
  skills?: string[];
  photoURL?: string;
  bio?: string;
  experienceYears?: number;
  availability?: string;
  certifications?: string[];
  businessName?: string; // For providers
}

export interface AppliedWorker {
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerRating: number;
  skills?: string[];
  experienceYears?: number;
  distanceKm?: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Task {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  providerPhoto?: string;
  workerId?: string;
  workerName?: string;
  title: string;
  description: string;
  budget: number;
  category: TaskCategory;
  location_lat: number;
  location_lng: number;
  address: string;
  distanceKm?: number;
  status: TaskStatus;
  createdAt: number;
  date?: string;
  applicants?: AppliedWorker[];
  skills?: string[];
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  budget: number | null;
  category: TaskCategory;
  date: string | null;
  locationText: string | null;
  skills?: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}
