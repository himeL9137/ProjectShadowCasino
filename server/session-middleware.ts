import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { EnhancedUser } from './types';

// Session management configuration
const SESSION_TIMEOUT_MINUTES = 30; // Mark users offline after 30 minutes of inactivity
const CLEANUP_INTERVAL_MINUTES = 5; // Run cleanup every 5 minutes

/**
 * Middleware to update user's last seen timestamp on each authenticated request
 * This ensures accurate tracking of user activity beyond just login/logout
 */
export const updateUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  // Only track activity for authenticated users - ENHANCED FOR PERFECT TRACKING
  if (req.user && (req.user as any).id) {
    try {
      const userId = (req.user as any).id;
      const username = (req.user as any).username || 'Unknown';
      
      // Update lastSeen timestamp for every authenticated request
      await storage.updateUserLastSeen(userId);
      
      // Ensure user is marked as online (in case they were marked offline incorrectly)
      await storage.updateUserOnlineStatus(userId, true);
      
      console.log(`✓ PERFECT Activity tracked for user ${username} (${userId})`);
    } catch (error) {
      console.error(`Failed to update activity for user ${(req.user as any)?.username}:`, error);
      // Don't block the request if activity tracking fails
    }
  }
  
  next();
};

/**
 * Mark users as offline if they haven't been seen for more than SESSION_TIMEOUT_MINUTES
 * This function runs periodically to clean up stale online statuses
 */
export const cleanupInactiveUsers = async (): Promise<void> => {
  try {
    const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000);
    
    // Get all currently online users
    const onlineUsers = await storage.getOnlineUsers();
    
    let cleanedUpCount = 0;
    
    for (const user of onlineUsers) {
      // Check if user's lastSeen is older than cutoff time
      if (user.lastSeen && new Date(user.lastSeen) < cutoffTime) {
        try {
          await storage.updateUserOnlineStatus(user.id, false);
          console.log(`Marked user ${user.username} as offline due to inactivity (last seen: ${user.lastSeen})`);
          cleanedUpCount++;
        } catch (error) {
          console.error(`Failed to mark user ${user.username} as offline:`, error);
        }
      }
    }
    
    if (cleanedUpCount > 0) {
      console.log(`Session cleanup: marked ${cleanedUpCount} inactive users as offline`);
    } else {
      console.log('Session cleanup: no inactive users found');
    }
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
};

/**
 * Start the automatic session cleanup process
 * Returns a cleanup function to stop the interval
 */
export const startSessionCleanup = (): (() => void) => {
  console.log(`Starting automatic session cleanup (timeout: ${SESSION_TIMEOUT_MINUTES} min, interval: ${CLEANUP_INTERVAL_MINUTES} min)`);
  
  // Run cleanup immediately on startup
  cleanupInactiveUsers();
  
  // Set up periodic cleanup
  const cleanupInterval = setInterval(() => {
    cleanupInactiveUsers();
  }, CLEANUP_INTERVAL_MINUTES * 60 * 1000);
  
  // Return function to stop the cleanup
  return () => {
    console.log('Stopping automatic session cleanup');
    clearInterval(cleanupInterval);
  };
};

/**
 * Middleware to handle various logout scenarios
 * This ensures users are marked offline when they leave the application
 */
export const handleUserLogout = async (userId: string, reason: string): Promise<void> => {
  try {
    await storage.updateUserOnlineStatus(userId, false);
    console.log(`User ${userId} marked as offline (reason: ${reason})`);
  } catch (error) {
    console.error(`Failed to mark user ${userId} as offline:`, error);
  }
};

/**
 * Enhanced user activity tracking configuration
 */
export const SESSION_CONFIG = {
  TIMEOUT_MINUTES: SESSION_TIMEOUT_MINUTES,
  CLEANUP_INTERVAL_MINUTES: CLEANUP_INTERVAL_MINUTES,
  MAX_CONCURRENT_SESSIONS: 5, // Allow up to 5 concurrent sessions per user
  TRACK_IP_CHANGES: true, // Track IP address changes for security
};