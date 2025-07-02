import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useTranslation } from "@/providers/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    dice: number[];
  };
}

export function DiceGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState([1, 1, 1, 1, 1]);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string; dice: number[] }[]>([]);

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

  // Update bet amount when currency changes
  useEffect(() => {
    const updateBetForCurrency = () => {
      setBetAmount("1.00");
    };
    
    updateBetForCurrency();
  }, [currentCurrency]);

  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: "DICE",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      // Update dice values based on game result
      setDiceValues(data.gameData.dice);
      
      // Add to history
      setHistory(prev => [
        { 
          isWin: data.isWin, 
          amount: data.isWin ? data.winAmount.toString() : betAmount,
          dice: data.gameData.dice
        },
        ...prev.slice(0, 9)
      ]);
      
      // Show toast
      if (data.isWin) {
        toast({
          title: "You won!",
          description: `Winning combination! You won ${formatCurrency(data.winAmount, currentCurrency)}!`,
          variant: "default",
        });
      } else {
        toast({
          title: "You lost",
          description: "No winning combination this time",
          variant: "destructive",
        });
      }
      
      // Invalidate balance query to update user balance
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Stop rolling animation
      setTimeout(() => {
        setIsRolling(false);
      }, 2000);
    }
  });
  
  const handleRoll = () => {
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
    
    setIsRolling(true);
    rollMutation.mutate();
  };

  const possibleWin = parseFloat(betAmount) * 1.1;

  // Render dots on dice face
  const renderDiceFace = (value: number) => {
    switch (value) {
      case 1:
        return (
          <div className="grid place-items-center h-full w-full">
            <div className="bg-neutral-800 rounded-full w-3 h-3"></div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4 p-3 h-full w-full">
            <div className="bg-neutral-800 rounded-full w-3 h-3"></div>
            <div className="bg-neutral-800 rounded-full w-3 h-3 justify-self-end self-end"></div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-3 grid-rows-3 p-2 h-full w-full">
            <div className="bg-neutral-800 rounded-full w-2 h-2"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 place-self-center"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 self-end"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end self-end"></div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 p-3 h-full w-full">
            <div className="bg-neutral-800 rounded-full w-3 h-3"></div>
            <div className="bg-neutral-800 rounded-full w-3 h-3 justify-self-end"></div>
            <div className="bg-neutral-800 rounded-full w-3 h-3 self-end"></div>
            <div className="bg-neutral-800 rounded-full w-3 h-3 justify-self-end self-end"></div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-3 grid-rows-3 p-2 h-full w-full">
            <div className="bg-neutral-800 rounded-full w-2 h-2"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 place-self-center"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 self-end"></div>
            <div></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end self-end"></div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 grid-rows-3 gap-2 p-2 h-full w-full">
            <div className="bg-neutral-800 rounded-full w-2 h-2"></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end"></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2"></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end"></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 self-end"></div>
            <div className="bg-neutral-800 rounded-full w-2 h-2 justify-self-end self-end"></div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700">
      <div className="p-6">
        <div className="mb-6 flex flex-col items-center justify-center bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <div className="text-white text-center mb-6">
            <p className="text-lg font-semibold font-sans tracking-tight">{t('dice.slotsTitle')}</p>
            <p className="text-sm text-neutral-400">{t('dice.instruction')}</p>
          </div>

          {/* Dice Grid - 5 dice */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {diceValues.map((value, index) => (
              <motion.div
                key={index}
                className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center border border-neutral-600"
                animate={isRolling ? {
                  rotateX: [0, 360, 720],
                  rotateY: [0, 360, 720],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  delay: index * 0.1
                }}
              >
                {renderDiceFace(value)}
              </motion.div>
            ))}
          </div>

          {/* Win line indicator */}
          <div className="text-center">
            <div className="text-sm text-neutral-400 font-sans">{t('dice.middleRow')}</div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <div className="mx-2 text-green-500 text-xs">{t('dice.winLine')}</div>
              <div className="w-4 h-0.5 bg-green-500"></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1 font-sans">{t('games.betAmount')}</div>
            <div className="flex items-center bet-input-container">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none font-sans min-w-0"
                disabled={isRolling}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                style={{ width: '100%', minWidth: '120px', textAlign: 'left' }}
              />
              <span className="text-white font-medium font-sans ml-2 flex-shrink-0">{currentCurrency}</span>
            </div>
          </div>
          
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <div className="flex justify-between text-white font-semibold text-base font-sans">
              <span>{t('dice.multiplier')}: 1.1x</span>
              <span>{t('ui.win')}: {formatCurrency(possibleWin, currentCurrency)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleHalfBet}
            disabled={isRolling}
            className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
          >
            1/2
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDoubleBet}
            disabled={isRolling}
            className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
          >
            2x
          </Button>
          <Button 
            variant="default" 
            className="flex-1 py-3 px-6 rounded-xl bg-green-500 text-black font-bold text-lg hover:bg-green-400 transition duration-200 shadow-lg font-sans"
            onClick={handleRoll}
            disabled={isRolling || rollMutation.isPending}
          >
            {isRolling || rollMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {t('dice.rolling')}
              </span>
            ) : (
              t('dice.rollDice')
            )}
          </Button>
        </div>
      </div>
      
      <div className="bg-neutral-800 p-4 border-t border-neutral-700">
        <h3 className="font-medium text-white mb-2 font-sans">{t('dice.recentRolls')}</h3>
        {history.length === 0 ? (
          <p className="text-neutral-400 text-sm font-sans">{t('dice.noRecentRolls')}</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 3).map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  item.isWin 
                    ? 'bg-green-900 bg-opacity-30 border-green-500' 
                    : 'bg-red-900 bg-opacity-30 border-red-500'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium ${item.isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {item.isWin ? t('ui.win') : t('ui.loss')}
                  </span>
                  <span className="text-neutral-300 text-sm">{formatCurrency(item.amount, currentCurrency)}</span>
                </div>
                <div className="flex space-x-1">
                  {item.dice.map((die, dieIndex) => (
                    <div key={dieIndex} className="w-6 h-6 bg-white rounded text-xs flex items-center justify-center">
                      <div className="w-full h-full">{renderDiceFace(die)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}