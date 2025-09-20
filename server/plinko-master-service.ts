
export interface PlinkoMasterOptions {
  forceWin?: boolean;
  forceLose?: boolean;
  numBalls?: number;
  risk?: 'low' | 'medium' | 'high';
  rows?: number;
}

export interface PlinkoMasterResult {
  slotIndex: number;
  multiplier: number;
  payout: number;
  profit: number;
  result: "WIN" | "LOSS" | "BREAK-EVEN";
  ballPath: number[];
  isWin: boolean;
  risk: 'low' | 'medium' | 'high';
  rows: number;
}

export class PlinkoMasterService {
  // Stake.com authentic multiplier patterns for 16 rows
  private static readonly MULTIPLIER_PATTERNS = {
    low: [16, 9, 2, 1.4, 1.2, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16],           // Low Risk: Max 16x
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.5, 1, 1.5, 3, 5, 10, 41, 110],          // Medium Risk: Max 110x (user requested)
    high: [1000, 130, 26, 8, 3, 1.5, 1, 0.2, 0.2, 1, 1.5, 3, 8, 26, 130, 1000]         // High Risk: Max 1000x
  };
  
  private static readonly ROWS = 16;

  /**
   * Simulate a realistic ball drop through pins
   * @param startPosition Starting position (default: center)
   * @returns Array of directions (0 = left, 1 = right) for each row
   */
  static simulateBallPath(startPosition: number = 7.5): number[] {
    const ballPath: number[] = [];
    let currentPosition = startPosition;
    
    for (let row = 0; row < this.ROWS; row++) {
      // Each pin hit has 50/50 chance to go left (0) or right (1)
      const direction = Math.random() > 0.5 ? 1 : 0;
      ballPath.push(direction);
      
      // Update position based on direction
      currentPosition += direction === 1 ? 0.5 : -0.5;
    }
    
    return ballPath;
  }

  /**
   * Calculate final slot index based on ball path
   * @param ballPath Array of directions
   * @param startPosition Starting position
   * @returns Final slot index (0-15)
   */
  static calculateSlotIndex(ballPath: number[], startPosition: number = 7.5): number {
    let position = startPosition;
    
    for (const direction of ballPath) {
      position += direction === 1 ? 0.5 : -0.5;
    }
    
    // Round to nearest slot and clamp to valid range (always 16 slots)
    const slotIndex = Math.round(position);
    return Math.max(0, Math.min(slotIndex, 15)); // 16 slots = indices 0-15
  }

  /**
   * Get multiplier array for a specific risk level
   * @param risk Risk level
   * @returns Array of multipliers
   */
  static getMultipliers(risk: 'low' | 'medium' | 'high' = 'medium'): number[] {
    return [...this.MULTIPLIER_PATTERNS[risk]];
  }

  /**
   * Apply rigging to force specific outcomes
   * @param forceWin Force a winning outcome
   * @param forceLose Force a losing outcome
   * @param risk Risk level to determine multiplier pattern
   * @returns Forced slot index or null if no rigging
   */
  static applyRigging(forceWin?: boolean, forceLose?: boolean, risk: 'low' | 'medium' | 'high' = 'medium'): number | null {
    const multipliers = this.getMultipliers(risk);
    
    if (forceWin) {
      // Get all winning slots (multiplier >= 1.0)
      const winningSlots = multipliers
        .map((mult, idx) => ({ mult, idx }))
        .filter(slot => slot.mult >= 1.0)
        .map(slot => slot.idx);
      
      return winningSlots[Math.floor(Math.random() * winningSlots.length)];
    }
    
    if (forceLose) {
      // Get all losing slots (multiplier < 1.0)
      const losingSlots = multipliers
        .map((mult, idx) => ({ mult, idx }))
        .filter(slot => slot.mult < 1.0)
        .map(slot => slot.idx);
      
      return losingSlots[Math.floor(Math.random() * losingSlots.length)];
    }
    
    return null;
  }

  /**
   * Play a single Plinko Master game
   * @param betAmount Bet amount in currency
   * @param options Game options (rigging, risk level, etc.)
   * @returns Game result with all calculations
   */
  static playGame(betAmount: number, options: PlinkoMasterOptions = {}): PlinkoMasterResult {
    const risk = options.risk || 'medium';
    const rows = options.rows || 16;
    const multipliers = this.getMultipliers(risk);
    
    let slotIndex: number;
    let ballPath: number[];
    
    // Check for rigging first
    if (options.forceWin) {
      slotIndex = this.applyRigging(true, false, risk) || 0;
      ballPath = this.generatePathToSlot(slotIndex);
    } else if (options.forceLose) {
      slotIndex = this.applyRigging(false, true, risk) || 0;
      ballPath = this.generatePathToSlot(slotIndex);
    } else {
      // Simulate realistic ball drop through pins
      ballPath = this.simulateBallPath();
      slotIndex = this.calculateSlotIndex(ballPath);
    }
    
    // Get multiplier for the slot
    const multiplier = multipliers[slotIndex];
    
    // Calculate payout and profit with 2 decimal precision
    const payout = parseFloat((betAmount * multiplier).toFixed(2));
    const profit = parseFloat((payout - betAmount).toFixed(2));
    
    // Determine result type
    let result: "WIN" | "LOSS" | "BREAK-EVEN";
    if (payout > betAmount) {
      result = "WIN";
    } else if (payout < betAmount) {
      result = "LOSS";
    } else {
      result = "BREAK-EVEN";
    }
    
    return {
      slotIndex,
      multiplier,
      payout,
      profit,
      result,
      ballPath,
      isWin: result === "WIN",
      risk,
      rows
    };
  }

  /**
   * Generate a ball path that leads to a specific slot
   * @param targetSlot Target slot index (0-15)
   * @returns Ball path that leads to the target slot
   */
  static generatePathToSlot(targetSlot: number): number[] {
    const ballPath: number[] = [];
    const startPosition = 7.5;
    let currentPosition = startPosition;
    const targetPosition = targetSlot;
    
    for (let row = 0; row < this.ROWS; row++) {
      // Calculate how far we need to move to reach target
      const remainingRows = this.ROWS - row;
      const requiredMovement = targetPosition - currentPosition;
      
      // Decide direction based on required movement and some randomness
      let direction: number;
      
      if (remainingRows === 0) {
        direction = Math.random() > 0.5 ? 1 : 0;
      } else {
        const idealDirection = requiredMovement > 0 ? 1 : 0;
        const maxPossibleMovement = remainingRows * 0.5;
        
        // If we can still reach the target with some randomness
        if (Math.abs(requiredMovement) <= maxPossibleMovement) {
          // 70% chance to move in ideal direction, 30% random
          direction = Math.random() < 0.7 ? idealDirection : (Math.random() > 0.5 ? 1 : 0);
        } else {
          // Must move in ideal direction
          direction = idealDirection;
        }
      }
      
      ballPath.push(direction);
      currentPosition += direction === 1 ? 0.5 : -0.5;
    }
    
    return ballPath;
  }

  /**
   * Get multiplier for a specific slot
   * @param slotIndex Slot index (0-15)
   * @param risk Risk level
   * @returns Multiplier value
   */
  static getMultiplier(slotIndex: number, risk: 'low' | 'medium' | 'high' = 'medium'): number {
    const multipliers = this.getMultipliers(risk);
    if (slotIndex < 0 || slotIndex >= multipliers.length) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }
    return multipliers[slotIndex];
  }

  /**
   * Get all multipliers for a specific risk level
   * @param risk Risk level
   * @returns Array of all multipliers
   */
  static getAllMultipliers(risk: 'low' | 'medium' | 'high' = 'medium'): number[] {
    return this.getMultipliers(risk);
  }
}
