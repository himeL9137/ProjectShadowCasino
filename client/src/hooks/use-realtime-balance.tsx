import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/providers/WebSocketProvider';

interface BalanceState {
  balance: string;
  currency: string;
  isUpdating: boolean;
  error: string | null;
}

export function useRealtimeBalance() {
  const { user, updateUser } = useAuth();
  const { socket } = useWebSocket();
  const [balanceState, setBalanceState] = useState<BalanceState>({
    balance: user?.balance || '0',
    currency: user?.currency || 'USD',
    isUpdating: false,
    error: null
  });

  // Update balance instantly with optimistic updates
  const updateBalanceOptimistically = useCallback((amount: number, isWin: boolean) => {
    setBalanceState(prev => {
      const currentBalance = parseFloat(prev.balance);
      const newBalance = isWin ? currentBalance + amount : currentBalance - amount;
      
      console.log(`[OPTIMISTIC UPDATE] ${isWin ? 'WIN' : 'BET'}: ${amount} ${prev.currency} - New Balance: ${newBalance.toFixed(2)}`);
      
      return {
        ...prev,
        balance: newBalance.toFixed(2),
        isUpdating: true
      };
    });
  }, []);

  // Process game transaction with instant UI update
  const processGameTransaction = useCallback(async (
    gameType: 'SLOTS' | 'DICE' | 'PLINKO',
    amount: number,
    isWin: boolean,
    multiplier?: number
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Immediate optimistic update
    updateBalanceOptimistically(amount, isWin);

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
          'Authorization': `Bearer ${document.cookie.split('jwt=')[1]?.split(';')[0]}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transaction failed');
      }

      const data = await response.json();
      
      // Update with server's authoritative balance
      setBalanceState(prev => ({
        ...prev,
        balance: data.balance,
        currency: data.currency,
        isUpdating: false,
        error: null
      }));

      // Update user context
      if (updateUser) {
        updateUser({
          ...user,
          balance: data.balance,
          currency: data.currency
        });
      }

      console.log(`[TRANSACTION COMPLETE] Server balance: ${data.balance} ${data.currency}`);
      return data;

    } catch (error) {
      console.error('[TRANSACTION ERROR]', error);
      
      // Revert optimistic update on error
      setBalanceState(prev => ({
        ...prev,
        balance: user.balance,
        currency: user.currency,
        isUpdating: false,
        error: error.message
      }));
      
      throw error;
    }
  }, [user, updateUser, updateBalanceOptimistically]);

  // Listen for WebSocket balance updates
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'balance_update' && message.data) {
          const { balance, currency } = message.data;
          
          setBalanceState(prev => ({
            ...prev,
            balance,
            currency,
            isUpdating: false,
            error: null
          }));

          // Update user context
          if (updateUser && user) {
            updateUser({
              ...user,
              balance,
              currency
            });
          }

          console.log(`[WEBSOCKET UPDATE] Balance: ${balance} ${currency}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, updateUser, user]);

  // Sync with user data when it changes
  useEffect(() => {
    if (user) {
      setBalanceState(prev => ({
        ...prev,
        balance: user.balance,
        currency: user.currency
      }));
    }
  }, [user?.balance, user?.currency]);

  // Convenience methods for games
  const placeBet = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number) => 
    processGameTransaction(gameType, amount, false), [processGameTransaction]);

  const recordWin = useCallback((gameType: 'SLOTS' | 'DICE' | 'PLINKO', amount: number, multiplier?: number) => 
    processGameTransaction(gameType, amount, true, multiplier), [processGameTransaction]);

  return {
    balance: balanceState.balance,
    currency: balanceState.currency,
    isUpdating: balanceState.isUpdating,
    error: balanceState.error,
    placeBet,
    recordWin,
    processGameTransaction
  };
}