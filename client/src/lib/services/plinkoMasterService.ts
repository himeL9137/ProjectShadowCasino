
import { apiRequest } from "@/lib/queryClient";

export interface PlinkoMasterGameRequest {
  gameType: "PLINKO_MASTER";
  betAmount: number;
  currency: string;
  forceWin?: boolean;
  forceLose?: boolean;
  numBalls?: number;
}

export interface PlinkoMasterGameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance: string;
  gameData: {
    slotIndex: number;
    ballPath: number[];
    multiplier: number;
    result: "WIN" | "LOSS" | "BREAK-EVEN";
    profit: number;
    payout: number;
    newBalance: string;
  };
}

export class PlinkoMasterService {
  /**
   * Play a Plinko Master game
   * @param gameRequest Game request parameters
   * @returns Promise with game result
   */
  static async playGame(gameRequest: PlinkoMasterGameRequest): Promise<PlinkoMasterGameResult> {
    console.log("PlinkoMasterService: Playing game with request:", gameRequest);
    
    const response = await apiRequest("POST", "/api/games/play", gameRequest);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to play Plinko Master game");
    }
    
    const result = await response.json() as PlinkoMasterGameResult;
    console.log("PlinkoMasterService: Game result:", result);
    
    return result;
  }

  /**
   * Validate bet amount
   * @param betAmount Bet amount to validate
   * @param userBalance User's current balance
   * @returns Validation result
   */
  static validateBetAmount(betAmount: number, userBalance: number): { isValid: boolean; message?: string } {
    if (isNaN(betAmount) || betAmount <= 0) {
      return { isValid: false, message: "Please enter a valid bet amount" };
    }
    
    if (betAmount < 0.01) {
      return { isValid: false, message: "Minimum bet amount is 0.01" };
    }
    
    if (betAmount > userBalance) {
      return { isValid: false, message: "Insufficient balance" };
    }
    
    return { isValid: true };
  }

  /**
   * Format currency amount
   * @param amount Amount to format
   * @param currency Currency code
   * @returns Formatted currency string
   */
  static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'BDT' ? 'USD' : currency, // Use USD formatting for BDT
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('$', currency === 'BDT' ? '৳' : '$');
  }

  /**
   * Calculate potential payout
   * @param betAmount Bet amount
   * @param multiplier Multiplier value
   * @returns Potential payout
   */
  static calculatePayout(betAmount: number, multiplier: number): number {
    return parseFloat((betAmount * multiplier).toFixed(2));
  }

  /**
   * Get multiplier array (same as backend and HTML logic)
   * @returns Array of multipliers
   */
  static getMultipliers(): number[] {
    return [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8];
  }

  /**
   * Get multiplier color based on value
   * @param multiplier Multiplier value
   * @returns CSS color class
   */
  static getMultiplierColor(multiplier: number): string {
    if (multiplier >= 2.0) return "text-red-400";
    if (multiplier >= 1.4) return "text-orange-400";
    if (multiplier >= 1.0) return "text-green-400";
    if (multiplier >= 0.6) return "text-yellow-400";
    return "text-gray-400";
  }
}
