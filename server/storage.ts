import {
  User,
  InsertUser,
  UpsertUser,
  Currency,
  UserRole,
  Transaction,
  InsertTransaction,
  GameHistory,
  GamePlay,
  TransactionType,
  GameType,
  ChatMessage,
  InsertChatMessage,
  Advertisement,
  InsertAdvertisement,
  GameSetting,
  AdminActionType,
  CustomGame,
  InsertCustomGame,
  Referral,
  ReferralSettings,
  RedirectLink,
  InsertRedirectLink,
  UpdateRedirectLink,
} from "@shared/schema";
import session from "express-session";
import { enhancedCurrencyConverter } from "./utils/enhanced-currency-converter";

// Interface for storage operations
export interface IStorage {
  // User operations (updated for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // New method for Replit Auth
  updateUser(userId: string, userData: Partial<User>): Promise<User>;
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<User>;
  updateUserCurrency(userId: string, currency: Currency): Promise<User>;
  updateUserProfilePicture(userId: string, filename: string | null): Promise<User>;
  toggleUserMute(userId: string, isMuted: boolean): Promise<User>;
  toggleUserBan(userId: string, isBanned: boolean): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserLogin(userId: string, ipAddress: string): Promise<void>;
  getUsersByIP(ipAddress: string): Promise<User[]>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  updateUserLastSeen(userId: string): Promise<void>;
  getOnlineUsers(): Promise<User[]>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  // Game operations
  createGameHistory(
    gamePlay: GamePlay,
    userId: string,
    isWin: boolean,
    winAmount?: string,
    multiplier?: number,
    gameData?: any,
  ): Promise<GameHistory>;
  getUserGameHistory(userId: string): Promise<GameHistory[]>;
  getRecentWinners(limit?: number): Promise<GameHistory[]>;

  // Chat operations
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(limit?: number): Promise<ChatMessage[]>;

  // Advertisement operations
  createAdvertisement(
    advertisement: InsertAdvertisement,
  ): Promise<Advertisement>;
  getAdvertisements(): Promise<Advertisement[]>;
  deleteAdvertisement(id: number): Promise<void>;

  // Game settings operations
  getGameSettings(gameType: GameType): Promise<GameSetting | undefined>;
  updateGameSettings(
    gameType: GameType,
    winChance: number,
    maxMultiplier: number,
    updatedBy: string,
  ): Promise<GameSetting>;

  // Admin operations
  logAdminAction(
    adminId: string,
    actionType: AdminActionType,
    targetUserId?: string,
    details?: any,
  ): Promise<void>;

  // Admin audit operations for transparency
  getAdminActions(limit?: number): Promise<any[]>;
  getAdminActionsByAdmin(adminId: string, limit?: number): Promise<any[]>;
  getAdminActionsByTarget(targetUserId: string, limit?: number): Promise<any[]>;
  getAdminActionStats(): Promise<any>;

  // Notification operations
  addUserNotification(userId: string, message: string, type: string): Promise<void>;
  getUserNotifications(userId: string): Promise<any[]>;
  markNotificationAsRead(userId: string, notificationId: number): Promise<void>;

  // Custom games operations
  createCustomGame(game: InsertCustomGame): Promise<CustomGame>;
  getCustomGames(): Promise<CustomGame[]>;
  getCustomGame(id: number): Promise<CustomGame | undefined>;
  updateCustomGame(id: number, updates: Partial<CustomGame>): Promise<CustomGame>;
  deleteCustomGame(id: number): Promise<void>;

  // Referral system operations
  generateReferralCode(userId: string): Promise<string>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createReferral(referrerId: string, refereeId: string, referralCode: string): Promise<Referral>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  updateReferralStatus(referralId: number, status: string): Promise<Referral>;
  addReferralEarnings(referralId: number, amount: string): Promise<void>;
  getReferralSettings(): Promise<ReferralSettings>;
  updateReferralSettings(settings: Partial<ReferralSettings>): Promise<ReferralSettings>;
  processReferralBonus(refereeId: string): Promise<void>;

  // Redirect links operations
  createRedirectLink(link: InsertRedirectLink): Promise<RedirectLink>;
  getRedirectLinks(): Promise<RedirectLink[]>;
  getActiveRedirectLinks(): Promise<RedirectLink[]>;
  getRedirectLink(id: number): Promise<RedirectLink | undefined>;
  updateRedirectLink(id: number, updates: UpdateRedirectLink): Promise<RedirectLink>;
  deleteRedirectLink(id: number): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<number, Transaction>;
  private gameHistory: Map<number, GameHistory>;
  private chatMessages: Map<number, ChatMessage>;
  private advertisements: Map<number, Advertisement>;
  private gameSettings: Map<GameType, GameSetting>;
  private customGames: Map<number, CustomGame>;
  private referrals: Map<number, Referral>;
  private referralSettings: ReferralSettings;
  private notifications: Map<string, any[]>;
  private adminActions: Map<number, any>;
  private redirectLinks: Map<number, RedirectLink>;

