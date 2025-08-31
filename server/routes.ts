import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import { setupAuth, authenticateJWT, isAdmin } from "./auth";
import { setupWalletRoutes } from "./wallet";
import { setupAdminRoutes } from "./admin";
import { setupAdminAuditRoutes } from "./admin-audit";
import { setupGameTransactions } from "./game-transactions";
import { setupNotionRoutes } from "./notion-routes";
import { SocketService } from "./socket";
import { GameController } from "./games";
import { startExchangeRateUpdates } from "./utils/enhanced-currency-converter";
import { startSessionCleanup, updateUserActivity } from "./session-middleware";
import { userActivityTracker, trackUserActivity } from "./user-activity-tracker";
import { profilePictureUpload, deleteOldProfilePicture, getProfilePictureUrl, DEFAULT_AVATAR_URL, gameFileUpload, gameAssetUpload, getGameAssetUrl } from "./upload-middleware";
import {
  Currency,
  GameType,
  TransactionType,
  AdminActionType,
  UserRole,
} from "@shared/schema";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // Serve uploaded games and assets
  app.use('/uploaded_games', express.static(path.join(process.cwd(), 'uploaded_games')));
  app.use('/uploaded_assets', express.static(path.join(process.cwd(), 'uploaded_assets')));
  
  // Add health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Setup WebSocket server and export it as a global variable
  const socketService = new SocketService(httpServer);
  // Make socket service available to other modules
  (global as any).socketService = socketService;

  // Start periodic exchange rate updates (every 5 minutes)
  const stopExchangeRateUpdates = startExchangeRateUpdates(5);
  // Make the stop function available globally if needed
  (global as any).stopExchangeRateUpdates = stopExchangeRateUpdates;

  // Start automatic session cleanup for user activity tracking
  const stopSessionCleanup = startSessionCleanup();
  // Make the stop function available globally if needed
  (global as any).stopSessionCleanup = stopSessionCleanup;

  // Setup authentication routes
  setupAuth(app);

  // Add enhanced activity tracking middleware for all authenticated API routes
  app.use('/api', trackUserActivity);
  
  // Setup wallet routes
  setupWalletRoutes(app);

  // Setup admin routes
  setupAdminRoutes(app);
  
  // Setup admin audit routes for transparency
  setupAdminAuditRoutes(app);

  // Setup game transaction routes
  setupGameTransactions(app);

  // Setup Notion integration routes
  setupNotionRoutes(app);

  // Setup exchange rate endpoints
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const { enhancedCurrencyConverter } = await import("./utils/enhanced-currency-converter");

      // Get the current rates directly
      const ratesWithMeta = await enhancedCurrencyConverter.getRates();

      // Extract the lastUpdate property and create a properly formatted response
      const { lastUpdate, ...ratesOnly } = ratesWithMeta;

      // Include metadata about the rates
      const response = {
        base: "USD",
        rates: ratesOnly, // This ensures rates is an object with just the currency rates
        lastUpdated: new Date().toISOString(),
        ageInMinutes: lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / 60000) : 0
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Use authenticateJWT middleware for protected routes

  // Game routes
  app.post("/api/games/play", authenticateJWT, async (req, res) => {
    try {
      const { gameType, betAmount, currency, prediction, rollOver, clientSeed, nonce, mineCount, selectedTiles, action } = req.body;
      console.log("Game play request:", { gameType, betAmount, currency, prediction, rollOver, mineCount, selectedTiles, action, gameTypeType: typeof gameType });

      if (!gameType || !betAmount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user is trying to access admin-only games
      const adminOnlyGames = ['dice', 'DICE', 'plinko', 'PLINKO', 'plinko_master', 'PLINKO_MASTER'];
      if (adminOnlyGames.includes(gameType)) {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied. Admin privileges required for this game." });
        }
      }

      const gamePlay = {
        gameType,
        betAmount: parseFloat(betAmount),
        currency,
        prediction,
        rollOver,
        clientSeed,
        nonce,
        mineCount,
        selectedTiles,
        action
      };

      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const result = await GameController.playGame(String(req.user.id), gamePlay);

      // Emit game result to all connected clients via WebSocket
      socketService.broadcastMessage({
        type: "game_result",
        payload: {
          username: req.user.username,
          gameType,
          betAmount,
          currency,
          isWin: result.isWin,
          winAmount: result.winAmount,
          multiplier: result.multiplier,
          gameData: result.gameData,
        },
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Wallet routes
  app.get("/api/wallet/balance", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        balance: user.balance,
        currency: user.currency,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/change-currency", authenticateJWT, async (req, res) => {
    try {
      const { currency } = req.body;

      // Enhanced validation that properly checks against the updated Currency enum
      const validCurrencies = Object.values(Currency);
      console.log(`Validating currency: ${currency}, available currencies: ${validCurrencies.length}`);

      if (!validCurrencies.includes(currency)) {
        console.error(`Invalid currency requested: ${currency}`);
        return res.status(400).json({ error: "Invalid currency" });
      }

      console.log(`Changing currency for user ${req.user.id} to ${currency}`);
      const updatedUser = await storage.updateUserCurrency(
        req.user.id,
        currency,
      );

      res.status(200).json({
        balance: updatedUser.balance,
        currency: updatedUser.currency,
      });
    } catch (error: any) {
      console.error(`Error changing currency: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/wallet/transactions", authenticateJWT, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Game history routes
  app.get("/api/games/history", authenticateJWT, async (req, res) => {
    try {
      const history = await storage.getUserGameHistory(req.user.id);
      res.status(200).json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/games/winners", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const winners = await storage.getRecentWinners(limit);

      // Fetch usernames for each winner
      const winnersWithUsernames = await Promise.all(
        winners.map(async (win) => {
          const user = await storage.getUser(win.userId);
          return {
            ...win,
            username: user?.username || "Unknown",
          };
        }),
      );

      res.status(200).json(winnersWithUsernames);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/user/:userId/balance", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { balance } = req.body;

      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserBalance(
        userId,
        balance.toString(),
      );

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.EDIT_BALANCE,
        userId,
        { oldBalance: user.balance, newBalance: balance },
      );

      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/user/:userId/mute", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isMuted } = req.body;

      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.toggleUserMute(userId, isMuted);

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.MUTE_USER,
        userId,
        { isMuted },
      );

      // Notify via WebSocket if the user is muted
      if (isMuted) {
        socketService.broadcastToUser(userId, {
          type: "user_muted",
          payload: { message: "You have been muted by an admin" },
        });
      }

      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/user/:userId/ban", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isBanned } = req.body;

      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.toggleUserBan(userId, isBanned);

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.BAN_USER,
        userId,
        { isBanned },
      );

      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/game-settings/:gameType", isAdmin, async (req, res) => {
    try {
      const gameTypeStr = req.params.gameType;
      const { winChance, maxMultiplier } = req.body;

      if (!Object.values(GameType).includes(gameTypeStr as GameType)) {
        return res.status(400).json({ message: "Invalid game type" });
      }

      const gameType = gameTypeStr as GameType;

      const updatedSettings = await storage.updateGameSettings(
        gameType,
        parseFloat(winChance),
        parseFloat(maxMultiplier),
        req.user.id,
      );

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.EDIT_GAME_ODDS,
        undefined,
        { gameType, winChance, maxMultiplier },
      );

      res.status(200).json(updatedSettings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/game-settings", isAdmin, async (req, res) => {
    try {
      const slotsSettings = await storage.getGameSettings(GameType.SLOTS);
      const diceSettings = await storage.getGameSettings(GameType.DICE);
      const plinkoSettings = await storage.getGameSettings(GameType.PLINKO);

      res.status(200).json({
        slots: slotsSettings,
        dice: diceSettings,
        plinko: plinkoSettings,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Utility endpoint to check if a user exists (for testing admin setup)
  app.get("/api/user-exists", async (req, res) => {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      res.json({ 
        exists: !!user,
        isAdmin: user ? user.role === UserRole.ADMIN : false,
        username: username
      });
    } catch (error: any) {
      console.error("Error checking user existence:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Advertisement routes
  app.post("/api/admin/advertisements", isAdmin, async (req, res) => {
    try {
      const { script } = req.body;

      const newAd = await storage.createAdvertisement({
        script,
        createdBy: req.user.id,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT,
        undefined,
        { adId: newAd.id },
      );

      res.status(201).json(newAd);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/advertisements", isAdmin, async (req, res) => {
    try {
      const ads = await storage.getAdvertisements();
      res.status(200).json(ads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/advertisements/:id", isAdmin, async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      await storage.deleteAdvertisement(adId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Redirect links routes for admin
  app.post("/api/admin/redirect-links", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { url, intervalMinutes, isActive } = req.body;

      // Validate required fields
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Create the redirect link
      const redirectLink = await storage.createRedirectLink({
        url,
        intervalMinutes: intervalMinutes || 5,
        isActive: isActive ?? true,
        createdBy: req.user.id,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { redirectLinkId: redirectLink.id, url, intervalMinutes }
      );

      res.status(201).json(redirectLink);
    } catch (error: any) {
      console.error("Error creating redirect link:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/redirect-links", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const redirectLinks = await storage.getRedirectLinks();
      res.status(200).json(redirectLinks);
    } catch (error: any) {
      console.error("Error fetching redirect links:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/redirect-links/active", async (req, res) => {
    try {
      const activeLinks = await storage.getActiveRedirectLinks();
      res.status(200).json(activeLinks);
    } catch (error: any) {
      console.error("Error fetching active redirect links:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/redirect-links/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const { url, intervalMinutes, isActive } = req.body;

      const updatedLink = await storage.updateRedirectLink(linkId, {
        url,
        intervalMinutes,
        isActive,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.MODIFY_GAME_SETTINGS, // Using existing enum for now
        undefined,
        { redirectLinkId: linkId, updates: { url, intervalMinutes, isActive } }
      );

      res.status(200).json(updatedLink);
    } catch (error: any) {
      console.error("Error updating redirect link:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/redirect-links/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const linkId = parseInt(req.params.id);
      await storage.deleteRedirectLink(linkId);

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { redirectLinkId: linkId, action: "delete" }
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting redirect link:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Profile picture upload endpoints
  app.post("/api/profile/upload-picture", authenticateJWT, profilePictureUpload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete old profile picture if exists
      if (user.profilePicture) {
        deleteOldProfilePicture(user.profilePicture);
      }

      // Update user with new profile picture filename
      const updatedUser = await storage.updateUserProfilePicture(req.user.id, req.file.filename);

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        profilePictureUrl: getProfilePictureUrl(req.file.filename),
        user: updatedUser
      });
    } catch (error: any) {
      // Clean up uploaded file if database update fails
      if (req.file) {
        deleteOldProfilePicture(req.file.filename);
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/profile/delete-picture", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.profilePicture) {
        deleteOldProfilePicture(user.profilePicture);
        await storage.updateUserProfilePicture(req.user.id, null);
      }

      res.status(200).json({
        message: "Profile picture deleted successfully",
        profilePictureUrl: DEFAULT_AVATAR_URL
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/profile/picture-url", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const profilePictureUrl = user.profilePicture 
        ? getProfilePictureUrl(user.profilePicture)
        : DEFAULT_AVATAR_URL;

      res.status(200).json({ profilePictureUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", authenticateJWT, async (req, res) => {
    try {
      const { email, phone, currentPassword, newPassword } = req.body;
      const user = await storage.getUser(String(req.user.id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If trying to change password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to change password" });
        }
        
        // Verify current password (simple string comparison for mock storage)
        if (user.password !== currentPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Update user profile
      const updatedData: any = {};
      if (email && email !== user.email) updatedData.email = email;
      if (phone && phone !== user.phone) updatedData.phone = phone;
      if (newPassword) updatedData.password = newPassword;

      if (Object.keys(updatedData).length > 0) {
        await storage.updateUser(String(req.user.id), updatedData);
      }

      const updatedUser = await storage.getUser(String(req.user.id));
      res.status(200).json({ 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user profile stats
  app.get("/api/user/profile-stats", authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user statistics
      const transactions = await storage.getUserTransactions(req.user.id);
      const gameHistory = await storage.getUserGameHistory(req.user.id);
      
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalBets = transactions
        .filter(t => t.type === 'bet')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalWins = transactions
        .filter(t => t.type === 'win')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Get accurate referral statistics
      const userReferrals = await storage.getUserReferrals(req.user.id);
      const activeReferrals = userReferrals.filter(ref => ref.status === "active" || ref.status === "rewarded").length;
      const rewardedReferrals = userReferrals.filter(ref => ref.status === "rewarded").length;
      const actualReferralEarnings = userReferrals.reduce((sum, ref) => sum + parseFloat(ref.totalEarnings || "0"), 0);

      const stats = {
        totalDeposits: totalDeposits.toFixed(2),
        totalWithdrawals: totalWithdrawals.toFixed(2),
        totalBets: totalBets.toFixed(2),
        totalWins: totalWins.toFixed(2),
        totalGames: gameHistory.length,
        winRate: gameHistory.length > 0 ? 
          ((gameHistory.filter(g => g.result === 'win').length / gameHistory.length) * 100).toFixed(1) : '0.0',
        memberSince: user.createdAt,
        lastLogin: user.lastLogin,
        referralCode: user.referralCode,
        totalReferrals: userReferrals.length,
        activeReferrals: activeReferrals,
        rewardedReferrals: rewardedReferrals,
        referralEarnings: actualReferralEarnings.toFixed(2)
      };

      res.status(200).json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/advertisements/:type?", async (req: Request, res: Response) => {
  try {
    const type = req.params.type || "all";
    const advertisements = await storage.getAdvertisements() || [];

    if (type === "default") {
      const defaultAd = advertisements.find(ad => ad.isDefault);
      // Always return an object, even if empty
      return res.json(defaultAd || { isDefault: true, content: "", id: 0, createdAt: new Date() });
    }

    return res.json(advertisements);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return res.status(500).json({ error: "Failed to fetch advertisements" });
  }
});

  // Referral system routes
  app.post("/api/referrals/generate-code", authenticateJWT, async (req, res) => {
    try {
      const referralCode = await storage.generateReferralCode(req.user.id);
      res.json({ referralCode });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/my-referrals", authenticateJWT, async (req, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.user.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/settings", authenticateJWT, async (req, res) => {
    try {
      const settings = await storage.getReferralSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/referrals/use-code", authenticateJWT, async (req, res) => {
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      if (referrer.id === req.user.id) {
        return res.status(400).json({ message: "Cannot use your own referral code" });
      }

      // Check if user already has a referrer
      const currentUser = await storage.getUser(String(req.user.id));
      if (currentUser?.referredBy) {
        return res.status(400).json({ message: "You have already used a referral code" });
      }

      // Check if referrer has already reached the maximum number of referrals
      const referrerReferrals = await storage.getUserReferrals(referrer.id);
      const settings = await storage.getReferralSettings();
      
      if (referrerReferrals.length >= settings.maxReferralsPerUser) {
        return res.status(400).json({ 
          message: `This referral code has reached its maximum limit of ${settings.maxReferralsPerUser} referrals` 
        });
      }

      // Create referral relationship
      const referral = await storage.createReferral(referrer.id, req.user.id, referralCode);
      
      // Process the referral bonus immediately
      await storage.processReferralBonus(req.user.id);

      res.json({ 
        message: "Referral code applied successfully! Both you and your referrer have received 30 BDT bonus.",
        referral 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/my-referrals", authenticateJWT, async (req, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.user.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/settings", authenticateJWT, async (req, res) => {
    try {
      const settings = await storage.getReferralSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/referrals/settings", isAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateReferralSettings({
        ...updates,
        updatedBy: req.user!.id
      });
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User notification routes
  app.get("/api/user/notifications", authenticateJWT, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/notifications/:id/read", authenticateJWT, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(req.user.id, notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Temporary admin setup route - only for development
  app.post("/api/admin-setup", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Attempting to promote user ${user.username} to admin...`);

      // Create a hardcoded password for shadowHimel2 admin
      if (user.username === 'shadowHimel2') {
        // Direct database update to make user an admin with proper password
        const updatedUser = {
          ...user,
          role: UserRole.ADMIN,
          password: 'himel1122', // Raw password for admin
        };

        // Update in storage using proper interface
        await storage.updateUserRole(String(userId), UserRole.ADMIN);
        console.log(`User ${user.username} promoted to admin`);

        res.status(200).json({ 
          success: true,
          message: "User promoted to admin",
          username: user.username,
          role: updatedUser.role
        });
      } else {
        return res.status(403).json({ message: "Only shadowHimel2 can be promoted" });
      }
    } catch (error: any) {
      console.error("Error in admin setup:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Deposit/Withdrawal routes
  app.post("/api/wallet/deposit", authenticateJWT, async (req, res) => {
    try {
      const { amount, currency } = req.body;

      if (!amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // For development/testing, auto-approve the deposit
      try {
        // Add funds directly to user's account
        const user = await storage.getUser(String(req.user.id));
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const newBalance = (
          parseFloat(user.balance) + parseFloat(amount)
        ).toString();
        await storage.updateUserBalance(String(req.user.id), newBalance);

        // Create deposit transaction
        await storage.createTransaction({
          userId: req.user.id,
          amount: amount.toString(),
          type: TransactionType.DEPOSIT,
          currency,
        });

        return res.status(200).json({
          success: true,
          message: `Successfully deposited ${amount} ${currency}`,
          newBalance,
        });
      } catch (err) {
        console.error("Auto-deposit error:", err);
      }

      // If auto-deposit fails, fall back to WhatsApp info
      res.status(200).json({
        whatsappNumber: "01989379895",
        message: `I want to deposit ${amount} ${currency}. My username is ${req.user.username}.`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallet/withdraw", authenticateJWT, async (req, res) => {
    try {
      const { amount, currency } = req.body;

      if (!amount || !currency) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBalance = parseFloat(user.balance);

      if (userBalance < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // In a real scenario, this would create a pending withdrawal
      // For this implementation, we'll just return WhatsApp info
      res.status(200).json({
        whatsappNumber: "01989379895",
        message: `I want to withdraw ${amount} ${currency}. My username is ${req.user.username}.`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // For manual admin approval of deposits
  app.post("/api/admin/approve-deposit", isAdmin, async (req, res) => {
    try {
      const { userId, amount, currency } = req.body;

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create deposit transaction
      const transaction = await storage.createTransaction({
        userId: parseInt(userId),
        amount: amount.toString(),
        type: TransactionType.DEPOSIT,
        currency,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.APPROVE_DEPOSIT,
        parseInt(userId),
        { amount, currency },
      );

      // Notify user via WebSocket
      socketService.broadcastToUser(parseInt(userId), {
        type: "deposit_approved",
        payload: { amount, currency },
      });

      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // For manual admin approval of withdrawals
  app.post("/api/admin/approve-withdrawal", isAdmin, async (req, res) => {
    try {
      const { userId, amount, currency } = req.body;

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userBalance = parseFloat(user.balance);

      if (userBalance < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create withdrawal transaction
      const transaction = await storage.createTransaction({
        userId: parseInt(userId),
        amount: amount.toString(),
        type: TransactionType.WITHDRAWAL,
        currency,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.APPROVE_WITHDRAWAL,
        parseInt(userId),
        { amount, currency },
      );

      // Notify user via WebSocket
      socketService.broadcastToUser(parseInt(userId), {
        type: "withdrawal_approved",
        payload: { amount, currency },
      });

      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // For demo purposes, we'll use user ID 1
  const DEMO_USER_ID = 1;

  // Dice game routes - 100-sided die with provably fair system (Admin only)
  app.post("/api/dice/roll", authenticateJWT, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { bet, prediction, rollOver, clientSeed, nonce } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (!bet || bet <= 0) {
        return res.status(400).json({ message: "Invalid bet amount" });
      }
      
      if (!prediction || prediction < 2 || prediction > 98) {
        return res.status(400).json({ message: "Prediction must be between 2 and 98" });
      }

      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const betAmount = parseFloat(bet);
      const userBalance = parseFloat(user.balance);

      if (userBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Use the GameController to process the dice game with proper house edge
      const gameResult = await GameController.playGame(userId, {
        gameType: "DICE" as GameType,
        betAmount,
        currency: user.currency,
        prediction,
        rollOver: rollOver !== undefined ? rollOver : true,
        clientSeed: clientSeed || 'default',
        nonce: nonce || 1
      });

      // Return the result in the expected format
      res.json({
        roll: gameResult.gameData.roll,
        result: gameResult.isWin ? 'win' : 'lose',
        payout: gameResult.winAmount || 0,
        multiplier: gameResult.multiplier || 0,
        prediction: gameResult.gameData.prediction,
        rollOver: gameResult.gameData.rollOver,
        clientSeed: gameResult.gameData.clientSeed,
        serverSeed: gameResult.gameData.serverSeed,
        nonce: gameResult.gameData.nonce
      });
    } catch (error: any) {
      console.error("Dice game error:", error);
      res.status(500).json({ message: error.message || "Failed to roll dice" });
    }
  });

  // Plinko game routes  


  // Game settings endpoint (for admin panel)
  app.post("/api/admin/games/:gameType/settings", isAdmin, async (req, res) => {
    try {
      const { gameType } = req.params;
      const { winChance, maxMultiplier } = req.body;

      // Validate inputs
      if (!gameType || !["slots", "dice", "plinko"].includes(gameType)) {
        return res.status(400).json({ message: "Invalid game type" });
      }

      if (typeof winChance !== 'number' || winChance < 1 || winChance > 99) {
        return res.status(400).json({ message: "Win chance must be between 1 and 99" });
      }

      if (typeof maxMultiplier !== 'number' || maxMultiplier < 1) {
        return res.status(400).json({ message: "Max multiplier must be at least 1" });
      }

      // Update the game settings in storage
      const updatedSettings = await storage.updateGameSettings(
        gameType as GameType,
        winChance,
        maxMultiplier,
        req.user.id
      );

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.EDIT_GAME_ODDS,
        undefined,
        { gameType, winChance, maxMultiplier }
      );

      // Return the updated settings
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating game settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Custom games routes for admin
  app.post("/api/admin/games/add", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { name, type, htmlContent, winChance, maxMultiplier, minBet, maxBet, description } = req.body;

      // Validate required fields
      if (!name || !htmlContent) {
        return res.status(400).json({ message: "Game name and HTML content are required" });
      }

      // Create the custom game
      const customGame = await storage.createCustomGame({
        name,
        type: type || "html",
        htmlContent,
        winChance: winChance || 50,
        maxMultiplier: maxMultiplier || 2.0,
        minBet: minBet || "1",
        maxBet: maxBet || "1000",
        description,
        createdBy: req.user.id,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { gameId: customGame.id, gameName: name }
      );

      res.status(201).json(customGame);
    } catch (error: any) {
      console.error("Error adding custom game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all custom games (for games page)
  app.get("/api/games", async (req, res) => {
    try {
      const customGames = await storage.getCustomGames();
      res.json(customGames);
    } catch (error: any) {
      console.error("Error fetching custom games:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific custom game by ID
  app.get("/api/games/custom/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getCustomGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json(game);
    } catch (error: any) {
      console.error("Error fetching custom game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Serve game files with proper content types
  app.get("/api/games/play/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const game = await storage.getCustomGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (!game.isApproved) {
        return res.status(403).json({ message: "Game not approved for play" });
      }

      // If it's an HTML game, serve the HTML content directly
      if (game.type === 'html' && game.htmlContent) {
        res.setHeader('Content-Type', 'text/html');
        res.send(game.htmlContent);
        return;
      }

      // If it's a file-based game, serve the file
      if (game.filePath) {
        const filePath = path.join(process.cwd(), 'uploaded_games', game.filePath);
        const extension = path.extname(game.filePath).toLowerCase();
        
        // Set appropriate content type
        switch (extension) {
          case '.html':
          case '.htm':
            res.setHeader('Content-Type', 'text/html');
            break;
          case '.js':
            res.setHeader('Content-Type', 'application/javascript');
            break;
          case '.css':
            res.setHeader('Content-Type', 'text/css');
            break;
          case '.json':
            res.setHeader('Content-Type', 'application/json');
            break;
          default:
            res.setHeader('Content-Type', 'text/plain');
        }
        
        res.sendFile(filePath);
        return;
      }

      res.status(404).json({ message: "Game content not found" });
    } catch (error: any) {
      console.error("Error serving game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/games", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const customGames = await storage.getCustomGames();
      res.status(200).json(customGames);
    } catch (error: any) {
      console.error("Error fetching custom games:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/games/custom", async (req, res) => {
    try {
      const customGames = await storage.getCustomGames();
      res.status(200).json(customGames);
    } catch (error: any) {
      console.error("Error fetching custom games:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add main games endpoint that the frontend is calling
  app.get("/api/games", async (req, res) => {
    try {
      const customGames = await storage.getCustomGames();
      res.status(200).json(customGames);
    } catch (error: any) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // File upload route for game files
  app.post("/api/admin/games/upload", authenticateJWT, isAdmin, gameFileUpload.array('gameFiles'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { name, category, description, instructions, winChance, maxMultiplier, minBet, maxBet, tags } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      if (!name) {
        return res.status(400).json({ message: "Game name is required" });
      }

      // Process uploaded files
      const mainFile = files[0]; // Primary game file
      const additionalFiles = files.slice(1); // Supporting files
      
      // Read the main file content
      const gameUploadDir = path.join(process.cwd(), 'uploaded_games');
      const mainFilePath = path.join(gameUploadDir, mainFile.filename);
      const gameCode = fs.readFileSync(mainFilePath, 'utf8');
      
      // Determine game type from file extension
      const gameType = path.extname(mainFile.originalname).toLowerCase().substring(1) || 'html';
      
      // Store additional files info
      const additionalFilesInfo = additionalFiles.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: path.join(gameUploadDir, file.filename)
      }));

      // Create the custom game with file information
      const customGame = await storage.createCustomGame({
        name,
        type: gameType,
        htmlContent: gameType === 'html' ? gameCode : null,
        filePath: mainFile.filename,
        originalFileName: mainFile.originalname,
        fileExtension: path.extname(mainFile.originalname).toLowerCase(),
        gameCode: gameCode,
        category: category || "casino",
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        winChance: winChance ? parseFloat(winChance) : 50,
        maxMultiplier: maxMultiplier ? parseFloat(maxMultiplier) : 2.0,
        minBet: minBet || "1",
        maxBet: maxBet || "1000",
        description,
        instructions,
        createdBy: req.user.id,
      });

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { 
          gameId: customGame.id, 
          gameName: name, 
          fileType: gameType,
          filesCount: files.length
        }
      );

      res.status(201).json({
        game: customGame,
        uploadedFiles: files.map(f => f.filename),
        additionalFiles: additionalFilesInfo
      });
    } catch (error: any) {
      console.error("Error uploading game files:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upload thumbnail for game
  app.post("/api/admin/games/:id/thumbnail", authenticateJWT, isAdmin, gameAssetUpload.single('thumbnail'), async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No thumbnail file uploaded" });
      }

      // Update game with thumbnail URL
      const updatedGame = await storage.updateCustomGame(gameId, {
        thumbnailUrl: getGameAssetUrl(file.filename)
      });

      res.status(200).json({
        thumbnailUrl: updatedGame.thumbnailUrl,
        message: "Thumbnail uploaded successfully"
      });
    } catch (error: any) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Approve a game
  app.post("/api/admin/games/:id/approve", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const approvedGame = await storage.approveGame(gameId);
      
      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { gameId, action: "approved" }
      );

      res.status(200).json(approvedGame);
    } catch (error: any) {
      console.error("Error approving game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Search games
  app.get("/api/admin/games/search", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const games = await storage.searchGames(q);
      res.status(200).json(games);
    } catch (error: any) {
      console.error("Error searching games:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get games by category
  app.get("/api/admin/games/category/:category", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      const games = await storage.getGamesByCategory(category);
      res.status(200).json(games);
    } catch (error: any) {
      console.error("Error fetching games by category:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a game
  app.delete("/api/admin/games/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      await storage.deleteCustomGame(gameId);
      
      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { gameId, action: "deleted" }
      );

      res.status(200).json({ message: "Game deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Deposit money route
  app.post("/api/wallet/deposit", authenticateJWT, async (req, res) => {
    try {
      const { amount, paymentMethod, paymentMethodName, accountNumber } = req.body;

      if (!amount || !paymentMethod || !accountNumber) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const depositAmount = parseFloat(amount);
      if (depositAmount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }

      // Get current user
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate new balance (in the user's currency)
      const currentBalance = parseFloat(user.balance);
      const newBalance = currentBalance + depositAmount;

      // Update user balance
      await storage.updateUserBalance(String(req.user.id), newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        type: "deposit" as any,
        amount: depositAmount.toString(),
        currency: user.currency,
        status: "completed",
        description: `Deposit via ${paymentMethodName}`,
        paymentMethod,
        paymentDetails: {
          accountNumber,
          paymentMethodName
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully deposited ${depositAmount} ${user.currency}`,
        newBalance: newBalance.toString(),
        currency: user.currency
      });

    } catch (error: any) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: error.message || "Deposit failed" });
    }
  });

  // Withdrawal money route
  app.post("/api/wallet/withdrawal", authenticateJWT, async (req, res) => {
    try {
      const { amount, paymentMethod, paymentMethodName, accountNumber, transactionId } = req.body;

      if (!amount || !paymentMethod || !accountNumber) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const withdrawalAmount = parseFloat(amount);
      if (withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }

      // Get current user
      const user = await storage.getUser(String(req.user.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      
      // Check if user has sufficient balance
      if (currentBalance < withdrawalAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Calculate new balance
      const newBalance = currentBalance - withdrawalAmount;

      // Update user balance
      await storage.updateUserBalance(String(req.user.id), newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        type: "withdrawal" as any,
        amount: withdrawalAmount.toString(),
        currency: user.currency,
        status: "completed",
        description: `Withdrawal to ${paymentMethodName}`,
        paymentMethod,
        paymentDetails: {
          accountNumber,
          paymentMethodName,
          transactionId
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully withdrew ${withdrawalAmount} ${user.currency}`,
        newBalance: newBalance.toString(),
        currency: user.currency
      });

    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: error.message || "Withdrawal failed" });
    }
  });

  app.get("/api/games/custom/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const customGame = await storage.getCustomGame(gameId);
      
      if (!customGame || !customGame.isActive) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.status(200).json(customGame);
    } catch (error: any) {
      console.error("Error fetching custom game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/games/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      await storage.deleteCustomGame(gameId);

      // Log admin action
      await storage.logAdminAction(
        req.user.id,
        AdminActionType.ADD_ADVERTISEMENT, // Using existing enum for now
        undefined,
        { gameId, action: "delete" }
      );

      res.status(200).json({ message: "Game deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting custom game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update custom game content
  app.post("/api/admin/games/:id/update", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { htmlContent } = req.body;

      if (!htmlContent) {
        return res.status(400).json({ message: "HTML content is required" });
      }

      const updatedGame = await storage.updateCustomGame(gameId, { htmlContent });
      
      res.status(200).json(updatedGame);
    } catch (error: any) {
      console.error("Error updating custom game:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // HTML Game betting endpoints
  app.post("/api/games/html-game/bet", authenticateJWT, async (req, res) => {
    try {
      const { gameId, betAmount, gameResult } = req.body;
      const userId = req.user!.id;

      // Get the custom game
      const game = await storage.getCustomGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Validate bet amount
      if (betAmount < Number(game.minBet) || betAmount > Number(game.maxBet)) {
        return res.status(400).json({ message: "Invalid bet amount" });
      }

      // Get user's current balance
      const user = await storage.getUser(String(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      if (currentBalance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct bet amount first
      const newBalance = currentBalance - betAmount;
      await storage.updateUserBalance(userId, newBalance.toString());

      // Record the bet transaction
      await storage.createTransaction({
        userId: userId,
        amount: betAmount.toString(),
        type: TransactionType.BET,
        currency: user.currency,
        status: "completed",
        metadata: { gameType: "html_game", gameId: gameId, gameName: game.name }
      });

      // Determine game outcome
      let won = false;
      let multiplier = 1.0;
      let winAmount = 0;

      if (gameResult !== null && typeof gameResult === 'boolean') {
        // Use provided game result (for games that calculate their own outcome)
        won = gameResult;
      } else {
        // Use the game's configured win chance for random outcome
        const randomValue = Math.random() * 100;
        won = randomValue < game.winChance;
      }

      if (won) {
        // Calculate multiplier based on win chance (higher chance = lower multiplier)
        const baseMultiplier = Math.min(game.maxMultiplier, 95 / game.winChance);
        multiplier = Math.max(1.1, baseMultiplier);
        winAmount = Math.floor(betAmount * multiplier);

        // Add winnings to balance
        const finalBalance = newBalance + winAmount;
        await storage.updateUserBalance(userId, finalBalance.toString());

        // Record win transaction
        await storage.createTransaction({
          userId: userId,
          amount: winAmount.toString(),
          type: TransactionType.WIN,
          currency: user.currency,
          status: "completed",
          metadata: { 
            gameType: "html_game", 
            gameId: gameId, 
            gameName: game.name,
            multiplier: multiplier,
            betAmount: betAmount
          }
        });

        // Record game history
        await storage.createGameHistory(
          {
            gameType: "html_game" as any,
            betAmount: betAmount,
            currency: user.currency
          },
          userId,
          true,
          winAmount.toString(),
          multiplier,
          { gameId: gameId, gameName: game.name }
        );
      } else {
        // Record loss in game history
        await storage.createGameHistory(
          {
            gameType: "html_game" as any,
            betAmount: betAmount,
            currency: user.currency
          },
          userId,
          false,
          "0",
          0,
          { gameId: gameId, gameName: game.name }
        );
      }

      res.json({
        success: true,
        won: won,
        winAmount: winAmount,
        multiplier: multiplier,
        message: won ? "Congratulations! You won!" : "Better luck next time!",
        newBalance: won ? newBalance + winAmount : newBalance
      });

    } catch (error: any) {
      console.error("Error processing HTML game bet:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Chat messages route
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getRecentChatMessages(50);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  return httpServer;
}