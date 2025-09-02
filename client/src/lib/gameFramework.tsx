import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useTranslation } from '@/providers/LanguageProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { GameType } from '@shared/schema';

export interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: any;
}

export interface GameFrameworkConfig {
  gameId: string;
  gameName: string;
  onResult?: (result: GameResult) => void;
  customEndpoint?: string;
}

/**
 * Core Game Framework Hook
 * This hook provides all the necessary functionality for custom games to integrate
 * with the casino platform exactly like the built-in games.
 */
export function useGameFramework(config: GameFrameworkConfig) {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const endpoint = config.customEndpoint || '/api/games/custom-play';
      const res = await apiRequest("POST", endpoint, {
        gameId: config.gameId,
        betAmount: gameData.betAmount,
        currency: currentCurrency,
        gameData: gameData.gameSpecificData || {}
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      // Update user balance in the cache
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      
      // Show toast notification
      if (data.isWin) {
        toast({
          title: t('games.youWon') || "You Won!",
          description: `${t('games.youWon') || 'You won'} ${data.winAmount} ${currentCurrency}`,
        });
      } else {
        toast({
          title: t('games.youLost') || "Try Again!",
          description: t('games.betterLuck') || "Better luck next time!",
          variant: "destructive",
        });
      }
      
      // Call custom result handler
      if (config.onResult) {
        config.onResult(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const playGame = (betAmount: number, gameSpecificData?: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play games",
        variant: "destructive",
      });
      return;
    }

    if (playGameMutation.isPending) {
      return; // Prevent multiple simultaneous plays
    }

    playGameMutation.mutate({
      betAmount,
      gameSpecificData
    });
  };

  return {
    // Game state
    isPlaying: playGameMutation.isPending,
    user,
    currentCurrency,
    currencySymbol,
    
    // Game functions
    playGame,
    
    // Utility functions
    formatAmount,
    t,
    toast,
    
    // Raw mutation for advanced use cases
    playGameMutation
  };
}

/**
 * Game Component Wrapper
 * This provides a consistent layout and styling for custom games
 */
interface GameWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  instructions?: string;
  className?: string;
}

