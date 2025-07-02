import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("10000.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'slots', 'table', 'live', 'originals'
  provider: text("provider").notNull(),
  image: text("image").notNull(),
  rtp: decimal("rtp", { precision: 5, scale: 2 }),
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  isHot: boolean("is_hot").default(false),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  result: text("result"), // JSON string for game-specific results
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalBets: integer("total_bets").default(0),
  totalWins: integer("total_wins").default(0),
  biggestWin: decimal("biggest_win", { precision: 10, scale: 2 }).default("0.00"),
  favoriteGame: text("favorite_game"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
});

export const insertGameResultSchema = createInsertSchema(gameResults).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
