import { storage } from './storage';

/**
 * Enhanced User Activity Tracker
 * Addresses the critical flaw where all users show as "Active" regardless of actual status
 * Implements proper session management and activity tracking
 */

interface ActivitySession {
  userId: string;
  username: string;
  lastActivity: Date;
  isActive: boolean;
  ipAddress?: string;
}

class UserActivityTracker {
  private activeSessions = new Map<string, ActivitySession>();
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupProcess();
  }

  /**
   * Mark a user as active (called on login, API requests, etc.)
   */
  async markUserActive(userId: string, username: string, ipAddress?: string): Promise<void> {
    try {
      const session: ActivitySession = {
        userId,
        username,
        lastActivity: new Date(),
        isActive: true,
        ipAddress
      };

      this.activeSessions.set(userId, session);

      // Update storage to reflect online status
      await storage.updateUserOnlineStatus(userId, true);
      await storage.updateUserLastSeen(userId);

      console.log(`User ${username} marked as ACTIVE`);
    } catch (error) {
      console.error(`Failed to mark user ${username} as active:`, error);
    }
  }

  /**
   * Mark a user as inactive (called on logout, session timeout, etc.)
   */
  async markUserInactive(userId: string, reason: string = 'manual'): Promise<void> {
    try {
      const session = this.activeSessions.get(userId);
      if (session) {
        session.isActive = false;
        this.activeSessions.delete(userId);

        // Update storage to reflect offline status
        await storage.updateUserOnlineStatus(userId, false);
        
        console.log(`User ${session.username} marked as INACTIVE (reason: ${reason})`);
      }
    } catch (error) {
      console.error(`Failed to mark user ${userId} as inactive:`, error);
    }
  }

  /**
   * Update user activity timestamp (called on authenticated requests)
   */
  async updateUserActivity(userId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(userId);
      if (session) {
        session.lastActivity = new Date();
        await storage.updateUserLastSeen(userId);
      }
    } catch (error) {
      console.error(`Failed to update activity for user ${userId}:`, error);
    }
  }

  /**
   * Get current activity status for a user
   */
  getUserActivityStatus(userId: string): { isActive: boolean; lastSeen?: Date } {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { isActive: false };
    }

    const timeSinceActivity = Date.now() - session.lastActivity.getTime();
    const isActive = timeSinceActivity < this.ACTIVITY_TIMEOUT;

    if (!isActive && session.isActive) {
      // User has timed out, mark as inactive
      this.markUserInactive(userId, 'timeout');
    }

    return {
      isActive,
      lastSeen: session.lastActivity
    };
  }

  /**
   * Get all currently active users
   */
  getActiveUsers(): ActivitySession[] {
    return Array.from(this.activeSessions.values()).filter(session => {
      const timeSinceActivity = Date.now() - session.lastActivity.getTime();
      return timeSinceActivity < this.ACTIVITY_TIMEOUT;
    });
  }

  /**
   * Get activity summary statistics
   */
  getActivitySummary(): { totalActive: number; totalSessions: number; activeUsers: string[] } {
    const activeUsers = this.getActiveUsers();
    return {
      totalActive: activeUsers.length,
      totalSessions: this.activeSessions.size,
      activeUsers: activeUsers.map(u => u.username)
    };
  }

  /**
   * Cleanup inactive sessions
   */
  private async cleanupInactiveSessions(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedUp = 0;

      for (const [userId, session] of this.activeSessions.entries()) {
        const timeSinceActivity = now - session.lastActivity.getTime();
        
        if (timeSinceActivity > this.ACTIVITY_TIMEOUT) {
          await this.markUserInactive(userId, 'timeout');
          cleanedUp++;
        }
      }

      if (cleanedUp > 0) {
        console.log(`Activity cleanup: marked ${cleanedUp} users as inactive due to timeout`);
      }

      // Also sync with storage to ensure database consistency
      await this.syncWithStorage();
    } catch (error) {
      console.error('Error during activity cleanup:', error);
    }
  }

  /**
   * Sync activity tracker state with storage
   */
  private async syncWithStorage(): Promise<void> {
    try {
      // Get all users from storage and check their current status
      const allUsers = await storage.getAllUsers();
      
      for (const user of allUsers) {
        const sessionExists = this.activeSessions.has(user.id);
        const shouldBeOnline = sessionExists && this.getUserActivityStatus(user.id).isActive;
        
        // If storage shows user as online but no active session exists, mark as offline
        if (user.isOnline && !shouldBeOnline) {
          await storage.updateUserOnlineStatus(user.id, false);
          console.log(`Synced: marked ${user.username} as offline in storage`);
        }
      }
    } catch (error) {
      console.error('Error syncing with storage:', error);
    }
  }

  /**
   * Start the cleanup process
   */
  private startCleanupProcess(): void {
    console.log('Starting user activity cleanup process (30min timeout, 5min cleanup interval)');
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the cleanup process
   */
  public stopCleanupProcess(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('User activity cleanup process stopped');
    }
  }

  /**
   * Force cleanup all sessions (useful for shutdown)
   */
  public async forceCleanupAll(): Promise<void> {
    console.log('Force cleaning up all user sessions...');
    
    for (const [userId] of this.activeSessions) {
      await this.markUserInactive(userId, 'forced_cleanup');
    }
    
    this.activeSessions.clear();
    console.log('All user sessions cleaned up');
  }
}

// Create and export the singleton instance
export const userActivityTracker = new UserActivityTracker();

/**
 * Middleware to track user activity on each authenticated request
 */
export const trackUserActivity = async (req: any, res: any, next: any) => {
  if (req.user?.id && req.user?.username) {
    await userActivityTracker.updateUserActivity(req.user.id);
  }
  next();
};