// Real-time Balance Management System
// Ensures instant balance updates across all games and currencies

import { api } from './api';

export interface BalanceUpdate {
  balance: string;
  currency: string;
  previousBalance?: string;
  change: string;
  timestamp: string;
  transactionId?: string;
  gameType?: string;
  isWin?: boolean;
}

export interface GameTransaction {
  gameType: 'SLOTS' | 'DICE' | 'PLINKO';
  amount: number;
  currency: string;
  isWin: boolean;
  multiplier?: number;
  gameData?: any;
}

class RealTimeBalanceManager {
  private balanceCache: Map<string, string> = new Map();
  private pendingTransactions: Set<string> = new Set();
  private listeners: Array<(update: BalanceUpdate) => void> = [];
  private websocket: WebSocket | null = null;

  // Subscribe to balance updates
  onBalanceUpdate(callback: (update: BalanceUpdate) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  // Notify all listeners of balance updates
  private notifyListeners(update: BalanceUpdate) {
    console.log(`[BALANCE UPDATE] ${update.change} ${update.currency} - New Balance: ${update.balance}`);
    this.listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in balance update listener:', error);
      }
    });
  }

  // Set up WebSocket for real-time updates
  setupWebSocket(websocket: WebSocket) {
    this.websocket = websocket;
    
    websocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle balance update messages from server
        if (data.type === 'balance_update') {
          this.handleServerBalanceUpdate(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }

  // Handle balance updates from server WebSocket
  private handleServerBalanceUpdate(data: BalanceUpdate) {
    // Update cache
    this.balanceCache.set(data.currency, data.balance);
    
    // Notify listeners
    this.notifyListeners(data);
  }

  // Process game transaction with instant balance update
  async processGameTransaction(transaction: GameTransaction): Promise<BalanceUpdate> {
    const transactionId = `${Date.now()}_${Math.random()}`;
    this.pendingTransactions.add(transactionId);

    try {
      console.log(`[GAME TRANSACTION] Processing ${transaction.isWin ? 'WIN' : 'BET'}: ${transaction.amount} ${transaction.currency}`);
      
      // First, optimistically update the UI
      const currentBalance = parseFloat(this.balanceCache.get(transaction.currency) || '0');
      const balanceChange = transaction.isWin ? transaction.amount : -transaction.amount;
      const newBalance = (currentBalance + balanceChange).toFixed(2);
      
      // Create optimistic update
      const optimisticUpdate: BalanceUpdate = {
        balance: newBalance,
        currency: transaction.currency,
        previousBalance: currentBalance.toFixed(2),
        change: transaction.isWin ? `+${transaction.amount}` : `-${transaction.amount}`,
        timestamp: new Date().toISOString(),
        transactionId,
        gameType: transaction.gameType,
        isWin: transaction.isWin
      };

      // Update cache and notify listeners immediately
      this.balanceCache.set(transaction.currency, newBalance);
      this.notifyListeners(optimisticUpdate);

      // Then process the server transaction
      const endpoint = transaction.isWin ? '/api/games/win' : '/api/games/bet';
      const payload = transaction.isWin ? {
        gameType: transaction.gameType,
        winAmount: transaction.amount,
        currency: transaction.currency,
        multiplier: transaction.multiplier || 1,
        gameData: transaction.gameData || {},
        transactionId
      } : {
        gameType: transaction.gameType,
        betAmount: transaction.amount,
        currency: transaction.currency,
        transactionId
      };

      const response = await api.post(endpoint, payload);
      
      if (!response.ok) {
        // Revert optimistic update on error
        this.balanceCache.set(transaction.currency, currentBalance.toFixed(2));
        const revertUpdate: BalanceUpdate = {
          balance: currentBalance.toFixed(2),
          currency: transaction.currency,
          previousBalance: newBalance,
          change: transaction.isWin ? `-${transaction.amount}` : `+${transaction.amount}`,
          timestamp: new Date().toISOString(),
          transactionId: `${transactionId}_revert`
        };
        this.notifyListeners(revertUpdate);
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transaction failed');
      }

      const serverData = await response.json();
      
      // Confirm server balance matches our optimistic update
      if (serverData.balance !== newBalance) {
        console.warn(`[BALANCE SYNC] Optimistic update mismatch. Expected: ${newBalance}, Server: ${serverData.balance}`);
        
        // Update with server's authoritative balance
        const correctedUpdate: BalanceUpdate = {
          balance: serverData.balance,
          currency: serverData.currency,
          previousBalance: currentBalance.toFixed(2),
          change: transaction.isWin ? `+${transaction.amount}` : `-${transaction.amount}`,
          timestamp: new Date().toISOString(),
          transactionId: serverData.transaction?.id || transactionId,
          gameType: transaction.gameType,
          isWin: transaction.isWin
        };
        
        this.balanceCache.set(serverData.currency, serverData.balance);
        this.notifyListeners(correctedUpdate);
        
        return correctedUpdate;
      }

      // Return confirmed update
      return {
        ...optimisticUpdate,
        transactionId: serverData.transaction?.id || transactionId
      };

    } catch (error) {
      console.error(`[GAME TRANSACTION ERROR] ${error.message}`);
      throw error;
    } finally {
      this.pendingTransactions.delete(transactionId);
    }
  }

  // Get current cached balance
  getCurrentBalance(currency: string): string | null {
    return this.balanceCache.get(currency) || null;
  }

  // Update balance cache (called when fetching from server)
  updateBalanceCache(currency: string, balance: string) {
    this.balanceCache.set(currency, balance);
  }

  // Check if there are pending transactions
  hasPendingTransactions(): boolean {
    return this.pendingTransactions.size > 0;
  }

  // Currency conversion for multi-currency support
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    try {
      const response = await api.get('/api/exchange-rates');
      const data = await response.json();
      
      if (data.rates && data.rates[toCurrency] && data.rates[fromCurrency]) {
        // Convert through base currency (USD)
        const amountInBase = amount / data.rates[fromCurrency];
        const convertedAmount = amountInBase * data.rates[toCurrency];
        return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
      }
      
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realTimeBalance = new RealTimeBalanceManager();

// Convenience functions for games
export const placeBet = (gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number, currency: string) =>
  realTimeBalance.processGameTransaction({
    gameType,
    amount,
    currency,
    isWin: false
  });

export const recordWin = (gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number, currency: string, multiplier?: number, gameData?: any) =>
  realTimeBalance.processGameTransaction({
    gameType,
    amount,
    currency,
    isWin: true,
    multiplier,
    gameData
  });