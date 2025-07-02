import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/hooks/use-currency';

export function useSimpleBalance() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(user?.balance || '0');

  const updateBalance = useCallback(async (
    gameType: 'SLOTS' | 'DICE' | 'PLINKO',
    amount: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsProcessing(true);
    
    try {
      // Immediate optimistic update for instant UI feedback
      const current = parseFloat(currentBalance);
      const change = isWin ? amount : -amount;
      const newBalance = (current + change).toFixed(2);
      setCurrentBalance(newBalance);

      const endpoint = isWin ? '/api/games/win' : '/api/games/bet';
      const payload = isWin ? {
        gameType,
        winAmount: amount,
        currency: currency,
        multiplier: multiplier || 1
      } : {
        gameType,
        betAmount: amount,
        currency: currency
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Revert on error
        setCurrentBalance(user.balance);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transaction failed');
      }

      const data = await response.json();
      
      // Confirm with server balance
      setCurrentBalance(data.balance);
      return data;

    } catch (error: any) {
      // Revert on error
      setCurrentBalance(user.balance);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, currentBalance]);

  // Initialize balance from user
  useState(() => {
    if (user?.balance) {
      setCurrentBalance(user.balance);
    }
  });

  const placeBet = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number) => 
    updateBalance(gameType, amount, false), [updateBalance]);

  const recordWin = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number, multiplier?: number) => 
    updateBalance(gameType, amount, true, multiplier), [updateBalance]);

  return {
    balance: currentBalance,
    currency: currency,
    isProcessing,
    placeBet,
    recordWin
  };
}