  currentUserId: number = 1;
  currentTransactionId: number = 1;
  currentGameHistoryId: number = 1;
  currentChatMessageId: number = 1;
  currentAdvertisementId: number = 1;
  currentGameSettingId: number = 1;
  currentCustomGameId: number = 1;
  currentReferralId: number = 1;
  currentAdminActionId: number = 1;
  currentRedirectLinkId: number = 1;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.gameHistory = new Map();
    this.chatMessages = new Map();
    this.advertisements = new Map();
    this.gameSettings = new Map();
    this.customGames = new Map();
    this.referrals = new Map();
    this.notifications = new Map();
    this.adminActions = new Map();
    this.redirectLinks = new Map();
    
    // Initialize referral settings with defaults
    this.referralSettings = {
      id: 1,
      signupBonus: "30", // 30 BDT bonus
      commissionRate: 5.0,
      minimumDeposit: "0", // No minimum deposit required
      maxCommissionPerUser: "1000",
      maxReferralsPerUser: 3, // Max 3 referrals per user
      isActive: true,
      updatedAt: new Date(),
      updatedBy: null,
    };

    // Create a simple in-memory session store
    this.sessionStore = {
      get: (sid, cb) => cb?.(null, {}),
      set: (sid, session, cb) => cb?.(),
      destroy: (sid, cb) => cb?.(),
      touch: (sid, session, cb) => cb?.(),
      all: (cb) => cb?.(null, {}),
      length: (cb) => cb?.(null, 0),
      clear: (cb) => cb?.()
    };

