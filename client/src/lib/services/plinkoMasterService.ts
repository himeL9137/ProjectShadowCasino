
import { apiRequest } from "@/lib/queryClient";

export interface PlinkoMasterGameRequest {
  gameType: "PLINKO_MASTER";
  betAmount: number;
  currency: string;
  forceWin?: boolean;
  forceLose?: boolean;
  numBalls?: number;
  risk?: 'low' | 'medium' | 'high';
  rows?: number;
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
   * Get multiplier array for specific risk level (same as backend logic)
   * @param risk Risk level
   * @returns Array of 16 multipliers
   */
  static getMultipliers(risk: 'low' | 'medium' | 'high' = 'medium'): number[] {
    const patterns = {
      low: [16, 9, 2, 1.4, 1.2, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16],           // Low Risk: Max 16x
      medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.5, 1, 1.5, 3, 5, 10, 41, 110],          // Medium Risk: Max 110x 
      high: [1000, 130, 26, 8, 3, 1.5, 1, 0.2, 0.2, 1, 1.5, 3, 8, 26, 130, 1000]         // High Risk: Max 1000x
    };
    return [...patterns[risk]];
  }

  /**
   * Get multiplier color based on value
   * @param multiplier Multiplier value
   * @returns CSS color class
   */
  static getMultiplierColor(multiplier: number): string {
    if (multiplier >= 100) return "text-red-500";      // 100x+ = Red (very high)
    if (multiplier >= 10) return "text-orange-500";    // 10x-99x = Orange (high)
    if (multiplier >= 2) return "text-yellow-500";     // 2x-9x = Yellow (medium-high)
    if (multiplier >= 1) return "text-green-400";      // 1x+ = Green (positive)
    return "text-gray-400";                             // <1x = Gray (loss)
  }
}
