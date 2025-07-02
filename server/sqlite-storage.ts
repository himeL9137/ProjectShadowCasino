import { 
  User, 
  InsertUser, 
  Currency, 
  UserRole, 
  Transaction, 
  InsertTransaction, 
  GameHistory, 
  GamePlay, 
  GameType,
  ChatMessage,
  InsertChatMessage,
  Advertisement,
  InsertAdvertisement,
  GameSetting,
  AdminActionType 
} from "@shared/schema";
import { IStorage } from "./storage";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import Database from "better-sqlite3";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class SQLiteStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private dbInstance: Database.Database;
  sessionStore: any; // Using any to resolve type conflicts with memorystore

  constructor(dbPath: string = "shadow-casino.db") {
    // Initialize SQLite database
    this.dbInstance = new Database(dbPath);
    this.db = drizzle(this.dbInstance);

    // Create memory store for sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });

    // Initialize the database with tables and admin users
    this.initializeDatabase();
    this.initializeAdminUsers();
    this.initializeGameSettings();
  }

  private initializeDatabase() {
    // Create tables if they don't exist
    this.dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password TEXT NOT NULL,
        balance TEXT NOT NULL DEFAULT '0',
        currency TEXT NOT NULL DEFAULT 'USD',
        role TEXT NOT NULL DEFAULT 'user',
        is_muted INTEGER NOT NULL DEFAULT 0,
        is_banned INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount TEXT NOT NULL,
        type TEXT NOT NULL,
        currency TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        bet_amount TEXT NOT NULL,
        win_amount TEXT,
        multiplier REAL,
        is_win INTEGER NOT NULL,
        currency TEXT NOT NULL,
        game_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        target_user_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users (id),
        FOREIGN KEY (target_user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        html TEXT NOT NULL,
        frequency INTEGER NOT NULL DEFAULT 5,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS game_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_type TEXT NOT NULL UNIQUE,
        win_chance REAL NOT NULL DEFAULT 10,
        max_multiplier REAL NOT NULL DEFAULT 1.1,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users (id)
      );
    `);
  }

  private async initializeAdminUsers() {
    // Utility function to hash password for admin initialization
    async function hashAdminPassword(password: string) {
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString("hex");
      const scryptAsync = (await import('util')).promisify(crypto.scrypt);
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${buf.toString("hex")}.${salt}`;
    }

    // Admin user: shadowHimel
    const shadowHimel = await this.getUserByUsername("shadowHimel");
    if (!shadowHimel) {
      const hashedPassword = await hashAdminPassword("himel1122");
      const user = await this.createUser({
        username: "shadowHimel",
        email: "shadow@example.com",
        phone: "01234567890",
        password: hashedPassword,
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false
      });
      console.log("Created admin user shadowHimel with role:", user.role);
    } else if (shadowHimel.role !== UserRole.ADMIN) {
      // Update role if not admin
      await this.updateUserRole(shadowHimel.id, UserRole.ADMIN);
      console.log("Updated shadowHimel to admin role");
    }

    // Admin user: Albab AJ
    const albabAJ = await this.getUserByUsername("Albab AJ");
    if (!albabAJ) {
      const hashedPassword = await hashAdminPassword("albab1122");
      const user = await this.createUser({
        username: "Albab AJ",
        email: "albab@example.com",
        phone: "09876543210", 
        password: hashedPassword,
        balance: "10000",
        currency: Currency.USD,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false
      });
      console.log("Created admin user Albab AJ with role:", user.role);
    } else if (albabAJ.role !== UserRole.ADMIN) {
      // Update role if not admin
      await this.updateUserRole(albabAJ.id, UserRole.ADMIN);
      console.log("Updated Albab AJ to admin role");
    }
  }

  private async initializeGameSettings() {
    // Initialize default game settings for each game type
    const gameTypes = [GameType.SLOTS, GameType.DICE, GameType.PLINKO];

    for (const gameType of gameTypes) {
      const setting = await this.getGameSettings(gameType);
      if (!setting) {
        const stmt = this.dbInstance.prepare(`
          INSERT INTO game_settings (game_type, win_chance, max_multiplier)
          VALUES (?, ?, ?)
        `);
        stmt.run(gameType, 10, 1.1);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const stmt = this.dbInstance.prepare("SELECT * FROM users WHERE id = ?");
    const user = stmt.get(id) as User | undefined;
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = this.dbInstance.prepare("SELECT * FROM users WHERE username = ?");
    const user = stmt.get(username) as User | undefined;
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const stmt = this.dbInstance.prepare("SELECT * FROM users WHERE email = ?");
    const user = stmt.get(email) as User | undefined;
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO users (username, email, phone, password, balance, currency, role, is_muted, is_banned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      insertUser.username,
      insertUser.email,
      insertUser.phone,
      insertUser.password,
      insertUser.balance || "0",
      insertUser.currency || Currency.USD,
      insertUser.role || UserRole.USER,
      insertUser.isMuted ? 1 : 0,
      insertUser.isBanned ? 1 : 0
    );

    console.log(`User created: ${insertUser.username}, role: ${insertUser.role}`);

    const user = await this.getUser(info.lastInsertRowid as number);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  async updateUserBalance(userId: string | number, newBalance: string): Promise<User> {
    // Atomic balance update with single query
    const query = `
      UPDATE users 
      SET balance = (
        SELECT CAST(CAST(balance AS DECIMAL) + CAST(? AS DECIMAL) AS TEXT)
        FROM users WHERE id = ?
      )
      WHERE id = ?
      RETURNING *`;

    const result = await this.dbInstance.prepare(query).get(newBalance, userId, userId);
    if (!result) throw new Error(`User ${userId} not found`);
    return result as User;
  }

  async updateUserCurrency(userId: number, currency: Currency): Promise<User> {
    const stmt = this.dbInstance.prepare("UPDATE users SET currency = ? WHERE id = ?");
    stmt.run(currency, userId);

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async toggleUserMute(userId: number, isMuted: boolean): Promise<User> {
    const stmt = this.dbInstance.prepare("UPDATE users SET is_muted = ? WHERE id = ?");
    stmt.run(isMuted ? 1 : 0, userId);

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async toggleUserBan(userId: number, isBanned: boolean): Promise<User> {
    const stmt = this.dbInstance.prepare("UPDATE users SET is_banned = ? WHERE id = ?");
    stmt.run(isBanned ? 1 : 0, userId);

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const stmt = this.dbInstance.prepare("UPDATE users SET role = ? WHERE id = ?");
    stmt.run(role, userId);

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const stmt = this.dbInstance.prepare("SELECT * FROM users");
    const users = stmt.all() as User[];
    return users;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO transactions (user_id, amount, type, currency)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
      transaction.userId,
      transaction.amount,
      transaction.type,
      transaction.currency
    );

    const selectStmt = this.dbInstance.prepare("SELECT * FROM transactions WHERE id = ?");
    const newTransaction = selectStmt.get(info.lastInsertRowid) as Transaction;

    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const stmt = this.dbInstance.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC");
    const transactions = stmt.all(userId) as Transaction[];
    return transactions;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const stmt = this.dbInstance.prepare("SELECT * FROM transactions ORDER BY created_at DESC");
    const transactions = stmt.all() as Transaction[];
    return transactions;
  }

  // Game operations
  async createGameHistory(
    gamePlay: GamePlay, 
    userId: number, 
    isWin: boolean, 
    winAmount?: string, 
    multiplier?: number, 
    gameData?: any
  ): Promise<GameHistory> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO game_history (user_id, game_type, bet_amount, win_amount, multiplier, is_win, currency, game_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      userId,
      gamePlay.gameType,
      gamePlay.betAmount.toString(),
      winAmount || "0",
      multiplier || 0,
      isWin ? 1 : 0,
      gamePlay.currency,
      gameData ? JSON.stringify(gameData) : null
    );

    const selectStmt = this.dbInstance.prepare("SELECT * FROM game_history WHERE id = ?");
    const gameHistory = selectStmt.get(info.lastInsertRowid) as GameHistory;

    // Parse game_data back from JSON string
    if (gameHistory.gameData && typeof gameHistory.gameData === 'string') {
      gameHistory.gameData = JSON.parse(gameHistory.gameData);
    }

    return gameHistory;
  }

  async getUserGameHistory(userId: number): Promise<GameHistory[]> {
    const stmt = this.dbInstance.prepare("SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC");
    const history = stmt.all(userId) as GameHistory[];

    // Parse game_data back from JSON strings
    return history.map(game => {
      if (game.gameData && typeof game.gameData === 'string') {
        game.gameData = JSON.parse(game.gameData);
      }
      return game;
    });
  }

  async getRecentWinners(limit: number = 10): Promise<GameHistory[]> {
    const stmt = this.dbInstance.prepare(`
      SELECT gh.*, u.username
      FROM game_history gh
      JOIN users u ON gh.user_id = u.id
      WHERE gh.is_win = 1
      ORDER BY gh.created_at DESC
      LIMIT ?
    `);

    const winners = stmt.all(limit) as (GameHistory & { username: string })[];

    // Parse game_data back from JSON strings
    return winners.map(game => {
      if (game.gameData && typeof game.gameData === 'string') {
        game.gameData = JSON.parse(game.gameData);
      }
      return game;
    });
  }

  // Chat operations
  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO chat_logs (user_id, message)
      VALUES (?, ?)
    `);

    const info = stmt.run(
      chatMessage.userId,
      chatMessage.message
    );

    const selectStmt = this.dbInstance.prepare("SELECT * FROM chat_logs WHERE id = ?");
    const newChatMessage = selectStmt.get(info.lastInsertRowid) as ChatMessage;

    return newChatMessage;
  }

  async getRecentChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const stmt = this.dbInstance.prepare(`
      SELECT cl.*, u.username
      FROM chat_logs cl
      JOIN users u ON cl.user_id = u.id
      ORDER BY cl.created_at DESC
      LIMIT ?
    `);

    const messages = stmt.all(limit) as (ChatMessage & { username: string })[];
    return messages.reverse(); // Return in chronological order
  }

  // Advertisement operations
  async createAdvertisement(advertisement: InsertAdvertisement): Promise<Advertisement> {
    // If this ad is set as default, remove default status from other ads
    if (advertisement.isDefault) {
      const updateStmt = this.dbInstance.prepare(`
        UPDATE advertisements SET is_default = 0 WHERE is_default = 1
      `);
      updateStmt.run();
    }

    const stmt = this.dbInstance.prepare(`
      INSERT INTO advertisements (html, frequency, is_enabled, is_default, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      advertisement.html,
      advertisement.frequency || 5,
      advertisement.isEnabled ? 1 : 0,
      advertisement.isDefault ? 1 : 0,
      advertisement.createdBy
    );

    const selectStmt = this.dbInstance.prepare("SELECT * FROM advertisements WHERE id = ?");
    const newAdvertisement = selectStmt.get(info.lastInsertRowid) as Advertisement;

    return newAdvertisement;
  }

  async getAdvertisements(): Promise<Advertisement[]> {
    const stmt = this.dbInstance.prepare("SELECT * FROM advertisements ORDER BY created_at DESC");
    const advertisements = stmt.all() as Advertisement[];
    return advertisements;
  }

  async deleteAdvertisement(id: number): Promise<void> {
    const stmt = this.dbInstance.prepare("DELETE FROM advertisements WHERE id = ?");
    stmt.run(id);
  }

  // Game settings operations
  async getGameSettings(gameType: GameType): Promise<GameSetting | undefined> {
    const stmt = this.dbInstance.prepare("SELECT * FROM game_settings WHERE game_type = ?");
    const settings = stmt.get(gameType) as GameSetting | undefined;
    return settings;
  }

  async updateGameSettings(gameType: GameType, winChance: number, maxMultiplier: number, updatedBy: number): Promise<GameSetting> {
    const stmt = this.dbInstance.prepare(`
      UPDATE game_settings 
      SET win_chance = ?, max_multiplier = ?, updated_by = ?, last_updated = CURRENT_TIMESTAMP
      WHERE game_type = ?
    `);

    stmt.run(winChance, maxMultiplier, updatedBy, gameType);

    const setting = await this.getGameSettings(gameType);
    if (!setting) {
      throw new Error("Failed to update game settings");
    }

    return setting;
  }

  // Admin operations
  async logAdminAction(adminId: number, actionType: AdminActionType, targetUserId?: number, details?: any): Promise<void> {
    const stmt = this.dbInstance.prepare(`
      INSERT INTO admin_actions (admin_id, action_type, target_user_id, details)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      adminId,
      actionType,
      targetUserId || null,
      details ? JSON.stringify(details) : null
    );
  }
}