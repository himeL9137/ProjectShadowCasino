import { Express, Request, Response } from "express";
import { authenticateJWT } from "./auth";
import { GameType, Currency, GamePlay } from "@shared/schema";
import { BalanceManager } from "./balance-manager";
import { storage } from "./storage";

// Interface for game play data
interface GamePlayData {
  gameType: GameType;
  betAmount: number;
  currency: Currency;
  sessionId?: string;
  ipAddress?: string;
}

/**
 * Sets up game transaction routes for handling bets and wins
 * This file centralizes all game-related money transactions for consistency
 * @param app Express application
 */
export function setupGameTransactions(app: Express) {
  // Place a bet - handles validation and balance updates
  app.post("/api/games/bet", authenticateJWT, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "You must be logged in to place bets" 
      });
    }

    try {
      // Support both formats for backward compatibility
      const { 
        gameType, 
        betAmount, 
        amount, // Support for older clients that use 'amount' 
        currency
      } = req.body;

      // Use betAmount if provided, otherwise fall back to amount
      const actualBetAmount = betAmount || amount;

      // Always use user's actual currency from their profile
      // This ensures consistency between what the user sees and what gets processed
      const userCurrency = req.user.currency as Currency;

      // Log for debugging
      console.log(`Game bet request - User currency: ${userCurrency}, Requested currency: ${currency || 'Not specified'}`);

      // Validate inputs
      if (!gameType || !Object.values(GameType).includes(gameType as GameType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid game type",
          validOptions: Object.values(GameType)
        });
      }

      if (!actualBetAmount || typeof actualBetAmount !== "number" || actualBetAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid bet amount",
          details: "Bet amount must be a positive number"
        });
      }

      // If client sent a currency different from user's saved currency, 
      // notify them of the discrepancy (for debugging/audit purposes)
      if (currency && currency !== userCurrency) {
        console.warn(`Currency mismatch in bet: Client sent ${currency}, but user's currency is ${userCurrency}`);
      }

      // Validate currency only for logging purposes
      if (currency && !Object.values(Currency).includes(currency as Currency)) {
        console.warn(`Client sent invalid currency: ${currency}`);
      }

      try {
        // Generate session ID for tracking related transactions
        const sessionId = req.body.sessionId || require('uuid').v4();
        const ipAddress = req.ip || req.socket.remoteAddress || null;

        // Track performance and reliability of bet processing
        console.log(`[GAME BET] Processing bet for user ${req.user.id}: ${actualBetAmount} ${userCurrency}`);
        const betStartTime = Date.now();

        // Always use the user's profile currency for transactions
        // This is the critical fix for the currency mismatch bug
        // HIGH PRIORITY: Ensure atomic update with immediate balance return
        console.log(`[CRITICAL TRANSACTION] Processing bet with atomic update for user ${req.user.id}`);
        const result = await BalanceManager.processBet(
          req.user.id,
          gameType as GameType,
          actualBetAmount,
          userCurrency, // ALWAYS USE USER'S CURRENCY FROM PROFILE
          {
            gameType,
            sessionId,
            ipAddress,
            timestamp: new Date().toISOString(),
            priority: "high" // Mark as high priority for atomic processing
          }
        );

        const betProcessTime = Date.now() - betStartTime;
        console.log(`[GAME BET] Bet processed in ${betProcessTime}ms for user ${req.user.id}. New balance: ${result.user.balance} ${result.user.currency}`);

        // Create GamePlay object for history tracking
        const gamePlayData: GamePlay = {
          gameType: gameType as GameType,
          betAmount: actualBetAmount,
          currency: userCurrency, // Use user's currency from profile
          sessionId: sessionId,
          ipAddress: ipAddress || undefined
        };

        // Create game history record
        const gameHistory = await storage.createGameHistory(
          gamePlayData,
          req.user.id,
          false, // Not a win
          "0", // No win amount
          0, // No multiplier
          { 
            timestamp: new Date().toISOString()
          } // Additional game data
        );

        // CRITICAL FIX: Enhanced response with complete balance information
        // This ensures frontend can immediately update wallet without waiting for WebSocket
        return res.status(200).json({
          success: true,
          message: `Bet placed: ${actualBetAmount} ${userCurrency}`,
          // Enhanced balance information for immediate UI update
          balanceData: {
            current: result.user.balance,
            currency: result.user.currency, 
            previousBalance: result.user.previousBalance || null,
            change: `-${actualBetAmount}`,
            timestamp: new Date().toISOString(),
            transactionId: result.transaction?.id || null
          },
          // Maintain backward compatibility 
          balance: result.user.balance,
          currency: result.user.currency,
          transaction: result.transaction,
          gameHistory,
          // Include full user data for immediate state updates
          user: result.user
        });
      } catch (error) {
        // Specific handling for insufficient funds
        if (error instanceof Error && error.message.includes("Insufficient funds")) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
        throw error; // Re-throw for general handling
      }
    } catch (error) {
      console.error("Bet processing error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing your bet",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Record a win - handles validation and balance updates
  app.post("/api/games/win", authenticateJWT, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to record wins"
      });
    }

    try {
      // Support both formats for backward compatibility
      const { 
        gameType, 
        winAmount, 
        amount, // Support for older clients that use 'amount'
        multiplier = 1.0,
        currency = req.user.currency,
        gameData = {} 
      } = req.body;

      // Use winAmount if provided, otherwise fall back to amount
      const actualWinAmount = winAmount || amount;

      // Validate inputs
      // Validate game type - must be one of the supported types
      const validGameTypes = Object.values(GameType);
      const normalizedGameType = gameType.toString().toUpperCase();

      // Check if the normalized game type matches any valid types
      const isValidGameType = validGameTypes.some(validType => 
        validType.toString().toUpperCase() === normalizedGameType
      );

      if (!isValidGameType) {
        console.error(`Invalid game type received: ${gameType}. Valid types: ${validGameTypes.join(', ')}`);
        return res.status(400).json({ 
          success: false, 
          message: `Invalid game type: ${gameType}. Supported types: ${validGameTypes.join(', ')}` 
        });
      }

      if (!actualWinAmount || typeof actualWinAmount !== "number" || actualWinAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid win amount",
          details: "Win amount must be a positive number"
        });
      }

      // Validate currency
      if (!Object.values(Currency).includes(currency as Currency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid currency",
          validOptions: Object.values(Currency)
        });
      }

      // Get or generate session ID for tracking related transactions
      const sessionId = req.body.sessionId || gameData.sessionId || require('uuid').v4();
      const ipAddress = req.ip || req.socket.remoteAddress || gameData.ipAddress || null;

      // Process the win through the balance manager with performance tracking
      console.log(`[GAME WIN] Processing win for user ${req.user.id}: ${actualWinAmount} ${currency} (x${multiplier})`);
      const winStartTime = Date.now();

      // Process the win through the balance manager with HIGH PRIORITY for atomic update
      console.log(`[CRITICAL TRANSACTION] Processing win with atomic update for user ${req.user.id}`);
      const result = await BalanceManager.processWin(
        req.user.id,
        gameType as GameType,
        actualWinAmount,
        currency as Currency,
        multiplier,
        {
          gameType,
          sessionId,
          ipAddress,
          timestamp: new Date().toISOString(),
          priority: "high", // Mark as high priority for atomic processing
          immediate: true   // Flag for immediate processing
        }
      );

      const winProcessTime = Date.now() - winStartTime;
      console.log(`[GAME WIN] Win processed in ${winProcessTime}ms for user ${req.user.id}. New balance: ${result.user.balance} ${result.user.currency}`);

      // Create GamePlay object for history tracking
      const gamePlayData: GamePlay = {
        gameType: gameType as GameType,
        betAmount: actualWinAmount,  // For wins, this is recorded as the amount won
        currency: currency as Currency,
        sessionId: sessionId,
        ipAddress: ipAddress || undefined
      };

      // Create game history record
      const gameHistory = await storage.createGameHistory(
        gamePlayData,
        req.user.id,
        true, // Is a win
        actualWinAmount.toString(),
        multiplier,
        {
          ...gameData,
          timestamp: new Date().toISOString()
        }
      );

      return res.status(200).json({
        success: true,
        message: `Win recorded: ${winAmount} ${currency} (x${multiplier})`,
        balance: result.user.balance,
        currency: result.user.currency,
        transaction: result.transaction,
        gameHistory
      });
    } catch (error) {
      console.error("Win processing error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing your win",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get recent winners for leaderboard
  app.get("/api/games/winners", async (_req: Request, res: Response) => {
    try {
      const winners = await storage.getRecentWinners(10);
      return res.status(200).json(winners);
    } catch (error) {
      console.error("Error fetching winners:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching recent winners",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get user game history
  app.get("/api/games/history", authenticateJWT, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to view your game history"
      });
    }

    try {
      const gameHistory = await storage.getUserGameHistory(req.user.id);
      return res.status(200).json(gameHistory);
    } catch (error) {
      console.error("Error fetching game history:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching your game history",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}