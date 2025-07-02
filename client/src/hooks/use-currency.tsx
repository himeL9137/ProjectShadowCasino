import { useContext } from 'react';
import { CurrencyContext } from '@/providers/CurrencyProvider';
import { Currency } from '@shared/schema';

interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  ageInMinutes: number;
}

export interface CurrencyContextType {
  currency: Currency;
  balance: string;
  setCurrency: (newCurrency: Currency) => Promise<void>;
  formattedBalance: string;
  isChangingCurrency: boolean;
  isBalanceRefreshing: boolean;
  getCurrencySymbol: (currency: Currency) => string;
  formatAmount: (amount: number | string, currency?: Currency) => string;
  availableCurrencies: Currency[];
  exchangeRates: ExchangeRate | null;
  isLoadingRates: boolean;
  getConversionRate: (fromCurrency: Currency, toCurrency: Currency) => number | null;
  convertAmount: (amount: number | string, fromCurrency: Currency, toCurrency: Currency) => number | null;
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  
  return context;
}