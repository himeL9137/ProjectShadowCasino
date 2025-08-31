import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  jsonb,
  real,
  numeric,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define currency enum
export enum Currency {
  // Main currencies
  USD = "USD",
  BDT = "BDT",
  INR = "INR",
  BTC = "BTC",
  JPY = "JPY",
  
  // Additional major currencies
  EUR = "EUR",
  GBP = "GBP",
  CAD = "CAD",
  AUD = "AUD",
  CNY = "CNY",
  
  // European currencies
  CHF = "CHF",
  SEK = "SEK",
  NOK = "NOK",
  DKK = "DKK",
  PLN = "PLN",
  
  // Asian currencies
  HKD = "HKD",
  SGD = "SGD",
  THB = "THB",
  KRW = "KRW",
  IDR = "IDR",
  
  // Middle Eastern currencies
  AED = "AED",
  SAR = "SAR",
  TRY = "TRY",
  ILS = "ILS",
  QAR = "QAR",
  
  // Americas currencies
  MXN = "MXN",
  BRL = "BRL",
  ARS = "ARS",
  CLP = "CLP",
  COP = "COP",
  
  // African currencies
  ZAR = "ZAR",
  NGN = "NGN",
  EGP = "EGP",
  KES = "KES",
  GHS = "GHS",
  
  // Other cryptocurrencies
  ETH = "ETH",
  USDT = "USDT",
  XRP = "XRP",
  LTC = "LTC",
}

// Define user roles
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Define game types
export enum GameType {
  SLOTS = "slots",
  DICE = "dice",
  PLINKO = "plinko",
  PLINKO_MASTER = "plinko_master",
  MINES = "mines",
  HTML = "html",
}

// Define transaction types
export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  WIN = "win",
  ADMIN_ADJUSTMENT = "admin_adjustment",
  CURRENCY_CHANGE = "currency_change",
  REFERRAL_BONUS = "referral_bonus",
  REFERRAL_COMMISSION = "referral_commission",
}

// Define admin action types
export enum AdminActionType {
  EDIT_BALANCE = "edit_balance",
  APPROVE_WITHDRAWAL = "approve_withdrawal",
  APPROVE_DEPOSIT = "approve_deposit",
  BAN_USER = "ban_user",
  UNBAN_USER = "unban_user",
  MUTE_USER = "mute_user",
  UNMUTE_USER = "unmute_user",
  EDIT_GAME_ODDS = "edit_game_odds",
  ADD_ADVERTISEMENT = "add_advertisement",
  EDIT_ADVERTISEMENT = "edit_advertisement",
  DELETE_ADVERTISEMENT = "delete_advertisement",
  CREATE_GAME = "create_game",
  EDIT_GAME = "edit_game",
  DELETE_GAME = "delete_game",
  VIEW_USER_DETAILS = "view_user_details",
  EXPORT_USER_DATA = "export_user_data",
  SYSTEM_MAINTENANCE = "system_maintenance",
  CHANGE_USER_ROLE = "change_user_role",
  RESET_USER_PASSWORD = "reset_user_password",
  LOGIN_AS_USER = "login_as_user",
}

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // User ID (string)
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Casino system fields
  username: text("username").unique(),
  phone: text("phone"),
  password: text("password"),
  rawPassword: text("raw_password"),
  balance: numeric("balance").notNull().default("0"),
  currency: text("currency").notNull().default(Currency.USD),
  role: text("role").notNull().default(UserRole.USER),
  isMuted: boolean("is_muted").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Admin panel tracking fields
  ipAddress: text("ip_address"),
  lastLogin: timestamp("last_login"),
  lastSeen: timestamp("last_seen"),
  isOnline: boolean("is_online").notNull().default(false),
  // Referral system fields
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by").references((): any => users.id),
  totalReferrals: integer("total_referrals").notNull().default(0),
  referralEarnings: numeric("referral_earnings").notNull().default("0"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  status: text("status").default("pending"),
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  metadata: json("metadata").default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Game history table
export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  gameType: text("game_type").notNull(),
  betAmount: numeric("bet_amount").notNull(),
  winAmount: numeric("win_amount"),
  multiplier: real("multiplier"),
  isWin: boolean("is_win").notNull(),
  currency: text("currency").notNull(),
  gameData: json("game_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin actions table
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  details: json("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat logs table
export const chatLogs = pgTable("chat_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Advertisements table
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  script: text("script").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
});

// Game settings table
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  gameType: text("game_type")
    .notNull()
    .unique(),
  winChance: real("win_chance").notNull().default(10), // percentage
  maxMultiplier: real("max_multiplier").notNull().default(1.1),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Schema for user registration
export const insertUserSchema = createInsertSchema(users);

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Schema for inserting transactions
export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  currency: true,
  status: true,
  sessionId: true,
  ipAddress: true,
  metadata: true,
});

