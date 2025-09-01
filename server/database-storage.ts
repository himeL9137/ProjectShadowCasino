import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  transactions,
  gameHistory,
  chatLogs,
  advertisements,
  gameSettings,
  adminActions,
  customGames,
  referrals,
  referralSettings,
  redirectLinks,
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type GameHistory,
  type GamePlay,
  type ChatMessage,
  type InsertChatMessage,
  type Advertisement,
  type InsertAdvertisement,
  type GameSetting,
  type CustomGame,
  type InsertCustomGame,
  type Referral,
  type ReferralSettings,
  type RedirectLink,
  type InsertRedirectLink,
  type UpdateRedirectLink,
  Currency,
  UserRole,
  TransactionType,
  GameType,
  AdminActionType,
} from "@shared/schema";
import { IStorage } from "./storage";
import { enhancedCurrencyConverter } from "./utils/enhanced-currency-converter";
import MemoryStore from "memorystore";
import session from "express-session";

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize memory store for sessions
    const MemoryStoreConstructor = MemoryStore(session);
    this.sessionStore = new MemoryStoreConstructor({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Initialize admin users and game settings
    this.initializeAdminUsers();
    this.initializeGameSettings();
  }
  
  private async initializeAdminUsers() {
    try {
      console.log("Initializing admin users in database...");
      
      // Note: Passwords will be hashed when users log in through the auth system
      // For now, we store temporary passwords that match the auth checks
      
      // Admin user: shadowHimel - password: admin1122
      const shadowHimel = await this.getUserByUsername("shadowHimel");
      if (!shadowHimel) {
        const himelUser = await this.createUser({
          id: "1",
          username: "shadowHimel",
          email: "shadow@example.com",
          phone: "01234567890",
          password: "temporary-will-be-hashed-on-login",
          rawPassword: "admin1122",
          balance: "61029.00",
          currency: Currency.BDT,
          role: UserRole.ADMIN,
        });
        console.log(`Created shadowHimel with balance: ${himelUser.balance} ${himelUser.currency}`);
      } else if (shadowHimel.balance !== "61029.00" || shadowHimel.currency !== Currency.BDT) {
        await this.updateUserBalance(shadowHimel.id, "61029.00");
        await this.updateUserCurrency(shadowHimel.id, Currency.BDT);
        console.log(`Updated shadowHimel balance to 61029.00 BDT`);
      }
      
      // Admin user: shadowTalha - password: talha1122
      const shadowTalha = await this.getUserByUsername("shadowTalha");
      if (!shadowTalha) {
        const talhaUser = await this.createUser({
          id: "4",
          username: "shadowTalha",
          email: "shadowtalha@example.com",
          phone: "01234567891",
          password: "temporary-will-be-hashed-on-login",
          rawPassword: "talha1122",
          balance: "61029.00",
          currency: Currency.BDT,
          role: UserRole.ADMIN,
        });
        console.log(`Created shadowTalha with balance: ${talhaUser.balance} ${talhaUser.currency}`);
      } else if (shadowTalha.balance !== "61029.00" || shadowTalha.currency !== Currency.BDT) {
        await this.updateUserBalance(shadowTalha.id, "61029.00");
        await this.updateUserCurrency(shadowTalha.id, Currency.BDT);
        console.log(`Updated shadowTalha balance to 61029.00 BDT`);
      }
      
      // Admin user: shadowKaran - password: karan1122
      const shadowKaran = await this.getUserByUsername("shadowKaran");
      if (!shadowKaran) {
        const karanUser = await this.createUser({
          id: "5",
          username: "shadowKaran",
          email: "shadowkaran@example.com",
          phone: "01234567892",
          password: "temporary-will-be-hashed-on-login",
          rawPassword: "karan1122",
          balance: "61029.00",
          currency: Currency.BDT,
          role: UserRole.ADMIN,
        });
        console.log(`Created shadowKaran with balance: ${karanUser.balance} ${karanUser.currency}`);
      } else if (shadowKaran.balance !== "61029.00" || shadowKaran.currency !== Currency.BDT) {
        await this.updateUserBalance(shadowKaran.id, "61029.00");
        await this.updateUserCurrency(shadowKaran.id, Currency.BDT);
        console.log(`Updated shadowKaran balance to 61029.00 BDT`);
      }
      
      console.log("✅ Admin users initialized successfully");
    } catch (error) {
      console.error("Error initializing admin users:", error);
    }
  }
  
  private async initializeGameSettings() {
    try {
      console.log("Initializing default game settings...");
      
      const gameTypes = [GameType.SLOTS, GameType.DICE, GameType.PLINKO, GameType.PLINKO_MASTER];
      
      for (const gameType of gameTypes) {
        const existingSettings = await this.getGameSettings(gameType);
        if (!existingSettings) {
          // Don't set updatedBy during initialization as users might not exist yet
          const [settings] = await db
            .insert(gameSettings)
            .values({
              gameType,
              winChance: 45,
              maxMultiplier: 1.1,
              lastUpdated: new Date(),
            })
            .returning();
          console.log(`Created default settings for ${gameType}`);
        }
      }
      
      console.log("✅ Game settings initialized successfully");
    } catch (error) {
      console.error("Error initializing game settings:", error);
    }
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id: insertUser.id || crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }



  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserCurrency(userId: string, currency: Currency): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ currency, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserProfilePicture(userId: string, filename: string | null): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ profilePicture: filename, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async toggleUserMute(userId: string, isMuted: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isMuted, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async toggleUserBan(userId: string, isBanned: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isBanned, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }



  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        createdAt: new Date(),
      })
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  // Game operations
  async createGameHistory(
    gamePlay: GamePlay,
    userId: string,
    isWin: boolean,
    winAmount?: string,
    multiplier?: number,
    gameData?: any,
  ): Promise<GameHistory> {
    const [history] = await db
      .insert(gameHistory)
      .values({
        userId,
        gameType: gamePlay.gameType,
        betAmount: gamePlay.betAmount.toString(),
        winAmount: winAmount || null,
        multiplier: multiplier || null,
        isWin,
        currency: gamePlay.currency,
        gameData,
        createdAt: new Date(),
      })
      .returning();
    return history;
  }

  async getUserGameHistory(userId: string): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(desc(gameHistory.createdAt));
  }

  async getRecentWinners(limit: number = 10): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.isWin, true))
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit);
  }

  // Chat operations
  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatLogs)
      .values({
        ...chatMessage,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatLogs)
      .orderBy(desc(chatLogs.createdAt))
      .limit(limit);
  }

  // Advertisement operations
  async createAdvertisement(advertisement: InsertAdvertisement): Promise<Advertisement> {
    const [ad] = await db
      .insert(advertisements)
      .values({
        ...advertisement,
        createdAt: new Date(),
      })
      .returning();
    return ad;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .orderBy(desc(advertisements.createdAt));
  }

  async deleteAdvertisement(id: number): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  // Game settings operations
  async getGameSettings(gameType: GameType): Promise<GameSetting | undefined> {
    const [settings] = await db
      .select()
      .from(gameSettings)
      .where(eq(gameSettings.gameType, gameType));
    return settings || undefined;
  }

  async updateGameSettings(
    gameType: GameType,
    winChance: number,
    maxMultiplier: number,
    updatedBy: string,
  ): Promise<GameSetting> {
    const [settings] = await db
      .insert(gameSettings)
      .values({
        gameType,
        winChance,
        maxMultiplier,
        updatedBy: updatedBy,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: gameSettings.gameType,
        set: {
          winChance,
          maxMultiplier,
          updatedBy: updatedBy,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Admin operations - Enhanced with comprehensive tracking
  async logAdminAction(
    adminId: string,
    actionType: AdminActionType,
    targetUserId?: string,
    details?: any,
  ): Promise<void> {
    await db.insert(adminActions).values({
      adminId,
      action: actionType,
      targetUserId,
      details,
      createdAt: new Date(),
    });

    // Log to console for immediate visibility
    console.log(`🔐 Admin Action Logged: ${actionType} by ${adminId}`, {
      targetUserId,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Get admin actions for transparency
  async getAdminActions(limit: number = 100): Promise<any[]> {
    return await db
      .select({
        id: adminActions.id,
        adminId: adminActions.adminId,
        adminUsername: users.username,
        action: adminActions.action,
        targetUserId: adminActions.targetUserId,
        details: adminActions.details,
        createdAt: adminActions.createdAt,
      })
      .from(adminActions)
      .leftJoin(users, eq(adminActions.adminId, users.id))
      .orderBy(desc(adminActions.createdAt))
      .limit(limit);
  }

  // Get admin actions for a specific admin
  async getAdminActionsByAdmin(adminId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select({
        id: adminActions.id,
        adminId: adminActions.adminId,
        adminUsername: users.username,
        action: adminActions.action,
        targetUserId: adminActions.targetUserId,
        details: adminActions.details,
        createdAt: adminActions.createdAt,
      })
      .from(adminActions)
      .leftJoin(users, eq(adminActions.adminId, users.id))
      .where(eq(adminActions.adminId, adminId))
      .orderBy(desc(adminActions.createdAt))
      .limit(limit);
  }

  // Get admin actions for a specific target user
  async getAdminActionsByTarget(targetUserId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select({
        id: adminActions.id,
        adminId: adminActions.adminId,
        adminUsername: users.username,
        action: adminActions.action,
        targetUserId: adminActions.targetUserId,
        details: adminActions.details,
        createdAt: adminActions.createdAt,
      })
      .from(adminActions)
      .leftJoin(users, eq(adminActions.adminId, users.id))
      .where(eq(adminActions.targetUserId, targetUserId))
      .orderBy(desc(adminActions.createdAt))
      .limit(limit);
  }

  // Get admin action statistics
  async getAdminActionStats(): Promise<any> {
    const totalActions = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminActions);

    const actionsByType = await db
      .select({
        action: adminActions.action,
        count: sql<number>`count(*)`,
      })
      .from(adminActions)
      .groupBy(adminActions.action);

    const actionsByAdmin = await db
      .select({
        adminId: adminActions.adminId,
        adminUsername: users.username,
        count: sql<number>`count(*)`,
      })
      .from(adminActions)
      .leftJoin(users, eq(adminActions.adminId, users.id))
      .groupBy(adminActions.adminId, users.username);

    return {
      totalActions: totalActions[0]?.count || 0,
      actionsByType,
      actionsByAdmin,
    };
  }

  // Notification operations
  async addUserNotification(userId: string, message: string, type: string): Promise<void> {
    // For now, we'll just log notifications
    console.log(`📢 Notification for user ${userId} (${type}): ${message}`);
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    // Return empty array for now
    return [];
  }

  async markNotificationAsRead(userId: string, notificationId: number): Promise<void> {
    // No-op for now
  }

  // Custom games operations
  async createCustomGame(game: InsertCustomGame): Promise<CustomGame> {
    const [newGame] = await db
      .insert(customGames)
      .values({
        ...game,
        createdAt: new Date(),
      })
      .returning();
    return newGame;
  }

  async getCustomGames(): Promise<CustomGame[]> {
    return await db
      .select()
      .from(customGames)
      .where(eq(customGames.isActive, true))
      .orderBy(desc(customGames.createdAt));
  }

  async getCustomGame(id: number): Promise<CustomGame | undefined> {
    const [game] = await db
      .select()
      .from(customGames)
      .where(and(eq(customGames.id, id), eq(customGames.isActive, true)));
    return game || undefined;
  }

  async updateCustomGame(id: number, updates: Partial<CustomGame>): Promise<CustomGame> {
    const [updatedGame] = await db
      .update(customGames)
      .set(updates)
      .where(eq(customGames.id, id))
      .returning();
    return updatedGame;
  }

  async deleteCustomGame(id: number): Promise<void> {
    await db
      .update(customGames)
      .set({ isActive: false })
      .where(eq(customGames.id, id));
  }

  // Referral system operations
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    if (user.referralCode) {
      return user.referralCode;
    }

    let referralCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `${(user.username || "USER").substring(0, 4).toUpperCase()}${randomSuffix}`;
      attempts++;
      
      if (attempts > maxAttempts) {
        referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        break;
      }
    } while (await this.getUserByReferralCode(referralCode));

    await db
      .update(users)
      .set({ referralCode })
      .where(eq(users.id, userId));

    return referralCode;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));
    return user || undefined;
  }

  async createReferral(referrerId: string, refereeId: string, referralCode: string): Promise<Referral> {
    const referralSettings = await this.getReferralSettings();
    
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: referrerId,
        refereeId: refereeId,
        referralCode,
        bonusAmount: referralSettings.signupBonus,
        commissionRate: referralSettings.commissionRate,
        status: "pending",
        totalEarnings: "0",
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(users)
      .set({ referredBy: referrerId })
      .where(eq(users.id, refereeId));

    return referral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
  }

  async updateReferralStatus(referralId: number, status: string): Promise<Referral> {
    const [referral] = await db
      .update(referrals)
      .set({ status })
      .where(eq(referrals.id, referralId))
      .returning();
    return referral;
  }

  async addReferralEarnings(referralId: number, amount: string): Promise<void> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, referralId));

    if (!referral) throw new Error("Referral not found");

    const currentEarnings = parseFloat(referral.totalEarnings);
    const newEarnings = currentEarnings + parseFloat(amount);
    
    await db
      .update(referrals)
      .set({ 
        totalEarnings: newEarnings.toString(),
        status: "active"
      })
      .where(eq(referrals.id, referralId));

    const referrer = await this.getUser(referral.referrerId.toString());
    if (referrer) {
      const referrerEarnings = parseFloat(referrer.referralEarnings);
      await db
        .update(users)
        .set({ 
          referralEarnings: (referrerEarnings + parseFloat(amount)).toString()
        })
        .where(eq(users.id, referral.referrerId.toString()));
    }
  }

  async getReferralSettings(): Promise<ReferralSettings> {
    const [settings] = await db.select().from(referralSettings).limit(1);
    return settings || {
      id: 1,
      signupBonus: "30",
      commissionRate: 5.0,
      minimumDeposit: "0",
      maxCommissionPerUser: "1000",
      maxReferralsPerUser: 3,
      isActive: true,
      updatedAt: new Date(),
      updatedBy: null,
    };
  }

  async updateReferralSettings(settings: Partial<ReferralSettings>): Promise<ReferralSettings> {
    const [updatedSettings] = await db
      .update(referralSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .returning();
    return updatedSettings;
  }

  async processReferralBonus(refereeId: string): Promise<void> {
    const referee = await this.getUser(refereeId);
    if (!referee || !referee.referredBy) return;

    const referralRecord = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.refereeId, refereeId),
          eq(referrals.referrerId, referee.referredBy)
        )
      )
      .limit(1);

    if (!referralRecord.length || referralRecord[0].status !== "pending") return;

    const referrer = await this.getUser(referee.referredBy);
    if (!referrer) return;

    const referralSettings = await this.getReferralSettings();
    const bonusAmountBDT = 30;

    try {
      let referreeBonus: number;
      let referrerBonus: number = 0;

      if (referee.currency === Currency.BDT) {
        referreeBonus = bonusAmountBDT;
      } else {
        referreeBonus = await enhancedCurrencyConverter.convert(
          bonusAmountBDT,
          Currency.BDT,
          referee.currency as Currency
        );
      }

      const referrerRewardedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referee.referredBy),
            eq(referrals.status, "rewarded")
          )
        );

      const canEarnFromReferral = (referrerRewardedCount[0]?.count || 0) < referralSettings.maxReferralsPerUser;

      if (canEarnFromReferral) {
        if (referrer.currency === Currency.BDT) {
          referrerBonus = bonusAmountBDT;
        } else {
          referrerBonus = await enhancedCurrencyConverter.convert(
            bonusAmountBDT,
            Currency.BDT,
            referrer.currency as Currency
          );
        }
      }

      // Update balances
      const referrerCurrentBalance = parseFloat(referrer.balance);
      const referrerNewBalance = canEarnFromReferral ? referrerCurrentBalance + referrerBonus : referrerCurrentBalance;

      await db
        .update(users)
        .set({
          balance: referrerNewBalance.toFixed(2),
          totalReferrals: referrer.totalReferrals + 1,
          referralEarnings: canEarnFromReferral ? 
            (parseFloat(referrer.referralEarnings) + referrerBonus).toFixed(2) : 
            referrer.referralEarnings
        })
        .where(eq(users.id, referee.referredBy));

      const refereeCurrentBalance = parseFloat(referee.balance);
      const refereeNewBalance = refereeCurrentBalance + referreeBonus;

      await db
        .update(users)
        .set({ balance: refereeNewBalance.toFixed(2) })
        .where(eq(users.id, refereeId));

      await db
        .update(referrals)
        .set({ status: "rewarded" })
        .where(eq(referrals.id, referralRecord[0].id));

      console.log(`💰 Referral bonus processed: ${referreeBonus} to referee, ${referrerBonus} to referrer`);
    } catch (error) {
      console.error("Error processing referral bonus:", error);
    }
  }

  // User activity tracking methods for proper online status management
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline,
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastSeen(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getOnlineUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isOnline, true));
  }

  async updateUserLogin(userId: string, ipAddress: string, savePassword?: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        ipAddress,
        lastLogin: new Date(),
        lastSeen: new Date(),
        isOnline: true
      })
      .where(eq(users.id, userId));
  }

  async getUsersByIP(ipAddress: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.ipAddress, ipAddress));
  }
  
  // Redirect link operations
  async createRedirectLink(link: InsertRedirectLink): Promise<RedirectLink> {
    const [newLink] = await db
      .insert(redirectLinks)
      .values({
        ...link,
        createdAt: new Date(),
      })
      .returning();
    return newLink;
  }
  
  async getRedirectLinks(): Promise<RedirectLink[]> {
    return await db
      .select()
      .from(redirectLinks)
      .orderBy(desc(redirectLinks.createdAt));
  }
  
  async getActiveRedirectLinks(): Promise<RedirectLink[]> {
    return await db
      .select()
      .from(redirectLinks)
      .where(eq(redirectLinks.isActive, true))
      .orderBy(desc(redirectLinks.createdAt));
  }
  
  async getRedirectLink(id: number): Promise<RedirectLink | undefined> {
    const [link] = await db
      .select()
      .from(redirectLinks)
      .where(eq(redirectLinks.id, id));
    return link || undefined;
  }
  
  async updateRedirectLink(id: number, updates: UpdateRedirectLink): Promise<RedirectLink> {
    const [updatedLink] = await db
      .update(redirectLinks)
      .set(updates)
      .where(eq(redirectLinks.id, id))
      .returning();
    return updatedLink;
  }
  
  async deleteRedirectLink(id: number): Promise<void> {
    await db.delete(redirectLinks).where(eq(redirectLinks.id, id));
  }

  // Missing interface methods
  async approveGame(id: number): Promise<CustomGame> {
    const [approvedGame] = await db
      .update(customGames)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(customGames.id, id))
      .returning();
    return approvedGame;
  }

  async getGamesByCategory(category: string): Promise<CustomGame[]> {
    return await db
      .select()
      .from(customGames)
      .where(eq(customGames.category, category))
      .orderBy(desc(customGames.createdAt));
  }

  async searchGames(query: string): Promise<CustomGame[]> {
    return await db
      .select()
      .from(customGames)
      .where(
        sql`${customGames.name} ILIKE ${'%' + query + '%'} OR ${customGames.description} ILIKE ${'%' + query + '%'}`
      )
      .orderBy(desc(customGames.createdAt));
  }

  async incrementPlayCount(id: number): Promise<void> {
    await db
      .update(customGames)
      .set({ 
        playCount: sql`${customGames.playCount} + 1`,
        lastPlayed: new Date()
      })
      .where(eq(customGames.id, id));
  }
}