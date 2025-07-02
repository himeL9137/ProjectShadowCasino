// TEMPORARY: This file has been modified to bypass database dependency
// TO RESTORE: Uncomment the original code and remove the mock implementations

import { IStorage } from "./storage";
import * as schema from "@shared/schema";
import { 
  User, InsertUser, Transaction, InsertTransaction, 
  GamePlay, GameHistory, ChatMessage, InsertChatMessage,
  Advertisement, InsertAdvertisement, GameSetting, GameType,
  UserRole, Currency, AdminActionType
} from "@shared/schema";
import session from "express-session";

// Mock session store
class MockSessionStore implements session.Store {
  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
    callback(null, {} as any);
  }
  
  set(sid: string, session: session.SessionData, callback?: (err?: any) => void): void {
    if (callback) callback();
  }
  
  destroy(sid: string, callback?: (err?: any) => void): void {
    if (callback) callback();
  }
  
  touch(sid: string, session: session.SessionData, callback?: (err?: any) => void): void {
    if (callback) callback();
  }
  
  all(callback: (err: any, sessions?: session.SessionData[] | null) => void): void {
    callback(null, []);
  }
  
  length(callback: (err: any, length?: number | null) => void): void {
    callback(null, 0);
  }
  
  clear(callback?: (err?: any) => void): void {
    if (callback) callback();
  }
}