// GamePlay interface for game operations
export interface GamePlay {
  gameType: GameType;
  betAmount: number | string;
  currency: Currency;
  sessionId?: string;
  ipAddress?: string;
  // Mines game specific properties
  mineCount?: number;
  selectedTiles?: number[];
  action?: string;
  // Dice game specific properties
  prediction?: number;
  rollOver?: boolean;
  clientSeed?: string;
  nonce?: number;
}

// Schema for game play
export const gamePlaySchema = z.object({
  gameType: z.enum([GameType.SLOTS, GameType.DICE, GameType.PLINKO, GameType.MINES]),
  betAmount: z.number().positive(),
  currency: z.enum([Currency.USD, Currency.BDT, Currency.INR, Currency.BTC, Currency.JPY]),
});

// Schema for inserting chat messages
export const insertChatMessageSchema = createInsertSchema(chatLogs).pick({
  userId: true,
  message: true,
});

// Schema for inserting advertisements
export const insertAdvertisementSchema = createInsertSchema(
  advertisements,
).pick({
  script: true,
  createdBy: true,
});

// Schema for fund adjustment by admin
export const fundAdjustmentSchema = z.object({
  amount: z.string()
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Amount must be a valid number",
    })
    .refine(val => parseFloat(val) !== 0, {
      message: "Amount cannot be zero",
    }),
  currency: z.enum([Currency.USD, Currency.BDT, Currency.INR, Currency.BTC, Currency.JPY]),
  reason: z.string().optional(),
  confirmed: z.boolean().default(false),
});

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type FundAdjustment = z.infer<typeof fundAdjustmentSchema>;

export type GameHistory = typeof gameHistory.$inferSelect;

export type ChatMessage = typeof chatLogs.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;

export type GameSetting = typeof gameSettings.$inferSelect;

// Custom games table for all types of games
export const customGames = pgTable("custom_games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("html"), // html, tsx, js, react, etc.
  htmlContent: text("html_content"), // For HTML games
  filePath: text("file_path"), // For uploaded file-based games
  originalFileName: text("original_file_name"), // Original uploaded file name
  fileExtension: text("file_extension"), // .tsx, .js, .html, etc.
  gameCode: text("game_code"), // Processed/compiled game code
  thumbnailUrl: text("thumbnail_url"), // Preview image
  category: text("category").notNull().default("casino"), // casino, card, puzzle, arcade
  tags: text("tags").array().default([]), // searchable tags
  winChance: real("win_chance").notNull().default(50),
  maxMultiplier: real("max_multiplier").notNull().default(2.0),
  minBet: numeric("min_bet").notNull().default("1"),
  maxBet: numeric("max_bet").notNull().default("1000"),
  description: text("description"),
  instructions: text("instructions"), // How to play instructions
  isActive: boolean("is_active").notNull().default(true),
  isApproved: boolean("is_approved").notNull().default(false), // Admin approval required
  installationStatus: text("installation_status").notNull().default("pending"), // pending, processing, installed, failed
  errorLog: text("error_log"), // Installation/compilation errors
  playCount: integer("play_count").notNull().default(0), // Track popularity
  lastPlayed: timestamp("last_played"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
});

