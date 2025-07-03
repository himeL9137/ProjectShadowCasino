// Enhanced type definitions for the Shadow Casino system
import { User as SchemaUser } from '@shared/schema';

// Extend the base User type to ensure all required properties are available
export interface EnhancedUser extends SchemaUser {
  id: string;
  username: string | null;
  role: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  password: string | null;
  rawPassword: string | null;
  balance: string;
  currency: string;
  isMuted: boolean;
  isBanned: boolean;
  profilePicture: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  ipAddress: string | null;
  lastLogin: Date | null;
  lastSeen: Date | null;
  isOnline: boolean;
  referralCode: string | null;
  referredBy: string | null;
  totalReferrals: number;
  referralEarnings: string;
}

// Admin user type with additional status information
export interface AdminUser extends EnhancedUser {
  status: 'Active' | 'Offline';
}

// Enhanced request interface for Express
declare global {
  namespace Express {
    interface Request {
      user?: EnhancedUser;
    }
  }
}

// Activity tracking session interface
export interface UserSession {
  userId: string;
  username: string;
  lastActivity: Date;
  isActive: boolean;
  ipAddress?: string;
}

// Activity summary interface
export interface ActivitySummary {
  totalActive: number;
  totalTracked: number;
  activeUsers: string[];
  lastCleanup: Date;
}

// Type guards for user objects
export function isEnhancedUser(user: any): user is EnhancedUser {
  return user && typeof user.id === 'string' && typeof user.username === 'string';
}

export function toEnhancedUser(user: any): EnhancedUser {
  return {
    ...user,
    id: user.id || '',
    username: user.username || null,
    role: user.role || 'user',
    email: user.email || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    profileImageUrl: user.profileImageUrl || null,
    phone: user.phone || null,
    password: user.password || null,
    rawPassword: user.rawPassword || null,
    balance: user.balance || '0',
    currency: user.currency || 'USD',
    isMuted: user.isMuted || false,
    isBanned: user.isBanned || false,
    profilePicture: user.profilePicture || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    ipAddress: user.ipAddress || null,
    lastLogin: user.lastLogin || null,
    lastSeen: user.lastSeen || null,
    isOnline: user.isOnline || false,
    referralCode: user.referralCode || null,
    referredBy: user.referredBy || null,
    totalReferrals: user.totalReferrals || 0,
    referralEarnings: user.referralEarnings || '0',
  };
}