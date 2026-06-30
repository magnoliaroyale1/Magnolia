import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'client' | 'clinic' | 'admin' | 'professional';
  photoURL?: string;
  createdAt: Timestamp | Date;
  clinicId?: string;
  emailVerified?: boolean;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
}

export interface Clinic {
  id: string;
  ownerId: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  approved: boolean;
  address: Address;
  procedures: string[];
  description: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  score: number;
  images: string[];
  plan: 'basic' | 'professional' | 'premium';
  cancellationPolicy?: CancellationPolicy;
  createdAt: Timestamp | Date;
  assessmentCompleted?: boolean;
  adminFeedback?: string;
}

export interface Professional {
  id: string;
  uid: string;
  clinicId: string;
  name: string;
  email: string;
  photoURL?: string;
  bio: string;
  procedures: string[];
  createdAt: Timestamp | Date;
}

export interface ProfessionalPortfolio {
  id: string;
  imageUrl: string;
  procedure: string;
  description: string;
  createdAt: Timestamp | Date;
}

export interface ClinicSchedule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  blockedDates: string[];
}

export interface Review {
  id: string;
  clinicId: string;
  professionalId?: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp | Date;
  helpful: number;
}

export interface Appointment {
  id: string;
  clinicId: string;
  professionalId?: string;
  professionalName?: string;
  clientId: string;
  clientName: string;
  procedure: string;
  date: Date | Timestamp;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancelled_by_client' | 'completed';
  notes?: string;
  valor?: number;
  cancelReason?: string;
}

export interface CancellationPolicy {
  allowCancellation: boolean;
  minHoursBeforeCancel: number;
  chargeCancellationFee: boolean;
  cancellationFee: number;
  allowRescheduling: boolean;
  minHoursBeforeReschedule: number;
  updatedAt?: Timestamp | Date;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  createdAt: Timestamp | Date;
  readTime: number;
  clinicId?: string;
  clinicName?: string;
}

export interface CheckoutSession {
  id: string;
  clinicId: string;
  plan: 'basic' | 'professional' | 'premium';
  price: number;
  paymentMethod: 'credit_card' | 'boleto' | 'pix' | null;
  status: 'pending' | 'completed';
  createdAt: Timestamp | Date;
  paidAt?: Timestamp | Date;
}

export interface ClientSummary {
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  totalVisits: number;
  totalSpent: number;
  firstVisit: Date | null;
  lastVisit: Date | null;
  procedures: string[];
  professionals: string[];
  appointments: Appointment[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export interface RevenueByProfessional {
  name: string;
  revenue: number;
  count: number;
}

export interface ProcedureCount {
  name: string;
  count: number;
  revenue: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | Date;
  read: boolean;
}

export interface Chat {
  id: string;
  clientId: string;
  clinicId: string;
  clientName: string;
  clinicName: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp | Date;
  unreadCount: number;
}

export interface Report {
  id: string;
  clinicId: string;
  reporterId: string;
  reason: string;
  description: string;
  createdAt: Timestamp | Date;
  status: 'open' | 'investigating' | 'resolved';
}

export interface DashboardStats {
  totalClinics: number;
  approvedClinics: number;
  pendingClinics: number;
  totalClients: number;
  estimatedRevenue: number;
}