export function GameWrapper({ title, description, children, instructions, className = "" }: GameWrapperProps) {
  return (
    <div className={`bg-background-light rounded-xl p-6 space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-gray-400">{description}</p>}
      </div>
      
      <div className="game-content">
        {children}
      </div>
      
      {instructions && (
        <div className="mt-6 p-4 bg-background-darker rounded-lg">
          <h4 className="font-medium mb-2 text-accent-gold">How to Play:</h4>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{instructions}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Betting Interface Component
 * Provides a consistent betting UI that matches the existing games
 */
interface BettingInterfaceProps {
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlay: () => void;
  isPlaying: boolean;
  disabled?: boolean;
  minBet?: number;
  maxBet?: number;
  userBalance?: number;
  currency: string;
  customPlayText?: string;
}

export function BettingInterface({
  betAmount,
  onBetAmountChange,
  onPlay,
  isPlaying,
  disabled = false,
  minBet = 0.01,
  maxBet = 1000,
  userBalance = 0,
  currency,
  customPlayText
}: BettingInterfaceProps) {
  const { t } = useTranslation();

  const handleHalfBet = () => {
    const current = parseFloat(betAmount) || 0;
    onBetAmountChange((current / 2).toFixed(2));
  };

  const handleDoubleBet = () => {
    const current = parseFloat(betAmount) || 0;
    const doubled = current * 2;
    if (doubled <= maxBet) {
      onBetAmountChange(doubled.toFixed(2));
    }
  };

  const isValidBet = () => {
    const amount = parseFloat(betAmount) || 0;
    return amount >= minBet && amount <= maxBet && amount <= userBalance;
  };

  return (
    <div className="space-y-4 p-4 bg-background-darker rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t('games.betAmount') || 'Bet Amount'}</label>
        <span className="text-sm text-gray-400">
          {t('games.balance') || 'Balance'}: {userBalance.toFixed(2)} {currency}
        </span>
      </div>
      
      <div className="flex gap-2">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => onBetAmountChange(e.target.value)}
          min={minBet}
          max={maxBet}
          step="0.01"
          disabled={isPlaying || disabled}
          className="flex-1 px-3 py-2 bg-background border border-gray-600 rounded-md text-white focus:border-blue-500 focus:outline-none"
          placeholder={`${minBet} - ${maxBet}`}
        />
        <button
          onClick={handleHalfBet}
          disabled={isPlaying || disabled}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm disabled:opacity-50"
        >
          ½
        </button>
        <button
          onClick={handleDoubleBet}
          disabled={isPlaying || disabled}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm disabled:opacity-50"
        >
          2×
        </button>
      </div>
      
      <button
        onClick={onPlay}
        disabled={isPlaying || disabled || !isValidBet()}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-semibold transition-all"
      >
        {isPlaying ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {t('games.playing') || 'Playing...'}
          </div>
        ) : (
          customPlayText || `${t('games.play') || 'Play'} - ${betAmount} ${currency}`
        )}
      </button>
      
      {!isValidBet() && (
        <p className="text-red-400 text-sm text-center">
          {parseFloat(betAmount) > userBalance 
            ? (t('games.insufficientBalance') || 'Insufficient balance')
            : `${t('games.betRange') || 'Bet range'}: ${minBet} - ${maxBet} ${currency}`
          }
        </p>
      )}
    </div>
  );
}

/**
 * Game History Component
 * Shows recent game results in a consistent format
 */
interface GameHistoryProps {
  history: Array<{
    isWin: boolean;
    betAmount: number;
    winAmount?: number;
    multiplier?: number;
    timestamp: Date;
    gameData?: any;
  }>;
  maxItems?: number;
  currency: string;
}

export function GameHistory({ history, maxItems = 5, currency }: GameHistoryProps) {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <div className="text-center p-4 text-gray-400">
        <p>{t('games.noHistory') || 'No games played yet'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{t('games.recentGames') || 'Recent Games'}</h4>
      <div className="space-y-1">
        {history.slice(0, maxItems).map((entry, index) => (
          <div
            key={index}
            className={`flex justify-between items-center p-2 rounded text-sm ${
              entry.isWin ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
            }`}
          >
            <div>
              <div className="font-semibold">
                {entry.isWin 
                  ? `+${entry.winAmount?.toFixed(2) || '0.00'} ${currency}`
                  : `-${entry.betAmount.toFixed(2)} ${currency}`
                }
              </div>
              <div className="text-xs opacity-75">
                {entry.isWin ? `${entry.multiplier?.toFixed(2) || '0'}x` : 'Lost'}
              </div>
            </div>
            <div className="text-xs opacity-75">
              {entry.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Game Statistics Component
 * Shows win/loss statistics
 */
interface GameStatsProps {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalWon: number;
  currency: string;
}

export function GameStats({ totalGames, totalWins, totalLosses, totalWagered, totalWon, currency }: GameStatsProps) {
  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';
  const netProfit = totalWon - totalWagered;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-background-darker rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold">{totalGames}</div>
        <div className="text-xs text-gray-400">Total Games</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{winRate}%</div>
        <div className="text-xs text-gray-400">Win Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{totalWagered.toFixed(2)}</div>
        <div className="text-xs text-gray-400">Wagered ({currency})</div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
        </div>
        <div className="text-xs text-gray-400">Net P&L ({currency})</div>
      </div>
    </div>
  );
}

/**
 * Sound Effects Hook
 * Provides consistent sound effects for games
 */
export function useGameSounds() {
  const playWinSound = () => {
    // Create a simple win sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
      oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.2); // C6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Fallback: silent operation if audio context fails
      console.warn('Audio not available');
    }
  };

  const playLoseSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
      oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.15); // G3
      oscillator.frequency.setValueAtTime(174.61, audioContext.currentTime + 0.3); // F3
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.warn('Audio not available');
    }
  };

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Audio not available');
    }
  };

  return {
    playWinSound,
    playLoseSound,
    playClickSound
  };
}