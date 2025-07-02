import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "./WebSocketProvider";
import { Currency } from "@shared/schema";
import { 
  formatCurrency, 
  getCurrencySymbol, 
  saveUserCurrencyPreference, 
  getUserCurrencyPreference,
  dispatchCurrencyChangeEvent
} from "@/lib/currency-utils";

interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  ageInMinutes: number;
}

interface CurrencyContextType {
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

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected } = useWebSocket();
  
  // Default to USD or user's currency if available
  const initialCurrency = user?.currency as Currency || Currency.USD;
  const savedCurrency = getUserCurrencyPreference();
  
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [balance, setBalance] = useState<string>(user?.balance || "0");
  const [isChangingCurrency, setIsChangingCurrency] = useState(false);
  const [isBalanceRefreshing, setIsBalanceRefreshing] = useState(false);
  
  // Exchange rate state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  
  // Initialize currency from user data or saved preference
  useEffect(() => {
    if (user?.currency) {
      setCurrencyState(user.currency as Currency);
    } else if (savedCurrency) {
      setCurrencyState(savedCurrency);
    }
    
    if (user?.balance) {
      setBalance(user.balance);
    }
  }, [user]);

  // Listen for balance updates via WebSocket
  useEffect(() => {
    // Listen for balance_update events from WebSocket
    const handleBalanceEvent = (event: CustomEvent) => {
      const data = event.detail;
      console.log("Balance event received:", data);
      
      // Update balance state if currency matches
      if (data.currency === currency) {
        // Store old balance for animation comparison
        const oldBalance = balance;
        
        // Update with new balance
        setBalance(data.balance);
        
        console.log(`Balance updated: ${oldBalance} -> ${data.balance}`);
      }
    };
    
    // Listen for currency_changed events
    const handleCurrencyEvent = (event: CustomEvent) => {
      const data = event.detail;
      console.log("Currency changed event received:", data);
      
      // Update currency and balance
      if (data.newCurrency) {
        setCurrencyState(data.newCurrency as Currency);
        
        if (data.newBalance) {
          setBalance(data.newBalance);
        }
      }
    };
    
    window.addEventListener('balance_update', handleBalanceEvent as EventListener);
    window.addEventListener('currency_changed', handleCurrencyEvent as EventListener);
    
    return () => {
      window.removeEventListener('balance_update', handleBalanceEvent as EventListener);
      window.removeEventListener('currency_changed', handleCurrencyEvent as EventListener);
    };
  }, [balance, currency]);
  
  // Format balance using Intl.NumberFormat
  const formattedBalance = formatCurrency(balance, currency);
  
  // Function to change currency
  const changeCurrency = async (newCurrency: Currency): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to change your currency.",
        variant: "destructive",
      });
      return;
    }
    
    if (newCurrency === currency) {
      // No change needed
      return;
    }
    
    try {
      setIsChangingCurrency(true);
      
      // Store old values for animation, event and fallback
      const oldCurrency = currency;
      const oldBalance = balance;
      
      // Save preference in localStorage for persistence
      saveUserCurrencyPreference(newCurrency);
      
      // Make API request to change currency
      const response = await apiRequest("POST", "/api/wallet/change-currency", {
        currency: newCurrency,
      });
      
      if (!response.ok) {
        // If the server response is not OK, revert to the old state and throw an error
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.balance) {
        // Update local state with new values
        setCurrencyState(newCurrency);
        setBalance(data.balance);
        
        // Dispatch custom event for other components
        dispatchCurrencyChangeEvent(oldCurrency, newCurrency, oldBalance, data.balance);
        
        toast({
          title: "Currency Updated",
          description: `Your currency has been changed to ${newCurrency}.`,
        });
      } else {
        // If we got a response but no balance data, throw an error
        throw new Error("Invalid response from server - missing balance data");
      }
    } catch (error) {
      console.error("Error changing currency:", error);
      
      // Don't attempt to change currency state since it failed
      // Keep the old currency and balance
      
      toast({
        title: "Currency Change Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      // Attempt to refresh balance data to ensure consistency
      try {
        const response = await apiRequest("GET", "/api/wallet/balance");
        const data = await response.json();
        
        if (data && data.balance) {
          // Restore correct values from server
          setCurrencyState(data.currency as Currency);
          setBalance(data.balance);
        }
      } catch (refreshError) {
        console.error("Error refreshing balance after currency change failure:", refreshError);
      }
    } finally {
      setIsChangingCurrency(false);
    }
  };
  
  // Function to format amounts with the current or specified currency
  const formatAmount = (amount: number | string, overrideCurrency?: Currency): string => {
    return formatCurrency(amount, overrideCurrency || currency);
  };
  
  // Periodically refresh balance if WebSocket is not connected
  useEffect(() => {
    if (!user || isConnected) return;
    
    // If WebSocket is disconnected, fall back to polling (less frequent)
    const fetchBalance = async () => {
      try {
        setIsBalanceRefreshing(true);
        const response = await apiRequest("GET", "/api/wallet/balance");
        const data = await response.json();
        
        if (data && data.balance && data.currency) {
          // Only update if currency matches (or we need to handle currency mismatch)
          if (data.currency === currency) {
            setBalance(data.balance);
          }
          // Handle currency mismatch if needed
          else {
            setCurrencyState(data.currency as Currency);
            setBalance(data.balance);
          }
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setIsBalanceRefreshing(false);
      }
    };
    
    // Fetch immediately and then every 30 seconds (reduced frequency)
    fetchBalance();
    const intervalId = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(intervalId);
  }, [user, isConnected, currency]);
  
  // Fetch exchange rates on component mount and periodically
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setIsLoadingRates(true);
        const response = await apiRequest("GET", "/api/exchange-rates");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exchange rates: ${response.status}`);
        }
        
        const data = await response.json();
        setExchangeRates(data);
        console.log("Exchange rates updated:", data);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        // Don't set to null if we already have rates - keep the old ones
        if (!exchangeRates) {
          toast({
            title: "Exchange Rate Error",
            description: "Unable to fetch current exchange rates. Using default values.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoadingRates(false);
      }
    };
    
    // Fetch immediately
    fetchExchangeRates();
    
    // Set up interval to refresh rates every 5 minutes
    const intervalId = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [toast]);
  
  // Convert currency utility functions
  const getConversionRate = (fromCurrency: Currency, toCurrency: Currency): number | null => {
    // Same currency - rate is 1
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    // Check if we have exchange rates
    if (!exchangeRates || !exchangeRates.rates) {
      return null;
    }
    
    try {
      // Convert through base currency (USD)
      // If fromCurrency is USD, direct lookup
      if (fromCurrency === Currency.USD) {
        return exchangeRates.rates[toCurrency] || null;
      }
      
      // If toCurrency is USD, inverse of fromCurrency rate
      if (toCurrency === Currency.USD) {
        const fromRate = exchangeRates.rates[fromCurrency];
        if (!fromRate) return null;
        return 1 / fromRate;
      }
      
      // Neither is USD, convert through USD
      const fromRate = exchangeRates.rates[fromCurrency];
      const toRate = exchangeRates.rates[toCurrency];
      
      if (!fromRate || !toRate) return null;
      
      // Convert from source to USD, then USD to target
      return toRate / fromRate;
    } catch (error) {
      console.error("Error calculating conversion rate:", error);
      return null;
    }
  };
  
  // Convert amount between currencies
  const convertAmount = (amount: number | string, fromCurrency: Currency, toCurrency: Currency): number | null => {
    try {
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numericAmount)) {
        return null;
      }
      
      // Same currency - no conversion needed
      if (fromCurrency === toCurrency) {
        return numericAmount;
      }
      
      const rate = getConversionRate(fromCurrency, toCurrency);
      
      if (rate === null) {
        return null;
      }
      
      // Apply conversion and round appropriately
      let result = numericAmount * rate;
      
      // Round based on currency
      if (toCurrency === Currency.BTC) {
        // 8 decimal places for BTC
        result = parseFloat(result.toFixed(8));
      } else {
        // 2 decimal places for fiat currencies
        result = parseFloat(result.toFixed(2));
      }
      
      return result;
    } catch (error) {
      console.error("Error converting amount:", error);
      return null;
    }
  };

  // List of available currencies for the dropdown
  const availableCurrencies = Object.values(Currency);
  
  const value = {
    currency,
    balance,
    setCurrency: changeCurrency,
    formattedBalance,
    isChangingCurrency,
    isBalanceRefreshing,
    getCurrencySymbol,
    formatAmount,
    availableCurrencies,
    exchangeRates,
    isLoadingRates,
    getConversionRate,
    convertAmount
  };
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  
  return context;
}