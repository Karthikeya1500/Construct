
export enum UserRole {
  PROVIDER = 'PROVIDER', // Changed from EMPLOYER
  WORKER = 'WORKER'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY', // New
  IN_PROGRESS = 'IN_PROGRESS', // New
  COMPLETED_PENDING_APPROVAL = 'COMPLETED_PENDING_APPROVAL',
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
  rating: number;
  completedTasks: number;
  skills?: string[]; // Only for workers
  photoURL?: string;
  bio?: string;
  experienceYears?: number;
  availability?: string;
  certifications?: string[];
}

export interface Task {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string; // New: For contact after accept
  providerRating?: number; // New: To show provider trust
  workerId?: string;
  workerName?: string;
  title: string;
  description: string;
  budget: number;
  category: TaskCategory;
  location_lat: number;
  location_lng: number;
  address: string; // Text representation of location
  distanceKm?: number; // Calculated relative to user
  status: TaskStatus;
  createdAt: number;
  date?: string; // ISO string or descriptive text
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  budget: number | null;
  category: TaskCategory;
  date: string | null;
  locationText: string | null;
}
