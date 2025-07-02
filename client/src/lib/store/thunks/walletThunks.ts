import { createAsyncThunk } from '@reduxjs/toolkit';
import { walletService } from '../../services/walletService';
import { updateBalance, setCurrency, updateRates, setLoading, setError } from '../slices/walletSlice';
import { toast } from 'react-toastify';

// Thunk to fetch user's balance
export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await walletService.getBalance();
      dispatch(updateBalance(response.balance));
      dispatch(setCurrency(response.currency));
      dispatch(setLoading(false));
      return response;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setError('Failed to fetch balance'));
      toast.error('Failed to fetch balance. Please try again.');
      throw error;
    }
  }
);

// Thunk to change user's currency preference
export const changeCurrency = createAsyncThunk(
  'wallet/changeCurrency',
  async (currency: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await walletService.changeCurrency(currency);
      dispatch(updateBalance(response.newBalance));
      dispatch(setCurrency(response.newCurrency));
      dispatch(setLoading(false));
      toast.success(`Currency changed from ${response.oldCurrency} to ${response.newCurrency}`);
      return response;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setError('Failed to change currency'));
      toast.error('Failed to change currency. Please try again.');
      throw error;
    }
  }
);

// Thunk to fetch exchange rates
export const fetchExchangeRates = createAsyncThunk(
  'wallet/fetchExchangeRates',
  async (_, { dispatch }) => {
    try {
      const response = await walletService.getExchangeRates();
      dispatch(updateRates(response.rates));
      return response;
    } catch (error) {
      dispatch(setError('Failed to fetch exchange rates'));
      toast.error('Failed to fetch exchange rates. Using default values.');
      throw error;
    }
  }
);

// Helper function for game betting/winning
export const updateBalanceForGame = createAsyncThunk(
  'wallet/updateBalanceForGame',
  async (
    { amount, gameType, isWin }: { amount: number; gameType: string; isWin: boolean },
    { dispatch }
  ) => {
    try {
      dispatch(setLoading(true));
      
      // For bets, pre-emptively update UI to show immediate feedback
      if (!isWin) {
        // Get current balance from Redux store
        const state = (window as any).store?.getState?.();
        const currentBalance = state?.wallet?.balance || '0';
        const currentCurrency = state?.wallet?.currency || 'USD';
        
        // Calculate and display temporary balance (optimistic update)
        const numericBalance = parseFloat(currentBalance);
        const newBalance = Math.max(0, numericBalance - amount).toFixed(2);
        
        // Update UI immediately (optimistic update)
        dispatch(updateBalance(newBalance));
        console.log(`Optimistic balance update for bet: ${numericBalance} -> ${newBalance} ${currentCurrency}`);
      }
      
      // Make the actual API call
      const response = await walletService.updateBalance(amount, gameType, isWin);
      
      // Update with server-confirmed balance
      dispatch(updateBalance(response.balance));
      dispatch(setCurrency(response.currency));
      dispatch(setLoading(false));
      
      // Show success notification for wins
      if (isWin) {
        toast.success(`You won ${amount}!`);
      }
      
      console.log(`Balance updated from server: ${response.balance} ${response.currency}`);
      return response;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setError(`Failed to ${isWin ? 'process win' : 'place bet'}`));
      toast.error(`Failed to ${isWin ? 'process win' : 'place bet'}. Please try again.`);
      
      // Refresh balance to ensure accuracy after error
      dispatch(fetchBalance());
      throw error;
    }
  }
);