/**
 * Currency Synchronization Hook
 * 
 * Ensures that when a user changes their currency in the header,
 * all game interfaces immediately reflect the new currency choice.
 */

import { useEffect, useCallback } from 'react';
import { useCurrency } from '../providers/CurrencyProvider';
import { useToast } from './use-toast';
import { Currency } from '@shared/schema';

export function useCurrencySync() {
  const { currency, getCurrencySymbol, setCurrency, formatAmount } = useCurrency();
  const { toast } = useToast();

  // Listen for currency change events from other components
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const { newCurrency, oldCurrency } = event.detail;
      
      // Force update all components that use this hook
      if (newCurrency !== currency) {
        console.log(`Currency sync: ${oldCurrency} → ${newCurrency}`);
        
        // Dispatch a custom event to notify all game components
        window.dispatchEvent(new CustomEvent('currency-updated', {
          detail: {
            currency: newCurrency,
            symbol: getCurrencySymbol(newCurrency),
            timestamp: Date.now()
          }
        }));
      }
    };

    // Listen for currency change events
    window.addEventListener('currency-changed', handleCurrencyChange as EventListener);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange as EventListener);
    };
  }, [currency, getCurrencySymbol]);

  // Function to trigger currency change
  const switchCurrency = useCallback(async (newCurrency: Currency) => {
    try {
      await setCurrency(newCurrency);
      
      // Broadcast the change to all components
      window.dispatchEvent(new CustomEvent('currency-changed', {
        detail: {
          oldCurrency: currency,
          newCurrency: newCurrency,
          timestamp: Date.now()
        }
      }));

      toast({
        title: "Currency Updated",
        description: `All games now display amounts in ${newCurrency}`,
      });
    } catch (error) {
      console.error('Error switching currency:', error);
      toast({
        title: "Currency Update Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [currency, setCurrency, toast]);

  return {
    currentCurrency: currency,
    currencySymbol: getCurrencySymbol(currency),
    formatCurrency: formatAmount,
    switchCurrency,
    getCurrencySymbol
  };
}