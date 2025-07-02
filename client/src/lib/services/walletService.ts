import * as api from '../api';

interface BalanceResponse {
  balance: string;
  currency: string;
}

interface CurrencyChangeResponse {
  message: string;
  oldCurrency: string;
  newCurrency: string;
  oldBalance: string;
  newBalance: string;
}

interface ExchangeRatesResponse {
  base: string;
  rates: {
    [key: string]: number;
  };
  lastUpdated: string;
  ageInMinutes: number;
}

// Service for wallet-related API calls
export const walletService = {
  // Get current user balance
  getBalance: async (): Promise<BalanceResponse> => {
    const response = await api.get('/api/wallet/balance');
    return await response.json();
  },

  // Change user's currency preference
  changeCurrency: async (currency: string): Promise<CurrencyChangeResponse> => {
    const response = await api.post('/api/wallet/change-currency', { currency });
    return await response.json();
  },

  // Get exchange rates
  getExchangeRates: async (): Promise<ExchangeRatesResponse> => {
    const response = await api.get('/api/exchange-rates');
    return await response.json();
  },

  // Update user balance (for bets and wins)
  updateBalance: async (amount: number, gameType: string, isWin: boolean): Promise<BalanceResponse> => {
    const endpoint = isWin ? '/api/games/win' : '/api/games/bet';
    console.log(`Processing ${isWin ? 'win' : 'bet'}: ${amount} for ${gameType}`);
    
    // Get the current user data to ensure we have current currency
    const currentUser = await api.get('/api/wallet/balance').then(res => res.json());
    
    const response = await api.post(endpoint, {
      winAmount: isWin ? amount : undefined,  // Only for wins
      betAmount: !isWin ? amount : undefined, // Only for bets
      gameType,
      currency: currentUser.currency, // Use current user currency instead of hardcoded USD
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update balance');
    }
    
    const data = await response.json();
    console.log(`Balance update successful: ${data.balance} ${data.currency}`);
    return {
      balance: data.balance,
      currency: data.currency,
    };
  },
};