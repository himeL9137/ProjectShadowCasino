import { store } from '../store';
import { fetchBalance } from '../store/thunks/walletThunks';
import * as api from '../api';

/**
 * Game integration service to handle betting and winning
 * This provides a unified interface for all games to update balance
 */
export const gameService = {
  /**
   * Process a bet for any game
   * @param betAmount The amount to bet in the user's currency
   * @param gameType The type of game (plinko, slots, dice, etc.)
   * @returns Promise with success flag and updated balance
   */
  placeBet: async (betAmount: number, gameType: string): Promise<{ success: boolean; balance?: string }> => {
    try {
      if (betAmount <= 0) {
        throw new Error('Bet amount must be greater than zero');
      }
      
      // Make a direct API call to games/bet to ensure it's using server API
      const response = await api.post('/api/games/bet', {
        betAmount: betAmount,
        gameType,
        currency: 'USD' // Default to USD
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place bet');
      }
      
      const result = await response.json();
      
      // Force refresh balance from server
      store.dispatch(fetchBalance());
      
      console.log('Bet placed successfully:', result);
      
      return {
        success: true,
        balance: result.balance
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      return {
        success: false
      };
    }
  },
  
  /**
   * Process a win for any game
   * @param winAmount The amount won in the user's currency
   * @param gameType The type of game (plinko, slots, dice, etc.)
   * @returns Promise with success flag and updated balance
   */
  processWin: async (winAmount: number, gameType: string): Promise<{ success: boolean; balance?: string }> => {
    try {
      if (winAmount <= 0) {
        throw new Error('Win amount must be greater than zero');
      }
      
      // Make a direct API call to games/win to ensure it's using server API
      const response = await api.post('/api/games/win', {
        winAmount: winAmount,
        gameType,
        currency: 'USD' // Default to USD
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process win');
      }
      
      const result = await response.json();
      
      // Force refresh balance from server
      store.dispatch(fetchBalance());
      
      console.log('Win processed successfully:', result);
      
      return {
        success: true,
        balance: result.balance
      };
    } catch (error) {
      console.error('Error processing win:', error);
      return {
        success: false
      };
    }
  }
};