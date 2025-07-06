import { Express, Request, Response } from "express";
import { authenticateJWT, isAdmin } from "./auth";
import { storage } from "./storage";
import { AdminActionType, Currency, TransactionType, User } from "@shared/schema";
import { enhancedCurrencyConverter } from "./utils/enhanced-currency-converter";
import { userActivityTracker } from "./user-activity-tracker";

// Admin User interface for responses
interface AdminUser extends User {
  ipAddress: string;
  lastLogin: Date | null;
}

export function setupAdminRoutes(app: Express) {
  // Admin middleware
  const adminMiddleware = [authenticateJWT, isAdmin];

  // Get supported currencies
  app.get("/api/admin/currencies", adminMiddleware, (req: Request, res: Response) => {
    try {
      const currencies = Object.values(Currency);
      res.json(currencies);
    } catch (error) {
      console.error("Error getting currencies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user balance
  app.get("/api/admin/users/:id/balance", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currency = (req.query.currency as Currency) || Currency.USD;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert balance if needed
      let balance = parseFloat(user.balance);
      if (currency !== user.currency) {
        try {
          const converted = await enhancedCurrencyConverter.convert(
            balance, 
            user.currency as Currency, 
            currency
          );
          balance = converted;
        } catch (error) {
          console.error("Currency conversion error:", error);
          return res.status(400).json({ message: "Invalid currency conversion" });
        }
      }

      res.json({ 
        userId, 
        balance: balance.toString(),
        currency 
      });
    } catch (error) {
      console.error("Error getting user balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add funds to user
  app.post("/api/admin/users/:id/add-funds", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { amount, currency, reason } = req.body;

      if (!amount || amount <= 0 || !currency) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert amount to user's currency
      let convertedAmount: number;
      try {
        if (currency === user.currency) {
          convertedAmount = parseFloat(amount);
        } else {
          convertedAmount = await enhancedCurrencyConverter.convert(
            parseFloat(amount), 
            currency as Currency, 
            user.currency as Currency
          );
        }
      } catch (error) {
        console.error("Currency conversion error:", error);
        return res.status(400).json({ message: "Currency conversion failed" });
      }

      // Calculate new balance
      const newBalance = (parseFloat(user.balance) + convertedAmount).toString();
      const updatedUser = await storage.updateUserBalance(userId, newBalance);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: userId,
        amount: convertedAmount.toString(),
        type: TransactionType.ADMIN_ADJUSTMENT,
        currency: user.currency as Currency,
        status: "completed"
      });

      // Log admin action
      await storage.logAdminAction(
        (req.user as any)!.id,
        AdminActionType.EDIT_BALANCE,
        userId,
        { 
          action: "add",
          amount,
          fromCurrency: currency,
          toAmount: convertedAmount,
          toCurrency: user.currency,
          reason: reason || "Admin adjustment",
          transactionId: transaction.id,
          adminUsername: (req.user as any)!.username || "Unknown",
          targetUsername: user.username || "Unknown"
        }
      );

      res.json({
        user: updatedUser,
        addedAmount: amount,
        addedCurrency: currency,
        newBalance: newBalance,
        balanceCurrency: user.currency,
        message: `Successfully added ${amount} ${currency} to user's balance`
      });
    } catch (error) {
      console.error("Error adding funds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove funds from user
  app.post("/api/admin/users/:id/remove-funds", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { amount, currency, reason } = req.body;

      if (!amount || amount <= 0 || !currency) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert amount to user's currency
      let convertedAmount: number;
      try {
        if (currency === user.currency) {
          convertedAmount = parseFloat(amount);
        } else {
          convertedAmount = await enhancedCurrencyConverter.convert(
            parseFloat(amount), 
            currency as Currency, 
            user.currency as Currency
          );
        }
      } catch (error) {
        console.error("Currency conversion error:", error);
        return res.status(400).json({ message: "Currency conversion failed" });
      }

      // Check sufficient funds
      if (parseFloat(user.balance) < convertedAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Calculate new balance
      const newBalance = (parseFloat(user.balance) - convertedAmount).toString();
      const updatedUser = await storage.updateUserBalance(userId, newBalance);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: userId,
        amount: (-convertedAmount).toString(), // Negative for removal
        type: TransactionType.ADMIN_ADJUSTMENT,
        currency: user.currency as Currency,
        status: "completed"
      });

      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.EDIT_BALANCE,
        userId,
        { 
          action: "remove",
          amount,
          fromCurrency: currency,
          toAmount: convertedAmount,
          toCurrency: user.currency,
          reason: reason || "Admin adjustment",
          transactionId: transaction.id,
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown"
        }
      );

      res.json({
        user: updatedUser,
        removedAmount: amount,
        removedCurrency: currency,
        newBalance: newBalance,
        balanceCurrency: user.currency,
        message: `Successfully removed ${amount} ${currency} from user's balance`
      });
    } catch (error) {
      console.error("Error removing funds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all users with sensitive information (for admin panel) - ENHANCED WITH ACCURATE ACTIVITY TRACKING
  app.get("/api/admin/users", adminMiddleware, async (req: Request, res: Response) => {
    try {
      console.log("Admin request to fetch users received from:", req.user?.username || "Unknown");
      const users = await storage.getAllUsers();
      
      // Enhance user data with ACCURATE activity status from activity tracker
      const enhancedUsers = users.map(user => {
        // Get real-time activity status from the enhanced activity tracker
        const activityStatus = userActivityTracker.getUserActivityStatus(user.id);
        
        return {
          ...user,
          password: user.rawPassword || user.password || '',  // Include raw password for admin viewing
          ipAddress: (user.ipAddress as string) || "Unknown",
          lastLogin: (user.lastLogin as Date) || null,
          isOnline: activityStatus.isActive,  // FIXED: Use real activity status instead of static storage value
          lastSeen: activityStatus.lastSeen || user.lastSeen,  // Use most recent activity data
          status: activityStatus.isActive ? 'Active' : 'Offline'  // Clear status indicator
        } as AdminUser;
      });
      
      const summary = userActivityTracker.getActivitySummary();
      console.log(`✓ Enhanced admin users data with accurate activity tracking:`);
      console.log(`  - Total users: ${enhancedUsers.length}`);
      console.log(`  - Actually active: ${summary.totalActive}`);
      console.log(`  - Active users: ${summary.activeUsers.join(', ') || 'none'}`);
      
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New debugging endpoint to check activity tracker status
  app.get("/api/admin/activity-status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const summary = userActivityTracker.getActivitySummary();
      const activeUsers = userActivityTracker.getActiveUsers();
      
      res.json({
        summary,
        activeUsers: activeUsers.map(session => ({
          userId: session.userId,
          username: session.username,
          lastActivity: session.lastActivity,
          isActive: session.isActive,
          timeSinceLastActivity: Date.now() - session.lastActivity.getTime()
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting activity status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // New endpoint to update user details
  app.post("/api/admin/users/:id/update", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { username, email, password, role } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent admins from editing their own username or email to avoid lockout
      if (req.user!.id === userId && (username !== user.username || email !== user.email)) {
        return res.status(400).json({ 
          message: "Admins cannot change their own username or email to prevent lockout" 
        });
      }
      
      // Prepare update data
      const updateData: Partial<User> = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (role && (req.user!.id !== userId)) {
        // Prevent an admin from demoting themselves
        updateData.role = role;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Log admin action with appropriate type
      let actionType = AdminActionType.VIEW_USER_DETAILS;
      if (role && role !== user.role) {
        actionType = AdminActionType.CHANGE_USER_ROLE;
      }
      
      await storage.logAdminAction(
        req.user!.id,
        actionType,
        userId,
        { 
          updated: Object.keys(updateData),
          oldRole: user.role,
          newRole: role,
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown"
        }
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ban user
  app.post("/api/admin/users/:id/ban", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isBanned) {
        return res.status(400).json({ message: "User is already banned" });
      }

      // Prevent admin from banning themselves
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "Cannot ban yourself" });
      }

      const updatedUser = await storage.toggleUserBan(userId, true);

      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { 
          reason: reason || "No reason provided",
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown",
          previousBanStatus: user.isBanned
        }
      );

      res.json({
        user: updatedUser,
        message: `Successfully banned user ${user.username}`,
        reason: reason || "No reason provided"
      });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unban user
  app.post("/api/admin/users/:id/unban", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isBanned) {
        return res.status(400).json({ message: "User is not banned" });
      }

      const updatedUser = await storage.toggleUserBan(userId, false);

      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.UNBAN_USER,
        userId,
        { 
          reason: reason || "No reason provided",
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown",
          previousBanStatus: user.isBanned
        }
      );

      res.json({
        user: updatedUser,
        message: `Successfully unbanned user ${user.username}`,
        reason: reason || "No reason provided"
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mute user
  app.post("/api/admin/users/:id/mute", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isMuted) {
        return res.status(400).json({ message: "User is already muted" });
      }

      // Prevent admin from muting themselves
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "Cannot mute yourself" });
      }

      const updatedUser = await storage.toggleUserMute(userId, true);

      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.MUTE_USER,
        userId,
        { 
          reason: reason || "No reason provided",
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown",
          previousMuteStatus: user.isMuted
        }
      );

      res.json({
        user: updatedUser,
        message: `Successfully muted user ${user.username}`,
        reason: reason || "No reason provided"
      });
    } catch (error) {
      console.error("Error muting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unmute user
  app.post("/api/admin/users/:id/unmute", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isMuted) {
        return res.status(400).json({ message: "User is not muted" });
      }

      const updatedUser = await storage.toggleUserMute(userId, false);

      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.UNMUTE_USER,
        userId,
        { 
          reason: reason || "No reason provided",
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown",
          previousMuteStatus: user.isMuted
        }
      );

      res.json({
        user: updatedUser,
        message: `Successfully unmuted user ${user.username}`,
        reason: reason || "No reason provided"
      });
    } catch (error) {
      console.error("Error unmuting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // View user details with audit logging
  app.get("/api/admin/users/:id/details", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user transactions
      const transactions = await storage.getUserTransactions(userId);
      
      // Get user's game history
      const gameHistory = await storage.getUserGameHistory(userId);

      // Log admin action for transparency
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.VIEW_USER_DETAILS,
        userId,
        { 
          adminUsername: req.user!.username || "Unknown",
          targetUsername: user.username || "Unknown",
          accessedSections: ["profile", "transactions", "gameHistory"]
        }
      );

      res.json({
        user: {
          ...user,
          rawPassword: undefined // Never expose raw passwords
        },
        transactions,
        gameHistory,
        message: "User details retrieved successfully"
      });
    } catch (error) {
      console.error("Error getting user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current exchange rates
  app.get("/api/admin/exchange-rates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { base = Currency.USD } = req.query;
      
      const baseCurrency = base as Currency;
      
      // If base currency is not valid, return 400
      if (!Object.values(Currency).includes(baseCurrency)) {
        return res.status(400).json({ message: "Invalid base currency" });
      }
      
      // Get exchange rates for all currencies from the base currency
      const exchangeRates: Record<string, number> = {};
      
      for (const currency of Object.values(Currency)) {
        try {
          if (currency === baseCurrency) {
            exchangeRates[currency] = 1;
          } else {
            const rate = await enhancedCurrencyConverter.convert(1, baseCurrency, currency);
            exchangeRates[currency] = rate;
          }
        } catch (error) {
          console.error(`Error getting exchange rate for ${currency}:`, error);
          exchangeRates[currency] = 1; // Fallback to 1:1 ratio
        }
      }
      
      res.json({
        baseCurrency,
        exchangeRates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all transactions for admin overview
  app.get("/api/admin/transactions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user transactions for admin view
  app.get("/api/admin/users/:id/transactions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const transactions = await storage.getUserTransactions(userId);
      
      // Log admin action for transparency
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.VIEW_USER_DETAILS,
        userId,
        { 
          adminUsername: req.user!.username || "Unknown",
          accessedSections: ["transactions"]
        }
      );

      res.json(transactions);
    } catch (error) {
      console.error("Error getting user transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}