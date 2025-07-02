import { Express, Request, Response } from "express";
import { authenticateJWT, isAdmin } from "./auth";
import { storage } from "./storage";
import { AdminActionType, Currency, TransactionType, User } from "@shared/schema";
import { enhancedCurrencyConverter } from "./utils/enhanced-currency-converter";

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
      const userId = parseInt(req.params.id);
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
        req.user!.id,
        AdminActionType.EDIT_BALANCE,
        userId,
        { 
          action: "add",
          amount,
          fromCurrency: currency,
          toAmount: convertedAmount,
          toCurrency: user.currency,
          reason: reason || "Admin adjustment",
          transactionId: transaction.id
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
          transactionId: transaction.id
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

  // Get all users with sensitive information (for admin panel)
  app.get("/api/admin/users", adminMiddleware, async (req: Request, res: Response) => {
    try {
      console.log("Admin request to fetch users received from:", req.user?.username);
      const users = await storage.getAllUsers();
      
      // Enhance user data with additional information
      const enhancedUsers = users.map(user => {
        // Cast to the appropriate types
        return {
          ...user,
          ipAddress: (user.ipAddress as string) || "Unknown",
          lastLogin: (user.lastLogin as Date) || null
        } as AdminUser;
      });
      
      console.log(`Sending back ${enhancedUsers.length} users`);
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // New endpoint to update user details
  app.post("/api/admin/users/:id/update", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
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
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.EDIT_BALANCE,
        userId,
        { updated: Object.keys(updateData) }
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
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
        if (currency === baseCurrency) {
          exchangeRates[currency] = 1; // Same currency, rate is 1
        } else {
          try {
            const { getExchangeRate, convertCurrency } = await import('./utils/currency-converter');
            // Get exchange rate from base currency to target currency
            const rate = getExchangeRate(currency as Currency);
            exchangeRates[currency] = rate || 1;
          } catch (err) {
            console.error(`Error getting exchange rate from ${baseCurrency} to ${currency}:`, err);
            // Set a fallback rate if conversion fails
            if (baseCurrency === Currency.USD) {
              const fallbackRates: Record<string, number> = {
                [Currency.BDT]: 110,
                [Currency.INR]: 83,
                [Currency.BTC]: 0.000017,
              };
              exchangeRates[currency] = fallbackRates[currency] || 1;
            } else {
              exchangeRates[currency] = 1; // Default to 1:1 if we can't determine the rate
            }
          }
        }
      }
      
      res.json({ base: baseCurrency, rates: exchangeRates, timestamp: new Date() });
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      res.status(500).json({ message: "Failed to get exchange rates" });
    }
  });

  // Adjust user funds (add or remove)
  app.post("/api/admin/users/:id/funds", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, currency, reason, confirmed } = req.body;
      
      // Validate request using the schema
      const { fundAdjustmentSchema } = await import('@shared/schema');
      const validationResult = fundAdjustmentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid fund adjustment data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Ensure confirmation is provided
      if (!confirmed) {
        return res.status(400).json({ 
          message: "Please confirm the fund adjustment",
          requiresConfirmation: true
        });
      }
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      try {
        // Import currency converter
        
        // Amount to add in the user's currency
        let adjustedAmount: string;
        
        if (currency === user.currency) {
          // Same currency, no conversion needed
          adjustedAmount = amount;
        } else {
          // Convert to user's currency
          const converted = await enhancedCurrencyConverter.convert(
            parseFloat(amount), 
            currency as Currency,
            user.currency as Currency
          );
          
          adjustedAmount = converted.toString();
        }
        
        // Validate final balance won't be negative
        const newBalance = parseFloat(user.balance) + parseFloat(adjustedAmount);
        if (newBalance < 0) {
          return res.status(400).json({ 
            message: "Insufficient funds. Cannot reduce balance below zero."
          });
        }
        
        // Update the user's balance
        const updatedUser = await storage.updateUserBalance(userId, newBalance.toString());
        
        // Create a transaction record
        const transaction = await storage.createTransaction({
          userId,
          amount: adjustedAmount,
          type: TransactionType.ADMIN_ADJUSTMENT,
          currency: user.currency as Currency,
          status: "completed"
        });
        
        // Log admin action with reason
        await storage.logAdminAction(
          req.user!.id,
          AdminActionType.EDIT_BALANCE,
          userId,
          { 
            amount, 
            fromCurrency: currency, 
            toUserCurrency: adjustedAmount, 
            userCurrency: user.currency,
            reason: reason || "No reason provided",
            transactionId: transaction.id
          }
        );
        
        res.json({
          user: updatedUser,
          transaction,
          conversion: {
            from: {
              amount,
              currency
            },
            to: {
              amount: adjustedAmount,
              currency: user.currency
            }
          }
        });
        
      } catch (error) {
        console.error("Error during currency conversion:", error);
        return res.status(500).json({ 
          message: "Currency conversion failed", 
          details: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Error adjusting user funds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Kick user (temporary block)
  app.post("/api/admin/users/:id/kick", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { notification } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle mute status to true (kick = temporary mute)
      const updatedUser = await storage.toggleUserMute(userId, true);
      
      // Store notification for user to see when they next login
      const defaultKickMessage = "You have been temporarily kicked from Shadow Casino. If you have any issues, please contact our support team.";
      await storage.addUserNotification(userId, notification || defaultKickMessage, 'kick');
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { action: "kick", status: "muted", notification }
      );
      
      console.log(`User ${user.username} has been kicked by admin ${req.user?.username}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error kicking user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ban user (permanent block)
  app.post("/api/admin/users/:id/ban", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { notification } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle ban status to true
      const updatedUser = await storage.toggleUserBan(userId, true);
      
      // Store notification for user to see when they next login
      const defaultBanMessage = "Your account has been permanently banned from Shadow Casino. If you believe this is an error, please contact our support team.";
      await storage.addUserNotification(userId, notification || defaultBanMessage, 'ban');
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { action: "ban", status: "banned", notification }
      );
      
      console.log(`User ${user.username} has been banned by admin ${req.user?.username}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unkick user (remove temporary mute)
  app.post("/api/admin/users/:id/unkick", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { notification } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle mute status to false
      const updatedUser = await storage.toggleUserMute(userId, false);
      
      // Store notification for user to see when they next login
      if (notification) {
        await storage.addUserNotification(userId, notification, 'unkick');
      }
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { action: "unkick", status: "unmuted", notification }
      );
      
      console.log(`User ${user.username} has been unkicked by admin ${req.user?.username}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unkicking user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unban user (remove permanent block)
  app.post("/api/admin/users/:id/unban", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { notification } = req.body;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle ban status to false
      const updatedUser = await storage.toggleUserBan(userId, false);
      
      // Store notification for user to see when they next login
      if (notification) {
        await storage.addUserNotification(userId, notification, 'unban');
      }
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { action: "unban", status: "unbanned", notification }
      );
      
      console.log(`User ${user.username} has been unbanned by admin ${req.user?.username}`);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all transactions
  app.get("/api/admin/transactions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      
      // Enhance transactions with usernames
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const user = await storage.getUser(transaction.userId);
          return {
            ...transaction,
            username: user ? user.username : `User ${transaction.userId}`,
          };
        })
      );
      
      res.json(enhancedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get transactions for a specific user
  app.get("/api/admin/users/:id/transactions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getUserTransactions(userId);
      
      res.json(transactions);
    } catch (error) {
      console.error(`Error fetching transactions for user ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Get system stats
  app.get("/api/admin/stats", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Calculate stats
      const totalUsers = users.length;
      const activeUsers = users.filter(u => !u.isBanned && !u.isMuted).length;
      const mutedUsers = users.filter(u => u.isMuted && !u.isBanned).length;
      const bannedUsers = users.filter(u => u.isBanned).length;
      
      // Last login times from the users data
      const lastLogins = users.map(user => ({
        id: user.id,
        username: user.username,
        lastLogin: (user.lastLogin as Date) || null
      }));
      
      res.json({
        totalUsers,
        activeUsers,
        mutedUsers,
        bannedUsers,
        lastLogins
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unmute all users endpoint
  app.post("/api/admin/users/unmute-all", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      for (const user of users) {
        if (user.isMuted) {
          await storage.toggleUserMute(user.id, false);
          
          // Log admin action
          await storage.logAdminAction(
            req.user!.id,
            AdminActionType.BAN_USER,
            user.id,
            { action: "unmute", status: "unmuted" }
          );
        }
      }
      
      res.json({ message: "All users unmuted successfully" });
    } catch (error) {
      console.error("Error unmuting all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unban user (remove permanent block)
  app.post("/api/admin/users/:id/unban", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle ban status to false
      const updatedUser = await storage.toggleUserBan(userId, false);
      
      // Log admin action
      await storage.logAdminAction(
        req.user!.id,
        AdminActionType.BAN_USER,
        userId,
        { action: "unban", status: "unbanned" }
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

interface AdminUser extends User {
  ipAddress: string | null;
  lastLogin: Date | null;
}