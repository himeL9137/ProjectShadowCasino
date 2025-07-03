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

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID (string)
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy fields for backward compatibility with existing casino system
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
}

// Schema for game play
export const gamePlaySchema = z.object({
  gameType: z.enum([GameType.SLOTS, GameType.DICE, GameType.PLINKO]),
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

// User types for Replit Auth and legacy compatibility
export type UpsertUser = typeof users.$inferInsert;
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

// Custom games table for HTML games
export const customGames = pgTable("custom_games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("html"),
  htmlContent: text("html_content").notNull(),
  winChance: real("win_chance").notNull().default(50),
  maxMultiplier: real("max_multiplier").notNull().default(2.0),
  minBet: numeric("min_bet").notNull().default("1"),
  maxBet: numeric("max_bet").notNull().default("1000"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id),
});

// Schema for inserting custom games
export const insertCustomGameSchema = createInsertSchema(customGames).pick({
  name: true,
  type: true,
  htmlContent: true,
  winChance: true,
  maxMultiplier: true,
  minBet: true,
  maxBet: true,
  description: true,
  createdBy: true,
});

// Type definitions for custom games
export type CustomGame = typeof customGames.$inferSelect;
export type InsertCustomGame = z.infer<typeof insertCustomGameSchema>;

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
