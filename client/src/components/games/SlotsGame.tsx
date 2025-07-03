import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useTranslation } from "@/providers/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/common/CurrencyDisplay";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    reels: string[];
  };
}

export function SlotsGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(["🍒", "💎", "7️⃣", "💎", "🍒"]);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string }[]>([]);
  
  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: GameType.SLOTS,
        betAmount: parseFloat(betAmount),
        currency: currentCurrency
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      // Update reels based on game result
      setReels(data.gameData.reels);
      
      // Add to history
      setHistory(prev => [
        { 
          isWin: data.isWin, 
          amount: data.isWin ? data.winAmount.toString() : betAmount 
        },
        ...prev.slice(0, 3)
      ]);
      
      // Show toast
      if (data.isWin) {
        toast({
          title: t('games.youWon'),
          description: `${t('games.youWon')} ${data.winAmount} ${currentCurrency}`,
          variant: "default",
        });
      } else {
        toast({
          title: t('games.youLost'),
          description: `${t('games.youLost')} ${betAmount} ${currentCurrency}`,
          variant: "destructive",
        });
      }
      
      // Invalidate balance query to update user balance
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: t('ui.error'),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Stop spinning animation
      setTimeout(() => {
        setIsSpinning(false);
      }, 2000);
    }
  });
  
  const handleSpin = () => {
    if (!user) return;
    
    const betValue = parseFloat(betAmount);
    if (isNaN(betValue) || betValue <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsSpinning(true);
    spinMutation.mutate();
  };
  
  const formatBetAmount = (value: number): string => {
    return value.toFixed(2);
  };

  const handleBetAmountChange = (value: string) => {
    // Allow empty string for user to clear input
    if (value === '') {
      setBetAmount('');
      return;
    }
    
    // Only allow valid number format
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setBetAmount(value);
    }
  };

  const handleHalfBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(currentBet / 2));
  };
  
  const handleDoubleBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(currentBet * 2));
  };
  
  const possibleWin = parseFloat(betAmount) * 1.1;
  
  return (
    <div className="bg-background-light rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="mb-6 bg-background-darker rounded-xl p-4">
          <div className="grid grid-cols-5 gap-4">
            {reels.map((symbol, index) => (
              <motion.div
                key={index}
                className={`aspect-square bg-surface rounded-lg flex items-center justify-center text-4xl ${isSpinning ? 'slot-reel' : ''}`}
                animate={isSpinning ? { y: [0, -50, 50, 0] } : {}}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background-darker rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">{t('games.betAmount')}</div>
            <div className="flex items-center bet-input-container">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none min-w-0"
                disabled={isSpinning}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                style={{ width: '100%', minWidth: '120px', textAlign: 'left' }}
              />
              <span className="text-white font-medium ml-2 flex-shrink-0">{currentCurrency}</span>
            </div>
          </div>
          
          <div className="bg-background-darker rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">{t('ui.possibleWin')}</div>
            <div className="text-white text-lg font-medium">
              <CurrencyDisplay amount={possibleWin} />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleHalfBet}
            disabled={isSpinning}
            className="bg-background-darker border-gray-600 text-white hover:bg-gray-700"
          >
            1/2
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDoubleBet}
            disabled={isSpinning}
            className="bg-background-darker border-gray-600 text-white hover:bg-gray-700"
          >
            2x
          </Button>
          <Button 
            variant="default" 
            className="flex-1 bg-accent-gold text-background font-bold rounded-lg hover:bg-yellow-500 transition-colors"
            onClick={handleSpin}
            disabled={isSpinning || spinMutation.isPending}
          >
            {isSpinning || spinMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('slots.spinning')}
              </span>
            ) : (
              t('slots.spin')
            )}
          </Button>
        </div>
      </div>
      
      <div className="bg-background-darker p-4 border-t border-gray-800">
        <h3 className="font-medium text-white mb-2">{t('slots.recentSpins')}</h3>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('slots.noRecentSpins')}</p>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
            {history.map((item, index) => (
              <div 
                key={index} 
                className={`${
                  item.isWin ? 'bg-win bg-opacity-20 text-win' : 'bg-loss bg-opacity-20 text-loss'
                } rounded-lg p-2 text-center text-sm`}
              >
                <span className="block font-medium">{item.isWin ? t('slots.win') : t('slots.loss')}</span>
                <span className="text-xs">
                  <CurrencyDisplay amount={item.amount} compact={true} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
