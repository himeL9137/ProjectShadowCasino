import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameResultSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get games by category
  app.get("/api/games/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const games = await storage.getGamesByCategory(category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games by category" });
    }
  });

  // Get featured games
  app.get("/api/games/featured", async (req, res) => {
    try {
      const games = await storage.getFeaturedGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured games" });
    }
  });

  // Search games
  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const games = await storage.searchGames(query);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  // Get single game
  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Get user (assuming userId 1 for demo)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user stats
  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(1);
      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Play game (mock gameplay)
  app.post("/api/games/:id/play", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { betAmount } = req.body;
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      if (!betAmount || parseFloat(betAmount) <= 0) {
        return res.status(400).json({ message: "Invalid bet amount" });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      const bet = parseFloat(betAmount);

      if (currentBalance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Mock game logic
      const isWin = Math.random() > 0.4; // 60% win chance
      const winMultiplier = Math.random() * 10 + 0.1; // 0.1x to 10x multiplier
      const winAmount = isWin ? bet * winMultiplier : 0;
      const newBalance = currentBalance - bet + winAmount;

      // Update user balance
      await storage.updateUserBalance(1, newBalance.toFixed(2));

      // Create game result
      const gameResult = await storage.createGameResult({
        userId: 1,
        gameId,
        betAmount: bet.toString(),
        winAmount: winAmount.toString(),
        result: JSON.stringify({ 
          isWin, 
          multiplier: winMultiplier, 
          gameType: game.category 
        }),
      });

      // Update user stats
      const currentStats = await storage.getUserStats(1);
      if (currentStats) {
        const updatedStats = {
          totalBets: (currentStats.totalBets || 0) + 1,
          totalWins: (currentStats.totalWins || 0) + (isWin ? 1 : 0),
          biggestWin: Math.max(parseFloat(currentStats.biggestWin || "0"), winAmount).toString(),
        };
        await storage.updateUserStats(1, updatedStats);
      }

      res.json({
        gameResult,
        newBalance: newBalance.toFixed(2),
        isWin,
        winAmount: winAmount.toFixed(2),
        multiplier: winMultiplier.toFixed(2),
      });
    } catch (error) {
      console.error("Game play error:", error);
      res.status(500).json({ message: "Failed to play game" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