/* ORIGINAL CODE - UNCOMMENT TO RESTORE
import { IStorage } from "./storage";
import * as schema from "@shared/schema";
import { db } from "./db";
import { and, eq, desc, gte, lte, sql } from "drizzle-orm";
import { 
  User, InsertUser, Transaction, InsertTransaction, 
  GamePlay, GameHistory, ChatMessage, InsertChatMessage,
  Advertisement, InsertAdvertisement, GameSetting, GameType,
  UserRole, Currency, AdminActionType
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { createHash, randomBytes } from "crypto";

const PostgresSessionStore = connectPg(session);
*/

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create mock session store
    console.log("*** USING TEMPORARY MOCK SESSION STORE ***");
    this.sessionStore = new MockSessionStore();
  }

  // TEMPORARY MOCK IMPLEMENTATIONS
  // These methods return hardcoded data for the admin user
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    console.log("*** MOCK getUser called with ID:", id);
    
    // Return the hardcoded admin user if ID is 1
    if (id === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log("*** MOCK getUserByUsername called with username:", username);
    
    // Return the hardcoded admin user
    if (username === "admin") {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log("*** MOCK getUserByEmail called with email:", email);
    
    // Return the hardcoded admin user
    if (email === "admin@example.com") {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000", 
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log("*** MOCK createUser called with:", user);
    
    // Create a mock user with the provided data
    const newUser: User = {
      ...user,
      id: 999, // Use a high ID to avoid conflicts
      balance: "0", // New users start with 0 balance
      currency: Currency.USD,
      role: user.username === "admin" ? UserRole.ADMIN : UserRole.USER,
      isMuted: false,
      isBanned: false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
    
    return newUser;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    console.log("*** MOCK updateUser called with userId:", userId, "userData:", userData);
    
    // If it's our hardcoded admin user, return the admin user with updated fields
    if (userId === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: userData.balance || "10000",
        currency: userData.currency || Currency.USD,
        role: userData.role || UserRole.ADMIN,
        isMuted: userData.isMuted !== undefined ? userData.isMuted : false,
        isBanned: userData.isBanned !== undefined ? userData.isBanned : false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated fields for other user IDs
    return {
      id: userId,
      username: userData.username || "user" + userId,
      email: userData.email || `user${userId}@example.com`,
      phone: userData.phone || "1234567890",
      password: "password",
      balance: userData.balance || "500",
      currency: userData.currency || Currency.USD,
      role: userData.role || UserRole.USER,
      isMuted: userData.isMuted !== undefined ? userData.isMuted : false,
      isBanned: userData.isBanned !== undefined ? userData.isBanned : false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    console.log("*** MOCK updateUserRole called with userId:", userId, "role:", role);
    
    // If it's our hardcoded admin user, return the admin user with updated role
    if (userId === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: role, // Use the provided role
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated role for other user IDs
    return {
      id: userId,
      username: "user" + userId,
      email: `user${userId}@example.com`,
      phone: "1234567890",
      password: "password",
      balance: "500",
      currency: Currency.USD,
      role: role,
      isMuted: false,
      isBanned: false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User> {
    console.log("*** MOCK updateUserBalance called with userId:", userId, "newBalance:", newBalance);
    
    // If it's our hardcoded admin user, return the admin user with updated balance
    if (userId === 1) {
      return {
        id: 1,
        username: "shadowHimel",
        email: "shadow@example.com",
        phone: "01234567890",
        password: "himel1122",
        balance: newBalance,
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated balance for other user IDs
    return {
      id: userId,
      username: "user" + userId,
      email: `user${userId}@example.com`,
      phone: "1234567890",
      password: "password",
      balance: newBalance,
      currency: Currency.USD,
      role: UserRole.USER,
      isMuted: false,
      isBanned: false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async updateUserCurrency(userId: number, currency: Currency): Promise<User> {
    console.log("*** MOCK updateUserCurrency called with userId:", userId, "currency:", currency);
    
    // If it's our hardcoded admin user, return the admin user with updated currency
    if (userId === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: currency,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated currency for other user IDs
    return {
      id: userId,
      username: "user" + userId,
      email: `user${userId}@example.com`,
      phone: "1234567890",
      password: "password",
      balance: "500",
      currency: currency,
      role: UserRole.USER,
      isMuted: false,
      isBanned: false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async toggleUserMute(userId: number, isMuted: boolean): Promise<User> {
    console.log("*** MOCK toggleUserMute called with userId:", userId, "isMuted:", isMuted);
    
    // If it's our hardcoded admin user, return the admin user with updated mute status
    if (userId === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: isMuted,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated mute status for other user IDs
    return {
      id: userId,
      username: "user" + userId,
      email: `user${userId}@example.com`,
      phone: "1234567890",
      password: "password",
      balance: "500",
      currency: Currency.USD,
      role: UserRole.USER,
      isMuted: isMuted,
      isBanned: false,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async toggleUserBan(userId: number, isBanned: boolean): Promise<User> {
    console.log("*** MOCK toggleUserBan called with userId:", userId, "isBanned:", isBanned);
    
    // If it's our hardcoded admin user, return the admin user with updated ban status
    if (userId === 1) {
      return {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: isBanned,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      };
    }
    
    // Return a generic mock user with the updated ban status for other user IDs
    return {
      id: userId,
      username: "user" + userId,
      email: `user${userId}@example.com`,
      phone: "1234567890",
      password: "password",
      balance: "500",
      currency: Currency.USD,
      role: UserRole.USER,
      isMuted: false,
      isBanned: isBanned,
      createdAt: new Date(),
      ipAddress: null,
      lastLogin: new Date()
    };
  }

  async getAllUsers(): Promise<User[]> {
    console.log("*** MOCK getAllUsers called");
    
    // Return an array with our hardcoded admin user and a few mock users
    return [
      {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin1122",
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(),
        ipAddress: null,
        lastLogin: new Date()
      },
      {
        id: 2,
        username: "user2",
        email: "user2@example.com",
        phone: "9876543210",
        password: "password",
        balance: "500",
        currency: Currency.USD,
        role: UserRole.USER,
        isMuted: false,
        isBanned: false,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        ipAddress: null,
        lastLogin: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        id: 3,
        username: "user3",
        email: "user3@example.com",
        phone: "5556667777",
        password: "password",
        balance: "1200",
        currency: Currency.BDT,
        role: UserRole.USER,
        isMuted: true,
        isBanned: false,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        ipAddress: null,
        lastLogin: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ];
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    console.log("*** MOCK createTransaction called with:", transaction);
    
    // Create a mock transaction with the provided data
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.floor(Math.random() * 10000) + 1, // Random ID between 1 and 10000
      createdAt: new Date(),
      status: "completed",
      ipAddress: transaction.ipAddress || null,
      sessionId: transaction.sessionId || null,
      metadata: transaction.metadata || {}
    };
    
    return newTransaction;
  }
  
  // Add missing method for advertisements
  async getAdvertisements(): Promise<Advertisement[]> {
    console.log("*** MOCK getAdvertisements called");
    // Return empty array instead of undefined to avoid JSON parsing errors
    return [];
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    console.log("*** MOCK getUserTransactions called with userId:", userId);
    
    // Return mock transactions for the requested user
    return [
      {
        id: 101,
        userId: userId,
        amount: "100",
        currency: Currency.USD,
        type: "deposit",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        ipAddress: null,
        sessionId: null,
        metadata: {}
      },
      {
        id: 102,
        userId: userId,
        amount: "50",
        currency: Currency.USD,
        type: "bet",
        status: "completed",
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        ipAddress: null,
        sessionId: null,
        metadata: { gameType: "plinko" }
      },
      {
        id: 103,
        userId: userId,
        amount: "75",
        currency: Currency.USD,
        type: "win",
        status: "completed",
        createdAt: new Date(Date.now() - 1500000), // 25 minutes ago
        ipAddress: null,
        sessionId: null,
        metadata: { gameType: "plinko", multiplier: "1.5" }
      }
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllTransactions(): Promise<Transaction[]> {
    console.log("*** MOCK getAllTransactions called");
    
    // Return mock transactions for multiple users
    return [
      {
        id: 101,
        userId: 1,
        amount: "100",
        currency: Currency.USD,
        type: "deposit",
        status: "completed",
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        ipAddress: null,
        sessionId: null,
        metadata: {}
      },
      {
        id: 102,
        userId: 1,
        amount: "50",
        currency: Currency.USD,
        type: "bet",
        status: "completed",
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        ipAddress: null,
        sessionId: null,
        metadata: { gameType: "plinko" }
      },
      {
        id: 103,
        userId: 1,
        amount: "75",
        currency: Currency.USD,
        type: "win",
        status: "completed",
        createdAt: new Date(Date.now() - 1500000), // 25 minutes ago
        ipAddress: null,
        sessionId: null,
        metadata: { gameType: "plinko", multiplier: "1.5" }
      },
      {
        id: 201,
        userId: 2,
        amount: "200",
        currency: Currency.USD,
        type: "deposit",
        status: "completed",
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        ipAddress: null,
        sessionId: null,
        metadata: {}
      },
      {
        id: 202,
        userId: 2,
        amount: "100",
        currency: Currency.USD,
        type: "bet",
        status: "completed",
        createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
        ipAddress: null,
        sessionId: null,
        metadata: { gameType: "dice" }
      }
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Game operations
  async createGameHistory(
    gamePlay: GamePlay,
    userId: number,
    isWin: boolean,
    winAmount?: string,
    multiplier?: number,
    gameData?: any,
  ): Promise<GameHistory> {
    console.log("*** MOCK createGameHistory called with:", {
      gamePlay,
      userId,
      isWin,
      winAmount,
      multiplier,
      gameData
    });
    
    // Create a mock game history entry
    const gameHistoryEntry: GameHistory = {
      id: Math.floor(Math.random() * 10000) + 1, // Random ID between 1 and 10000
      userId,
      gameType: gamePlay.gameType,
      betAmount: gamePlay.betAmount.toString(),
      winAmount: winAmount || "0",
      multiplier: multiplier || null,
      isWin,
      currency: gamePlay.currency,
      gameData: gameData || null,
      createdAt: new Date()
    };
    
    return gameHistoryEntry;
  }

  async getUserGameHistory(userId: number): Promise<GameHistory[]> {
    console.log("*** MOCK getUserGameHistory called with userId:", userId);
    
    // Return mock game history for the user
    return [
      {
        id: 101,
        userId,
        gameType: GameType.PLINKO,
        betAmount: "50",
        winAmount: "75",
        multiplier: 1.5,
        isWin: true,
        currency: Currency.USD,
        gameData: { path: [1, 2, 3, 2, 3, 4, 5] },
        createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        id: 102,
        userId,
        gameType: GameType.DICE,
        betAmount: "25",
        winAmount: "0",
        multiplier: null,
        isWin: false,
        currency: Currency.USD,
        gameData: { roll: 45 },
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        id: 103,
        userId,
        gameType: GameType.SLOTS,
        betAmount: "10",
        winAmount: "30",
        multiplier: 3,
        isWin: true,
        currency: Currency.USD,
        gameData: { symbols: ["cherry", "cherry", "cherry"] },
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentWinners(limit: number = 10): Promise<GameHistory[]> {
    console.log("*** MOCK getRecentWinners called with limit:", limit);
    
    // Create mock recent winners data
    const mockWinners: GameHistory[] = [
      {
        id: 101,
        userId: 1,
        gameType: GameType.PLINKO,
        betAmount: "50",
        winAmount: "75",
        multiplier: 1.5,
        isWin: true,
        currency: Currency.USD,
        gameData: { path: [1, 2, 3, 2, 3, 4, 5] },
        createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        id: 202,
        userId: 2,
        gameType: GameType.DICE,
        betAmount: "100",
        winAmount: "200",
        multiplier: 2,
        isWin: true,
        currency: Currency.USD,
        gameData: { roll: 95 },
        createdAt: new Date(Date.now() - 2400000) // 40 minutes ago
      },
      {
        id: 303,
        userId: 3,
        gameType: GameType.SLOTS,
        betAmount: "10",
        winAmount: "30",
        multiplier: 3,
        isWin: true,
        currency: Currency.BDT,
        gameData: { symbols: ["cherry", "cherry", "cherry"] },
        createdAt: new Date(Date.now() - 3000000) // 50 minutes ago
      },
      {
        id: 404,
        userId: 1,
        gameType: GameType.PLINKO,
        betAmount: "25",
        winAmount: "100",
        multiplier: 4,
        isWin: true,
        currency: Currency.USD,
        gameData: { path: [2, 2, 1, 1, 0, 0, 1] },
        createdAt: new Date(Date.now() - 3600000) // 60 minutes ago
      },
      {
        id: 505,
        userId: 2,
        gameType: GameType.DICE,
        betAmount: "50",
        winAmount: "250",
        multiplier: 5,
        isWin: true,
        currency: Currency.USD,
        gameData: { roll: 99 },
        createdAt: new Date(Date.now() - 4200000) // 70 minutes ago
      }
    ];
    
    // Sort by date descending and limit to the requested number
    return mockWinners
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Chat operations
  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    console.log("*** MOCK createChatMessage called with:", chatMessage);
    
    // Create a mock chat message with the provided data
    const createdMessage: ChatMessage = {
      ...chatMessage,
      id: Math.floor(Math.random() * 10000) + 1, // Random ID between 1 and 10000
      createdAt: new Date()
    };
    
    return createdMessage;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    console.log("*** MOCK getRecentChatMessages called with limit:", limit);
    
    // Create mock chat messages based on the actual schema
    const mockMessages: ChatMessage[] = [
      {
        id: 1,
        userId: 1,
        message: "Welcome to the chat!",
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        id: 2,
        userId: 2,
        message: "Hello everyone!",
        createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
      },
      {
        id: 3,
        userId: 3,
        message: "Just won big on Plinko!",
        createdAt: new Date(Date.now() - 900000) // 15 minutes ago
      },
      {
        id: 4,
        userId: 1,
        message: "Congratulations user3!",
        createdAt: new Date(Date.now() - 600000) // 10 minutes ago
      },
      {
        id: 5,
        userId: 1, // System messages should come from admin (userId 1)
        message: "user2 just won 500 USD on Dice!",
        createdAt: new Date(Date.now() - 300000) // 5 minutes ago
      }
    ];
    
    // Sort by date descending and limit to the requested number
    return mockMessages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Advertisement operations
  async createAdvertisement(
    advertisement: InsertAdvertisement,
  ): Promise<Advertisement> {
    console.log("*** MOCK createAdvertisement called with:", advertisement);
    
    // Create a mock advertisement with the provided data
    const createdAd: Advertisement = {
      ...advertisement,
      id: Math.floor(Math.random() * 10000) + 1, // Random ID between 1 and 10000
      createdAt: new Date()
    };
    
    return createdAd;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    console.log("*** MOCK getAdvertisements called");
    
    // Return mock advertisements matching the schema
    return [
      {
        id: 1,
        script: "<div class='ad-banner'>Welcome Bonus - Get 500 USD when you sign up today!</div>",
        createdBy: 1, // Admin user created it
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 2,
        script: "<div class='ad-banner'>Weekend Bonus - Double your winnings this weekend!</div>",
        createdBy: 1, // Admin user created it
        createdAt: new Date(Date.now() - 43200000) // 12 hours ago
      }
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteAdvertisement(id: number): Promise<void> {
    console.log(`*** MOCK deleteAdvertisement called with id: ${id}`);
    // In a mock implementation, there's nothing to delete
    // Just log the call and return
    return;
  }

  // Game settings operations
  async getGameSettings(gameType: GameType): Promise<GameSetting | undefined> {
    console.log(`*** MOCK getGameSettings called with gameType: ${gameType}`);
    
    // Define default settings for each game type
    const gameSettings: Record<GameType, GameSetting> = {
      [GameType.PLINKO]: {
        id: 1,
        gameType: GameType.PLINKO,
        winChance: 45,
        maxMultiplier: 4.5,
        updatedBy: 1,
        lastUpdated: new Date(Date.now() - 43200000) // 12 hours ago
      },
      [GameType.DICE]: {
        id: 2,
        gameType: GameType.DICE,
        winChance: 49,
        maxMultiplier: 2.0,
        updatedBy: 1,
        lastUpdated: new Date(Date.now() - 86400000) // 1 day ago
      },
      [GameType.SLOTS]: {
        id: 3,
        gameType: GameType.SLOTS,
        winChance: 30,
        maxMultiplier: 10.0,
        updatedBy: 1,
        lastUpdated: new Date(Date.now() - 129600000) // 1.5 days ago
      }
    };
    
    return gameSettings[gameType];
  }

  async updateGameSettings(
    gameType: GameType,
    winChance: number,
    maxMultiplier: number,
    updatedBy: number,
  ): Promise<GameSetting> {
    console.log(`*** MOCK updateGameSettings called with:`, {
      gameType,
      winChance,
      maxMultiplier,
      updatedBy
    });
    
    // Just return a mock updated setting
    return {
      id: gameType === GameType.PLINKO ? 1 : (gameType === GameType.DICE ? 2 : 3),
      gameType,
      winChance,
      maxMultiplier,
      updatedBy,
      lastUpdated: new Date() // Now
    };
  }

  // Admin operations
  async logAdminAction(
    adminId: number,
    actionType: AdminActionType,
    targetUserId?: number,
    details?: any,
  ): Promise<void> {
    console.log("*** MOCK logAdminAction called with:", {
      adminId,
      actionType,
      targetUserId,
      details
    });
    
    // No need to actually store anything in a mock implementation
    return;
  }
}