    // Initialize with admin users
    this.initializeAdminUsers();
    this.initializeGameSettings();
    this.initializeTestRedirectLinks();
  }

  private async initializeAdminUsers() {
    // For admin users, we store the raw passwords as per requirements
    // This allows admins to see all user passwords (including their own) in the admin panel

    // Standardized admin password for all admin accounts
    const standardAdminPassword = "admin1122";

    // Admin user: shadowHimel - Force correct balance and currency
    let shadowHimelUser = await this.getUserByUsername("shadowHimel");
    if (!shadowHimelUser) {
      shadowHimelUser = await this.createUser({
        id: "1",
        username: "shadowHimel",
        email: "shadow@example.com",
        phone: "01234567890",
        password: standardAdminPassword,
        rawPassword: "admin1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
      });
      console.log(`Created shadowHimel with balance: ${shadowHimelUser.balance} ${shadowHimelUser.currency}`);
    } else {
      // Force update the existing user with correct balance and currency
      this.users.set(shadowHimelUser.id, {
        ...shadowHimelUser,
        password: standardAdminPassword,
        rawPassword: "admin1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
        ipAddress: shadowHimelUser.ipAddress || null,
        lastLogin: shadowHimelUser.lastLogin || null,
        lastSeen: shadowHimelUser.lastSeen || null,
        isOnline: shadowHimelUser.isOnline || false
      });
      console.log(`Force updated shadowHimel: 61029.00 BDT`);
    }
    
    // Double-check and force the update if needed for all admin users
    setTimeout(async () => {
      // Force correct shadowHimel
      const verifyUser = await this.getUser("1");
      if (verifyUser && (verifyUser.balance !== "61029.00" || verifyUser.currency !== Currency.BDT)) {
        this.users.set("1", {
          ...verifyUser,
          balance: "61029.00",
          currency: Currency.BDT
        });
        console.log(`Force corrected shadowHimel balance to 61029.00 BDT`);
      }
      
      // Force correct shadowTalha
      const verifyTalha = await this.getUser("4");
      if (verifyTalha && (verifyTalha.balance !== "61029.00" || verifyTalha.currency !== Currency.BDT)) {
        this.users.set("4", {
          ...verifyTalha,
          balance: "61029.00",
          currency: Currency.BDT
        });
        console.log(`Force corrected shadowTalha balance to 61029.00 BDT`);
      }
      
      // Force correct shadowKaran
      const verifyKaran = await this.getUser("5");
      if (verifyKaran && (verifyKaran.balance !== "61029.00" || verifyKaran.currency !== Currency.BDT)) {
        this.users.set("5", {
          ...verifyKaran,
          balance: "61029.00",
          currency: Currency.BDT
        });
        console.log(`Force corrected shadowKaran balance to 61029.00 BDT`);
      }
    }, 1000);

    // Admin user: Albab AJ
    if (!(await this.getUserByUsername("Albab AJ"))) {
      this.createUser({
        id: "2",
        username: "Albab AJ",
        email: "albab@example.com",
        phone: "09876543210",
        password: standardAdminPassword,
        rawPassword: "admin1122", // Store raw password for admin panel
      }).then((user) => {
        this.updateUserRole(user.id, UserRole.ADMIN);
        // Give initial balance
        this.updateUserBalance(user.id, "10000");
      });
    } else {
      // Update password for existing user
      const existingUser = await this.getUserByUsername("Albab AJ");
      if (existingUser) {
        this.users.set(existingUser.id, {
          ...existingUser,
          password: standardAdminPassword,
          rawPassword: "admin1122", // Store raw password for admin panel
          ipAddress: existingUser.ipAddress || null,
          lastLogin: existingUser.lastLogin || null
        });
      }
    }

    // Admin user: shadowHimel2 (making sure this admin exists)
    if (!(await this.getUserByUsername("shadowHimel2"))) {
      this.createUser({
        id: "3",
        username: "shadowHimel2",
        email: "shadow2@example.com",
        phone: "01234567891",
        password: standardAdminPassword,
        rawPassword: "admin1122", // Store raw password for admin panel
      }).then((user) => {
        this.updateUserRole(user.id, UserRole.ADMIN);
        // Give initial balance
        this.updateUserBalance(user.id, "10000");
      });
    } else {
      // Update password for existing user
      const existingUser = await this.getUserByUsername("shadowHimel2");
      if (existingUser) {
        this.users.set(existingUser.id, {
          ...existingUser,
          password: standardAdminPassword,
          rawPassword: "admin1122", // Store raw password for admin panel
          role: UserRole.ADMIN, // Ensure proper role is set
          profilePicture: existingUser.profilePicture || null,
          ipAddress: existingUser.ipAddress || null,
          lastLogin: existingUser.lastLogin || null
        });
      }
    }

    // Admin user: shadowTalha (permanent admin with same privileges as shadowHimel)
    let shadowTalhaUser = await this.getUserByUsername("shadowTalha");
    if (!shadowTalhaUser) {
      shadowTalhaUser = await this.createUser({
        id: "4",
        username: "shadowTalha",
        email: "shadowtalha@example.com",
        phone: "01234567891",
        password: standardAdminPassword,
        rawPassword: "talha1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
      });
      console.log(`Created shadowTalha with balance: ${shadowTalhaUser.balance} ${shadowTalhaUser.currency}`);
    } else {
      // Force update the existing user with correct balance and currency
      this.users.set(shadowTalhaUser.id, {
        ...shadowTalhaUser,
        password: standardAdminPassword,
        rawPassword: "talha1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
        ipAddress: shadowTalhaUser.ipAddress || null,
        lastLogin: shadowTalhaUser.lastLogin || null,
        lastSeen: shadowTalhaUser.lastSeen || null,
        isOnline: shadowTalhaUser.isOnline || false
      });
      console.log(`Force updated shadowTalha: 61029.00 BDT`);
    }

    // Admin user: shadowKaran (permanent admin with same privileges as shadowHimel)
    let shadowKaranUser = await this.getUserByUsername("shadowKaran");
    if (!shadowKaranUser) {
      shadowKaranUser = await this.createUser({
        id: "5",
        username: "shadowKaran",
        email: "shadowkaran@example.com",
        phone: "01234567892",
        password: standardAdminPassword,
        rawPassword: "karan1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
      });
      console.log(`Created shadowKaran with balance: ${shadowKaranUser.balance} ${shadowKaranUser.currency}`);
    } else {
      // Force update the existing user with correct balance and currency
      this.users.set(shadowKaranUser.id, {
        ...shadowKaranUser,
        password: standardAdminPassword,
        rawPassword: "karan1122", // Store raw password for admin panel
        balance: "61029.00",
        currency: Currency.BDT,
        role: UserRole.ADMIN,
        ipAddress: shadowKaranUser.ipAddress || null,
        lastLogin: shadowKaranUser.lastLogin || null,
        lastSeen: shadowKaranUser.lastSeen || null,
        isOnline: shadowKaranUser.isOnline || false
      });
      console.log(`Force updated shadowKaran: 61029.00 BDT`);
    }
  }

  private async initializeGameSettings() {
    // Initialize default game settings
    if (!(await this.getGameSettings(GameType.SLOTS))) {
      this.gameSettings.set(GameType.SLOTS, {
        id: this.currentGameSettingId++,
        gameType: GameType.SLOTS,
        winChance: 10,
        maxMultiplier: 1.1,
        lastUpdated: new Date(),
        updatedBy: null,
      });
    }

    if (!(await this.getGameSettings(GameType.DICE))) {
      this.gameSettings.set(GameType.DICE, {
        id: this.currentGameSettingId++,
        gameType: GameType.DICE,
        winChance: 10,
        maxMultiplier: 1.1,
        lastUpdated: new Date(),
        updatedBy: null,
      });
    }

    if (!(await this.getGameSettings(GameType.PLINKO))) {
      this.gameSettings.set(GameType.PLINKO, {
        id: this.currentGameSettingId++,
        gameType: GameType.PLINKO,
        winChance: 10,
        maxMultiplier: 1.1,
        lastUpdated: new Date(),
        updatedBy: null,
      });
    }
  }

  private async initializeTestRedirectLinks() {
    // Add default advertisement links
    console.log('🔧 Initializing default advertisement links...');
    
    try {
      // Clear any existing redirect links first
      this.redirectLinks.clear();
      this.currentRedirectLinkId = 1;

      // Create the default advertisement links
      const defaultLinks = [
        {
          url: 'https://www.profitableratecpm.com/cf31f3k6?key=23e31a0769435b412e9ad2f4d901e8eb',
          intervalMinutes: 1, // 1 minute intervals
          isActive: true,
          createdBy: '1' // shadowHimel's ID
        },
        {
          url: 'https://www.profitableratecpm.com/xvusqsfjm4?key=03cfc2152bd75c60886fa09ca6841941',
          intervalMinutes: 2, // 2 minute intervals
          isActive: true,
          createdBy: '1' // shadowHimel's ID
        }
      ];

      for (const linkData of defaultLinks) {
        const link = await this.createRedirectLink(linkData);
        console.log(`✅ Created default advertisement link: ${link.url} (${link.intervalMinutes} min intervals)`);
      }

      console.log('🚀 Default advertisement links initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing default advertisement links:', error);
    }
  }

  // Replit Auth upsert method
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    
    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, {
        ...userData,
        updatedAt: new Date(),
      });
      return existingUser;
    } else {
      // Create new user with default casino values
      const newUser: User = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        username: userData.username || userData.email?.split('@')[0] || `user_${userData.id}`,
        phone: userData.phone || null,
        password: userData.password || null,
        rawPassword: userData.rawPassword || null,
        balance: userData.balance || "0",
        currency: userData.currency || Currency.USD,
        role: userData.role || UserRole.USER,
        isMuted: userData.isMuted ?? false,
        isBanned: userData.isBanned ?? false,
        profilePicture: userData.profilePicture || null,
        createdAt: userData.createdAt || new Date(),
        updatedAt: new Date(),
        ipAddress: userData.ipAddress || null,
        lastLogin: userData.lastLogin || null,
        referralCode: userData.referralCode || null,
        referredBy: userData.referredBy || null,
        totalReferrals: userData.totalReferrals ?? 0,
        referralEarnings: userData.referralEarnings || "0",
        lastSeen: userData.lastSeen || null,
        isOnline: userData.isOnline ?? false,
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  // User operations
  async getUser(id: string | number): Promise<User | undefined> {
    return this.users.get(String(id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username?.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = String(this.currentUserId++);
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email || null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      username: insertUser.username || null,
      phone: insertUser.phone || null,
      password: insertUser.password || null,
      rawPassword: insertUser.rawPassword || null,
      balance: "0", // New users start with 0 balance
      currency: Currency.USD,
      role: UserRole.USER,
      isMuted: false,
      isBanned: false,
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      lastLogin: null,
      referralCode: null,
      referredBy: null,
      totalReferrals: 0,
      referralEarnings: "0",
      lastSeen: null,
      isOnline: false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string | number, newBalance: string): Promise<User> {
    // Performance logging to identify potential bottlenecks
    const startTime = Date.now();
    console.log(`[STORAGE] Starting balance update for user ${userId} to ${newBalance}`);

    try {
      // FAST PATH: Skip extra lookups by using a single atomic update operation
      // This addresses the wallet update performance problems by reducing database operations
      // Equivalent SQL would be: UPDATE wallets SET balance = ? WHERE user_id = ?
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");

      // Validate balance format to ensure consistency
      const numericBalance = parseFloat(newBalance);
      if (isNaN(numericBalance)) {
        throw new Error(`Invalid balance format: ${newBalance}`);
      }

      // Format balance properly based on currency
      const formattedBalance = this.formatBalanceForCurrency(numericBalance, user.currency as Currency);

      // Perform atomic update directly with minimal overhead
      // This is the critical fix for wallet update performance
      const updatedUser = { ...user, balance: formattedBalance };
      this.users.set(String(userId), updatedUser);

      // Log performance metrics for monitoring
      const duration = Date.now() - startTime;
      console.log(`[STORAGE] ✓ Balance updated for user ${userId} in ${duration}ms: ${user.balance} → ${formattedBalance}`);

      return updatedUser;
    } catch (error) {
      // Enhanced error logging for diagnostics
      const duration = Date.now() - startTime;
      console.error(`[STORAGE] ✗ Balance update failed for user ${userId} after ${duration}ms:`, error);
      throw error;
    }
  }

  // Helper function to ensure consistent balance formatting
  private formatBalanceForCurrency(amount: number, currency: Currency): string {
    // Use 8 decimal places for cryptocurrencies, 2 for regular currencies
    const isCrypto = [Currency.BTC, Currency.ETH, Currency.XRP, Currency.LTC, Currency.USDT].includes(currency);
    return amount.toFixed(isCrypto ? 8 : 2);
  }

  async updateUserCurrency(userId: string, currency: Currency): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Skip conversion if currency hasn't changed
    if (user.currency === currency) {
      return user;
    }

    try {
      // Convert the user's balance to the new currency using the centralized converter
      const currentBalance = parseFloat(user.balance);
      if (isNaN(currentBalance)) {
        throw new Error('Invalid current balance');
      }

      // Use the enhanced currency converter instead of the undefined currencyConverter
      const convertedAmount = await enhancedCurrencyConverter.convert(
        currentBalance,
        user.currency as Currency,
        currency
      );

      const newBalance = convertedAmount.toString();

      // Update user with new currency and converted balance
      const updatedUser = { ...user, currency, balance: newBalance };
      this.users.set(userId, updatedUser);

      return updatedUser;
    } catch (error) {
      console.error(`Currency conversion failed for user ${userId}:`, error);
      throw new Error(`Failed to update currency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleUserMute(userId: string, isMuted: boolean): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, isMuted };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async toggleUserBan(userId: string, isBanned: boolean): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, isBanned };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...userData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, role };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfilePicture(userId: string, filename: string | null): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, profilePicture: filename };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserLogin(userId: string, ipAddress: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { 
      ...user, 
      ipAddress, 
      lastLogin: new Date(),
      lastSeen: new Date(),
      isOnline: true
    };
    this.users.set(userId, updatedUser);
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { 
      ...user, 
      isOnline,
      lastSeen: new Date()
    };
    this.users.set(userId, updatedUser);
  }

  async updateUserLastSeen(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { 
      ...user, 
      lastSeen: new Date()
    };
    this.users.set(userId, updatedUser);
  }

  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  async getUsersByIP(ipAddress: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.ipAddress === ipAddress).sort((a, b) => {
      const aLogin = a.lastLogin || new Date(0);
      const bLogin = b.lastLogin || new Date(0);
      return bLogin.getTime() - aLogin.getTime();
    });
  }

  // Transaction operations
  async createTransaction(
    transaction: InsertTransaction,
  ): Promise<Transaction> {
    const id = this.currentTransactionId++;

    // Ensure status field exists, default to "pending" if not provided
    const status = transaction.status || "pending";

    const newTransaction: Transaction = {
      ...transaction,
      status,
      id,
      createdAt: new Date(),
      ipAddress: transaction.ipAddress || null,
      sessionId: transaction.sessionId || null,
      metadata: transaction.metadata || {},
    };
    this.transactions.set(id, newTransaction);

    // Update user balance only for completed deposits or if not explicitly pending
    if (transaction.type === TransactionType.DEPOSIT && 
        (status === "completed" || !transaction.status)) {
      const user = await this.getUser(transaction.userId);
      if (user) {
        const newBalance = (
          parseFloat(user.balance) + parseFloat(transaction.amount as string)
        ).toString();
        await this.updateUserBalance(user.id, newBalance);
      }
    } else if (transaction.type === TransactionType.WITHDRAWAL) {
      const user = await this.getUser(transaction.userId);
      if (user) {
        const newBalance = (
          parseFloat(user.balance) - parseFloat(transaction.amount as string)
        ).toString();
        await this.updateUserBalance(user.id, newBalance);
      }
    }

    return newTransaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
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
    const id = this.currentGameHistoryId++;

    const newGameHistory: GameHistory = {
      id,
      userId,
      gameType: gamePlay.gameType,
      betAmount: gamePlay.betAmount.toString(),
      winAmount: winAmount || "0",
      multiplier: multiplier || 0,
      isWin,
      currency: gamePlay.currency,
      gameData: gameData || null,
      createdAt: new Date(),
    };

    this.gameHistory.set(id, newGameHistory);
    return newGameHistory;
  }

  async getUserGameHistory(userId: string): Promise<GameHistory[]> {
    return Array.from(this.gameHistory.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentWinners(limit: number = 10): Promise<GameHistory[]> {
    return Array.from(this.gameHistory.values())
      .filter((history) => history.isWin)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Chat operations
  async createChatMessage(
    chatMessage: InsertChatMessage,
  ): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const newChatMessage: ChatMessage = {
      ...chatMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, newChatMessage);
    return newChatMessage;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .reverse(); // Return in chronological order
    
    // Enhance messages with user profile data
    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      const user = await this.getUser(msg.userId);
      return {
        ...msg,
        profilePictureUrl: user?.profilePicture ? `/uploads/${user.profilePicture}` : "/assets/default-profile.png",
        isAdmin: user?.role === UserRole.ADMIN
      };
    }));
    
    return enhancedMessages;
  }

  // Advertisement operations
  async createAdvertisement(
    advertisement: InsertAdvertisement,
  ): Promise<Advertisement> {
    const id = this.currentAdvertisementId++;
    const newAdvertisement: Advertisement = {
      ...advertisement,
      id,
      createdAt: new Date(),
    };
    this.advertisements.set(id, newAdvertisement);
    return newAdvertisement;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    return Array.from(this.advertisements.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async deleteAdvertisement(id: number): Promise<void> {
    this.advertisements.delete(id);
  }

  // Game settings operations
  async getGameSettings(gameType: GameType): Promise<GameSetting | undefined> {
    return this.gameSettings.get(gameType);
  }

  async updateGameSettings(
    gameType: GameType,
    winChance: number,
    maxMultiplier: number,
    updatedBy: string,
  ): Promise<GameSetting> {
    const settings = await this.getGameSettings(gameType);
    const updatedSettings: GameSetting = {
      id: settings?.id || this.currentGameSettingId++,
      gameType,
      winChance,
      maxMultiplier,
      lastUpdated: new Date(),
      updatedBy: parseInt(updatedBy),
    };

    this.gameSettings.set(gameType, updatedSettings);
    return updatedSettings;
  }

  // Admin operations
  async logAdminAction(
    adminId: string,
    actionType: AdminActionType,
    targetUserId?: string,
    details?: any,
  ): Promise<void> {
    const id = this.currentAdminActionId++;
    const adminAction = {
      id,
      adminId,
      action: actionType,
      targetUserId,
      details,
      createdAt: new Date(),
    };
    
    this.adminActions.set(id, adminAction);
    
    // Log to console for immediate visibility
    console.log(`🔐 Admin Action Logged: ${actionType} by ${adminId}`, {
      targetUserId,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Admin audit operations for transparency
  async getAdminActions(limit: number = 100): Promise<any[]> {
    const actions = Array.from(this.adminActions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    // Enrich with admin username
    const enrichedActions = await Promise.all(
      actions.map(async (action) => {
        const admin = await this.getUser(action.adminId);
        return {
          ...action,
          adminUsername: admin?.username || "Unknown",
        };
      })
    );
    
    return enrichedActions;
  }

  async getAdminActionsByAdmin(adminId: string, limit: number = 50): Promise<any[]> {
    const actions = Array.from(this.adminActions.values())
      .filter((action) => action.adminId === adminId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    // Enrich with admin username
    const enrichedActions = await Promise.all(
      actions.map(async (action) => {
        const admin = await this.getUser(action.adminId);
        return {
          ...action,
          adminUsername: admin?.username || "Unknown",
        };
      })
    );
    
    return enrichedActions;
  }

  async getAdminActionsByTarget(targetUserId: string, limit: number = 50): Promise<any[]> {
    const actions = Array.from(this.adminActions.values())
      .filter((action) => action.targetUserId === targetUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    // Enrich with admin username
    const enrichedActions = await Promise.all(
      actions.map(async (action) => {
        const admin = await this.getUser(action.adminId);
        return {
          ...action,
          adminUsername: admin?.username || "Unknown",
        };
      })
    );
    
    return enrichedActions;
  }

  async getAdminActionStats(): Promise<any> {
    const allActions = Array.from(this.adminActions.values());
    const totalActions = allActions.length;
    
    // Actions by type
    const actionsByType = allActions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Actions by admin
    const actionsByAdmin = allActions.reduce((acc, action) => {
      acc[action.adminId] = (acc[action.adminId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Enrich admin stats with usernames
    const enrichedActionsByAdmin = await Promise.all(
      Object.entries(actionsByAdmin).map(async ([adminId, count]) => {
        const admin = await this.getUser(adminId);
        return {
          adminId,
          adminUsername: admin?.username || "Unknown",
          count,
        };
      })
    );
    
    return {
      totalActions,
      actionsByType: Object.entries(actionsByType).map(([action, count]) => ({
        action,
        count,
      })),
      actionsByAdmin: enrichedActionsByAdmin,
    };
  }

  // Custom games operations
  async createCustomGame(game: InsertCustomGame): Promise<CustomGame> {
    const newGame: CustomGame = {
      id: this.currentCustomGameId++,
      name: game.name,
      type: game.type || "html",
      htmlContent: game.htmlContent,
      winChance: game.winChance || 50,
      maxMultiplier: game.maxMultiplier || 2.0,
      minBet: game.minBet || "1",
      maxBet: game.maxBet || "1000",
      description: game.description || null,
      isActive: true,
      createdAt: new Date(),
      createdBy: game.createdBy,
    };

    this.customGames.set(newGame.id, newGame);
    return newGame;
  }

  async getCustomGames(): Promise<CustomGame[]> {
    return Array.from(this.customGames.values()).filter(game => game.isActive);
  }

  async getCustomGame(id: number): Promise<CustomGame | undefined> {
    return this.customGames.get(id);
  }

  async updateCustomGame(id: number, updates: Partial<CustomGame>): Promise<CustomGame> {
    const existingGame = this.customGames.get(id);
    if (!existingGame) {
      throw new Error("Custom game not found");
    }

    const updatedGame = { ...existingGame, ...updates };
    this.customGames.set(id, updatedGame);
    return updatedGame;
  }

  async deleteCustomGame(id: number): Promise<void> {
    const game = this.customGames.get(id);
    if (game) {
      // Soft delete by setting isActive to false
      this.customGames.set(id, { ...game, isActive: false });
    }
  }

  // Referral system operations
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // If user already has a referral code, return it
    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a unique referral code
    let referralCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Create a code using username + random characters
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `${(user.username || "USER").substring(0, 4).toUpperCase()}${randomSuffix}`;
      attempts++;
      
      if (attempts > maxAttempts) {
        // Fallback to purely random code
        referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        break;
      }
    } while (await this.getUserByReferralCode(referralCode));

    // Update user with the new referral code
    const updatedUser = {
      ...user,
      referralCode
    };
    this.users.set(userId, updatedUser);

    return referralCode;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async createReferral(referrerId: string, refereeId: string, referralCode: string): Promise<Referral> {
    const referral: Referral = {
      id: this.currentReferralId++,
      referrerId: parseInt(referrerId),
      refereeId: parseInt(refereeId),
      referralCode,
      bonusAmount: this.referralSettings.signupBonus,
      commissionRate: this.referralSettings.commissionRate,
      status: "pending",
      firstDepositDate: null,
      totalEarnings: "0",
      createdAt: new Date(),
    };

    this.referrals.set(referral.id, referral);

    // Update referee with referrer information
    const referee = await this.getUser(refereeId);
    if (referee) {
      const updatedReferee = { ...referee, referredBy: referrerId };
      this.users.set(refereeId, updatedReferee);
    }

    return referral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referrerId === parseInt(userId)
    );
  }

  async updateReferralStatus(referralId: number, status: string): Promise<Referral> {
    const referral = this.referrals.get(referralId);
    if (!referral) throw new Error("Referral not found");

    const updatedReferral = { ...referral, status };
    this.referrals.set(referralId, updatedReferral);
    return updatedReferral;
  }

  async addReferralEarnings(referralId: number, amount: string): Promise<void> {
    const referral = this.referrals.get(referralId);
    if (!referral) throw new Error("Referral not found");

    const currentEarnings = parseFloat(referral.totalEarnings);
    const newEarnings = currentEarnings + parseFloat(amount);
    
    const updatedReferral = { 
      ...referral, 
      totalEarnings: newEarnings.toString(),
      status: "active"
    };
    this.referrals.set(referralId, updatedReferral);

    // Update referrer's total earnings
    const referrer = await this.getUser(referral.referrerId);
    if (referrer) {
      const referrerEarnings = parseFloat(referrer.referralEarnings);
      const updatedReferrer = { 
        ...referrer, 
        referralEarnings: (referrerEarnings + parseFloat(amount)).toString()
      };
      this.users.set(String(referral.referrerId), updatedReferrer);
    }
  }

  async getReferralSettings(): Promise<ReferralSettings> {
    return this.referralSettings;
  }

  async updateReferralSettings(settings: Partial<ReferralSettings>): Promise<ReferralSettings> {
    this.referralSettings = {
      ...this.referralSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.referralSettings;
  }

  async processReferralBonus(refereeId: string): Promise<void> {
    const referee = await this.getUser(refereeId);
    if (!referee || !referee.referredBy) return;

    // Find the referral record
    const referral = Array.from(this.referrals.values()).find(
      (r) => r.refereeId === parseInt(refereeId) && r.referrerId === parseInt(referee.referredBy || "0")
    );

    if (!referral || referral.status !== "pending") return;

    const referrer = await this.getUser(referee.referredBy);
    if (!referrer) return;

    // Check how many rewarded referrals the referrer already has
    const referrerRewardedReferrals = Array.from(this.referrals.values()).filter(
      (r) => r.referrerId === parseInt(referee.referredBy || "0") && r.status === "rewarded"
    ).length;

    const maxEarningReferrals = this.referralSettings.maxReferralsPerUser || 3;
    const canEarnFromThisReferral = referrerRewardedReferrals < maxEarningReferrals;

    // Fixed 30 BDT bonus - convert to user's preferred currency
    const bonusAmountBDT = 30;
    let referrerBonus: number = 0;
    let refereeBonus: number;

    try {
      // Referee always gets bonus regardless of referrer's limit
      if (referee.currency === Currency.BDT) {
        refereeBonus = bonusAmountBDT;
      } else {
        refereeBonus = await enhancedCurrencyConverter.convert(bonusAmountBDT, Currency.BDT, referee.currency as Currency);
      }

      // Referrer only gets bonus if they haven't reached the 3-referral limit
      if (canEarnFromThisReferral) {
        if (referrer.currency === Currency.BDT) {
          referrerBonus = bonusAmountBDT;
        } else {
          referrerBonus = await enhancedCurrencyConverter.convert(bonusAmountBDT, Currency.BDT, referrer.currency as Currency);
        }
      }
    } catch (error) {
      console.error("Currency conversion failed, using BDT amounts:", error);
      // Fallback to BDT amounts if conversion fails
      refereeBonus = bonusAmountBDT;
      if (canEarnFromThisReferral) {
        referrerBonus = bonusAmountBDT;
      }
    }

    // Update referrer - always increment totalReferrals, but only add balance/earnings if within limit
    const referrerCurrentBalance = parseFloat(referrer.balance);
    const referrerNewBalance = canEarnFromThisReferral ? referrerCurrentBalance + referrerBonus : referrerCurrentBalance;
    
    const updatedReferrer = {
      ...referrer,
      balance: referrerNewBalance.toFixed(2),
      totalReferrals: referrer.totalReferrals + 1,
      referralEarnings: canEarnFromThisReferral ? 
        (parseFloat(referrer.referralEarnings) + referrerBonus).toFixed(2) : 
        referrer.referralEarnings
    };
    this.users.set(referee.referredBy, updatedReferrer);

    // Update referee balance (they always get bonus)
    const refereeCurrentBalance = parseFloat(referee.balance);
    const refereeNewBalance = refereeCurrentBalance + refereeBonus;
    
    const updatedReferee = {
      ...referee,
      balance: refereeNewBalance.toFixed(2)
    };
    this.users.set(refereeId, updatedReferee);

    // Update referral status
    await this.updateReferralStatus(referral.id, "rewarded");
    
    // Only add earnings if referrer can still earn
    if (canEarnFromThisReferral) {
      await this.addReferralEarnings(referral.id, referrerBonus.toFixed(2));
    } else {
      // Mark as completed but with 0 earnings
      await this.addReferralEarnings(referral.id, "0");
    }

    // Create transaction record for referrer bonus (only if they can earn)
    if (canEarnFromThisReferral && referrerBonus > 0) {
      await this.createTransaction({
        userId: referee.referredBy,
        type: TransactionType.REFERRAL_BONUS,
        amount: referrerBonus.toFixed(2),
        currency: referrer.currency,
        status: "completed",
        ipAddress: null,
        sessionId: null,
        metadata: { 
          refereeId, 
          referralCode: referral.referralCode,
          type: "referrer_bonus",
          originalAmountBDT: bonusAmountBDT,
          rewardedReferralNumber: referrerRewardedReferrals + 1
        }
      });
    }

    // Create transaction record for referee bonus (always)
    await this.createTransaction({
      userId: refereeId,
      type: TransactionType.REFERRAL_BONUS,
      amount: refereeBonus.toFixed(2),
      currency: referee.currency,
      status: "completed",
      ipAddress: null,
      sessionId: null,
      metadata: { 
        referrerId: referee.referredBy, 
        referralCode: referral.referralCode,
        type: "referee_bonus",
        originalAmountBDT: bonusAmountBDT
      }
    });

    const referrerMessage = canEarnFromThisReferral ? 
      `got ${referrerBonus} ${referrer.currency}` : 
      `reached 3-referral limit, no bonus earned`;
    
    console.log(`Referral bonus processed: Referrer ${referrer.username} ${referrerMessage}, Referee ${referee.username} got ${refereeBonus} ${referee.currency}`);
  }

  // Redirect links operations
  async createRedirectLink(link: InsertRedirectLink): Promise<RedirectLink> {
    const id = this.currentRedirectLinkId++;
    const now = new Date();
    
    const redirectLink: RedirectLink = {
      id,
      url: link.url,
      intervalMinutes: link.intervalMinutes,
      isActive: link.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: link.createdBy,
    };

    this.redirectLinks.set(id, redirectLink);
    return redirectLink;
  }

  async getRedirectLinks(): Promise<RedirectLink[]> {
    return Array.from(this.redirectLinks.values()).sort((a, b) => b.id - a.id);
  }

  async getActiveRedirectLinks(): Promise<RedirectLink[]> {
    return Array.from(this.redirectLinks.values())
      .filter(link => link.isActive)
      .sort((a, b) => b.id - a.id);
  }

  async getRedirectLink(id: number): Promise<RedirectLink | undefined> {
    return this.redirectLinks.get(id);
  }

  async updateRedirectLink(id: number, updates: UpdateRedirectLink): Promise<RedirectLink> {
    const link = this.redirectLinks.get(id);
    if (!link) {
      throw new Error(`Redirect link with id ${id} not found`);
    }

    const updatedLink: RedirectLink = {
      ...link,
      ...updates,
      updatedAt: new Date(),
    };

    this.redirectLinks.set(id, updatedLink);
    return updatedLink;
  }

  async deleteRedirectLink(id: number): Promise<void> {
    if (!this.redirectLinks.has(id)) {
      throw new Error(`Redirect link with id ${id} not found`);
    }
    this.redirectLinks.delete(id);
  }

  // Notification operations
  async addUserNotification(userId: string, message: string, type: string): Promise<void> {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId)!;
    const notification = {
      id: userNotifications.length + 1,
      message,
      type,
      createdAt: new Date(),
      isRead: false
    };
    
    userNotifications.push(notification);
    this.notifications.set(userId, userNotifications);
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    return this.notifications.get(userId) || [];
  }

  async markNotificationAsRead(userId: string, notificationId: number): Promise<void> {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    }
  }
}

// TEMPORARY: Use in-memory storage with enhanced user activity tracking
// TO RESTORE: Uncomment the database storage when TypeScript errors are resolved

// Import the DatabaseStorage implementation (commented out for now)
// import { DatabaseStorage } from "./database-storage";

// Use the in-memory storage implementation with enhanced user activity tracking
console.log("*** USING ENHANCED IN-MEMORY STORAGE WITH USER ACTIVITY TRACKING ***");
export const storage = new MemStorage();