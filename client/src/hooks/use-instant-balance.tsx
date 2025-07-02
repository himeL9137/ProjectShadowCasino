import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function useInstantBalance() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const updateBalanceInstantly = useCallback(async (
    gameType: 'SLOTS' | 'DICE' | 'PLINKO',
    amount: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsProcessing(true);
    
    // Immediate UI update
    const currentBalance = parseFloat(user.balance);
    const balanceChange = isWin ? amount : -amount;
    const newBalance = (currentBalance + balanceChange).toFixed(2);
    
    // Store optimistic balance for immediate UI feedback
    const optimisticBalance = newBalance;

    try {
      const endpoint = isWin ? '/api/games/win' : '/api/games/bet';
      const payload = isWin ? {
        gameType,
        winAmount: amount,
        currency: user.currency,
        multiplier: multiplier || 1
      } : {
        gameType,
        betAmount: amount,
        currency: user.currency
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
        // Revert balance on error
        setUser({ ...user, balance: user.balance });
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transaction failed');
      }

      const data = await response.json();
      
      // Confirm with server balance
      setUser({
        ...user,
        balance: data.balance,
        currency: data.currency
      });

      return data;

    } catch (error: any) {
      // Revert on error
      setUser({ ...user, balance: user.balance });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, setUser]);

  const placeBet = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number) => 
    updateBalanceInstantly(gameType, amount, false), [updateBalanceInstantly]);

  const recordWin = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number, multiplier?: number) => 
    updateBalanceInstantly(gameType, amount, true, multiplier), [updateBalanceInstantly]);

  return {
    balance: user?.balance || '0',
    currency: user?.currency || 'USD',
    isProcessing,
    placeBet,
    recordWin
  };
}