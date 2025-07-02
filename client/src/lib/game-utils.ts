// Game utility functions for Shadow Casino

/**
 * Check if a player is allowed to win based on their balance
 * Players with balance ≥ 150 BDT (or equivalent) cannot win
 * 
 * @param balance Player's current balance
 * @param currency Currency of the balance
 * @returns boolean - false if player cannot win due to balance threshold
 */
export function canPlayerWin(balance: string, currency: string): boolean {
  const numericBalance = parseFloat(balance);
  
  // Convert balance to BDT for threshold check
  let balanceInBDT = numericBalance;
  
  switch (currency) {
    case 'USD':
      balanceInBDT = numericBalance * 121.85; // 1 USD ≈ 121.85 BDT
      break;
    case 'INR':
      balanceInBDT = numericBalance * 1.46; // 1 INR ≈ 1.46 BDT
      break;
    case 'BTC':
      balanceInBDT = numericBalance * 4939000; // 1 BTC ≈ 4,939,000 BDT (approximate)
      break;
    case 'BDT':
    default:
      // Already in BDT
      break;
  }
  
  // If balance is ≥ 150 BDT, the player cannot win
  return balanceInBDT < 150;
}

/**
 * Determine if the player wins based on rigged RNG with house edge
 * Win rate is adjusted based on player's balance threshold
 * 
 * @param balance Player's current balance
 * @param currency Currency of the balance
 * @returns boolean - true if player wins, false if player loses
 */
export function determineWin(balance: string, currency: string): boolean {
  // If player is above the threshold, they cannot win
  if (!canPlayerWin(balance, currency)) {
    return false;
  }
  
  // Base win chance: approximately 45% (house edge)
  const winChance = 0.45;
  
  // Generate random number between 0 and 1
  const randomValue = Math.random();
  
  // Return true if random value is less than win chance
  return randomValue < winChance;
}

/**
 * Calculate winnings based on bet amount
 * If player wins, they get 1.1x their bet
 * 
 * @param betAmount Amount bet by the player
 * @param isWin Whether the player won
 * @returns number - The amount won (0 if player lost)
 */
export function calculateWinnings(betAmount: number, isWin: boolean): number {
  if (!isWin) {
    return 0;
  }
  
  // Player gets 1.1x their bet if they win
  return betAmount * 1.1;
}

/**
 * Generate game results for the slot machine
 * Returns symbols for each reel
 * 
 * @param isWin Whether this spin is a win
 * @returns Array of symbols for the slot reels
 */
export function generateSlotResults(isWin: boolean): string[] {
  const symbols = ['🍎', '🍊', '🍋', '🍒', '🍇', '🔔', '💎', '7️⃣'];
  
  if (isWin) {
    // For a win, all symbols are the same
    const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    return [winSymbol, winSymbol, winSymbol];
  } else {
    // For a loss, ensure at least one symbol is different
    const firstSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    let secondSymbol = firstSymbol;
    let thirdSymbol = firstSymbol;
    
    // Make sure at least one symbol is different
    while (secondSymbol === firstSymbol && thirdSymbol === firstSymbol) {
      if (Math.random() > 0.5) {
        secondSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      } else {
        thirdSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      }
    }
    
    return [firstSymbol, secondSymbol, thirdSymbol];
  }
}

/**
 * Generate dice roll result
 * 
 * @param isWin Whether this roll is a win
 * @returns Number between 1-6 for the dice
 */
export function generateDiceResult(isWin: boolean): number {
  // For simplicity, we'll have 4-6 as winning rolls, 1-3 as losing rolls
  if (isWin) {
    return Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
  } else {
    return Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
  }
}

/**
 * Generate plinko drop result
 * 
 * @param isWin Whether this drop is a win
 * @returns Multiplier value for the plinko drop
 */
export function generatePlinkoResult(isWin: boolean): number {
  if (isWin) {
    // Winning multipliers (1.1x to 2x)
    const winMultipliers = [1.1, 1.2, 1.3, 1.5, 1.7, 2.0];
    return winMultipliers[Math.floor(Math.random() * winMultipliers.length)];
  } else {
    // Losing multipliers (0x to 0.9x)
    const loseMultipliers = [0, 0.1, 0.3, 0.5, 0.7, 0.9];
    return loseMultipliers[Math.floor(Math.random() * loseMultipliers.length)];
  }
}

/**
 * Format currency values based on the selected currency
 * 
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string): string {
  switch (currency) {
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'BDT':
      return `৳${amount.toFixed(2)}`;
    case 'INR':
      return `₹${amount.toFixed(2)}`;
    case 'BTC':
      return `₿${amount.toFixed(8)}`;
    default:
      return `${amount.toFixed(2)}`;
  }
}

/**
 * Convert amount between currencies
 * 
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Converted amount
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // First convert to USD as base
  let amountInUSD = amount;
  
  switch (fromCurrency) {
    case 'BDT':
      amountInUSD = amount / 121.85; // 1 USD = 121.85 BDT
      break;
    case 'INR':
      amountInUSD = amount / 83.27; // 1 USD = 83.27 INR
      break;
    case 'BTC':
      amountInUSD = amount * 40530; // 1 BTC = $40,530 USD (approximate)
      break;
    case 'USD':
    default:
      // Already in USD
      break;
  }
  
  // Then convert from USD to target currency
  switch (toCurrency) {
    case 'BDT':
      return amountInUSD * 121.85;
    case 'INR':
      return amountInUSD * 83.27;
    case 'BTC':
      return amountInUSD / 40530;
    case 'USD':
    default:
      return amountInUSD;
  }
}

// WhatsApp utility for payment system
export function getWhatsAppLink(phone: string, message: string = ""): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}