// Schema for inserting custom games
export const insertCustomGameSchema = createInsertSchema(customGames).pick({
  name: true,
  type: true,
  htmlContent: true,
  filePath: true,
  originalFileName: true,
  fileExtension: true,
  gameCode: true,
  thumbnailUrl: true,
  category: true,
  tags: true,
  winChance: true,
  maxMultiplier: true,
  minBet: true,
  maxBet: true,
  description: true,
  instructions: true,
  createdBy: true,
});

// Schema for uploading game files
export const gameFileUploadSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  category: z.string().default("casino"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  winChance: z.number().min(1).max(99).default(50),
  maxMultiplier: z.number().min(1).max(100).default(2.0),
  minBet: z.string().default("1"),
  maxBet: z.string().default("1000"),
  tags: z.array(z.string()).default([]),
});

// Type definitions for custom games
export type CustomGame = typeof customGames.$inferSelect;
export type InsertCustomGame = z.infer<typeof insertCustomGameSchema>;
export type GameFileUpload = z.infer<typeof gameFileUploadSchema>;

// Referrals table - tracks individual referral relationships and bonuses
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id")
    .notNull()
    .references(() => users.id), // User who made the referral
  refereeId: varchar("referee_id")
    .notNull()
    .references(() => users.id), // User who was referred
  referralCode: text("referral_code").notNull(), // Code used for referral
  bonusAmount: numeric("bonus_amount").notNull().default("0"), // Bonus given to referrer
  commissionRate: real("commission_rate").notNull().default(5.0), // Percentage commission (5%)
  status: text("status").notNull().default("pending"), // pending, active, rewarded
  firstDepositDate: timestamp("first_deposit_date"), // When referee made first deposit
  totalEarnings: numeric("total_earnings").notNull().default("0"), // Total earned from this referral
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Referral settings table - configurable referral program settings
export const referralSettings = pgTable("referral_settings", {
  id: serial("id").primaryKey(),
  signupBonus: numeric("signup_bonus").notNull().default("30"), // Bonus for successful referral (30 BDT)
  commissionRate: real("commission_rate").notNull().default(5.0), // Default commission rate
  minimumDeposit: numeric("minimum_deposit").notNull().default("0"), // No minimum deposit required
  maxCommissionPerUser: numeric("max_commission_per_user").default("1000"), // Max earnings per referral
  maxReferralsPerUser: integer("max_referrals_per_user").notNull().default(3), // Max 3 referrals per user
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Schema for referral operations
export const referralActionSchema = z.object({
  referralCode: z.string().min(3, "Referral code is required"),
});

// Type definitions for referrals
export type Referral = typeof referrals.$inferSelect;
export type ReferralSettings = typeof referralSettings.$inferSelect;
export type ReferralAction = z.infer<typeof referralActionSchema>;

// Redirect links table - manages automatic redirects for users
export const redirectLinks = pgTable("redirect_links", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(), // URL to redirect to
  intervalMinutes: integer("interval_minutes").notNull().default(5), // Interval in minutes
  isActive: boolean("is_active").notNull().default(true), // Whether the redirect is active
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
}, (table) => ({
  activeIdx: index("redirect_links_active_idx").on(table.isActive),
}));

// Schema for inserting redirect links
export const insertRedirectLinkSchema = createInsertSchema(redirectLinks).pick({
  url: true,
  intervalMinutes: true,
  isActive: true,
  createdBy: true,
}).extend({
  url: z.string().url("Invalid URL format"),
  intervalMinutes: z.number().min(1, "Interval must be at least 1 minute"),
});

// Schema for updating redirect links
export const updateRedirectLinkSchema = createInsertSchema(redirectLinks).pick({
  url: true,
  intervalMinutes: true,
  isActive: true,
}).extend({
  url: z.string().url("Invalid URL format").optional(),
  intervalMinutes: z.number().min(1, "Interval must be at least 1 minute").optional(),
  isActive: z.boolean().optional(),
});

// Type definitions for redirect links
export type RedirectLink = typeof redirectLinks.$inferSelect;
export type InsertRedirectLink = z.infer<typeof insertRedirectLinkSchema>;
export type UpdateRedirectLink = z.infer<typeof updateRedirectLinkSchema>;
