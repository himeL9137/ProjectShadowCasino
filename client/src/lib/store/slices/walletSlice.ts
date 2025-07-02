import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WalletState {
  balance: string;
  currency: string;
  conversionRates: {
    [key: string]: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: '0',
  currency: 'USD',
  conversionRates: {
    USD: 1,
    BDT: 108.28,
    INR: 82.3,
    BTC: 0.00001482,
  },
  isLoading: false,
  error: null,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
      state.error = null; // Clear any previous errors
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
    updateRates: (state, action: PayloadAction<{ [key: string]: number }>) => {
      state.conversionRates = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // New reducer for handling a complete wallet update
    updateWallet: (state, action: PayloadAction<{balance: string, currency: string}>) => {
      state.balance = action.payload.balance;
      state.currency = action.payload.currency;
      state.error = null;
    },
  },
});

export const { updateBalance, setCurrency, updateRates, setLoading, setError, updateWallet } = walletSlice.actions;

export default walletSlice.reducer;