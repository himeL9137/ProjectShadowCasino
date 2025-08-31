import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useTranslation } from "@/providers/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    roll: number;
    prediction: number;
    rollOver: boolean;
    winChance: string;
    clientSeed: string;
    serverSeed: string;
    nonce: number;
  };
}

export function DiceGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [prediction, setPrediction] = useState([50]);
  const [rollOver, setRollOver] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string; roll: number; prediction: number; rollOver: boolean }[]>([]);

  const formatBetAmount = (value: number): string => {
    return value.toFixed(2);
  };

  const handleBetAmountChange = (value: string) => {
    if (value === '') {
      setBetAmount('');
      return;
    }
    
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

  // Calculate win chance and multiplier based on prediction and rollOver
  const currentPrediction = prediction[0];
  const winChance = rollOver ? 100 - currentPrediction : currentPrediction - 1;
  const multiplier = winChance > 0 ? 99 / winChance : 99;
  const possibleWin = parseFloat(betAmount || "0") * multiplier;

  // Update bet amount when currency changes
  useEffect(() => {
    setBetAmount("1.00");
  }, [currentCurrency]);

  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: "DICE",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        prediction: currentPrediction,
        rollOver: rollOver,
        clientSeed: "default",
        nonce: 1
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      // Update last roll
      setLastRoll(data.gameData.roll);
      
      // Add to history
      setHistory(prev => [
        { 
          isWin: data.isWin, 
          amount: data.isWin ? data.winAmount.toString() : betAmount,
          roll: data.gameData.roll,
          prediction: data.gameData.prediction,
          rollOver: data.gameData.rollOver
        },
        ...prev.slice(0, 9)
      ]);
      
      // Show toast
      if (data.isWin) {
        toast({
          title: "You Won!",
          description: `Congratulations! You won ${formatCurrency(data.winAmount, currentCurrency)}!`,
          variant: "default",
        });
      } else {
        toast({
          title: "You Lost",
          description: "Better luck next time!",
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
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsRolling(true);
    rollMutation.mutate();
  };

  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700">
      <div className="p-6">
        {/* Game Area */}
        <div className="mb-6 flex flex-col bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          
          {/* Bet Amount and Auto Button Row */}
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Bet Amount */}
            <div className="flex items-center space-x-4">
              <div className="bg-neutral-700 rounded-lg px-4 py-2">
                <span className="text-xs text-neutral-400 block">Bet Amount</span>
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => handleBetAmountChange(e.target.value)}
                    className="bg-transparent border-none text-white text-sm p-0 h-auto w-24"
                    disabled={isRolling}
                    step="0.01"
                    min="0.01"
                  />
                  <span className="text-white text-sm ml-1">{currentCurrency}</span>
                </div>
              </div>
              
              {/* Bet Controls */}
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleHalfBet}
                  disabled={isRolling}
                  className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 h-8 px-3 text-xs"
                >
                  1/2
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDoubleBet}
                  disabled={isRolling}
                  className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 h-8 px-3 text-xs"
                >
                  2x
                </Button>
              </div>
            </div>

            {/* Right side - Auto Button */}
            <Button
              variant="outline"
              className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
              disabled
            >
              Auto
            </Button>
          </div>

          {/* Dice Result Display */}
          <div className="text-center mb-6">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white text-2xl font-bold mb-2"
              animate={isRolling ? {
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              } : {}}
              transition={{
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              {isRolling ? "?" : (lastRoll || "0")}
            </motion.div>
            {lastRoll !== null && (
              <div className="text-neutral-400 text-sm">
                Last Result: {lastRoll}
              </div>
            )}
          </div>

          {/* Prediction Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-neutral-400 text-sm">Roll {rollOver ? 'Over' : 'Under'}</span>
              <span className="text-white font-semibold text-lg">{currentPrediction}</span>
            </div>
            
            {/* Slider with scale */}
            <div className="relative">
              <Slider
                value={prediction}
                onValueChange={setPrediction}
                min={2}
                max={98}
                step={1}
                className="w-full mb-2"
                disabled={isRolling}
              />
              {/* Scale markers */}
              <div className="flex justify-between text-xs text-neutral-500 px-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Roll Over/Under and Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Roll Under */}
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <Button
                variant={!rollOver ? "default" : "ghost"}
                onClick={() => setRollOver(false)}
                disabled={isRolling}
                className={`w-full mb-2 ${!rollOver ? 'bg-purple-500 text-white hover:bg-purple-400' : 'text-neutral-400 hover:text-white'}`}
              >
                Roll Under
              </Button>
              <div className="text-xs text-neutral-400">Multiplier</div>
              <div className="text-white font-semibold">
                {!rollOver ? multiplier.toFixed(4) + 'x' : (99 / (currentPrediction - 1)).toFixed(4) + 'x'}
              </div>
            </div>

            {/* Roll Over */}
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <Button
                variant={rollOver ? "default" : "ghost"}
                onClick={() => setRollOver(true)}
                disabled={isRolling}
                className={`w-full mb-2 ${rollOver ? 'bg-purple-500 text-white hover:bg-purple-400' : 'text-neutral-400 hover:text-white'}`}
              >
                Roll Over
              </Button>
              <div className="text-xs text-neutral-400">Multiplier</div>
              <div className="text-white font-semibold">
                {rollOver ? multiplier.toFixed(4) + 'x' : (99 / (100 - currentPrediction)).toFixed(4) + 'x'}
              </div>
            </div>

            {/* Win Chance */}
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <div className="text-xs text-neutral-400 mb-2">Win Chance</div>
              <div className="text-white font-semibold text-lg">
                {winChance.toFixed(2)}%
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Payout: {formatCurrency(possibleWin, currentCurrency)}
              </div>
            </div>
          </div>

          {/* Roll Button */}
          <Button 
            variant="default" 
            className="w-full py-4 rounded-lg bg-green-500 text-black font-bold text-lg hover:bg-green-400 transition duration-200"
            onClick={handleRoll}
            disabled={isRolling || rollMutation.isPending}
          >
            {isRolling || rollMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Rolling...
              </span>
            ) : (
              "Roll"
            )}
          </Button>
        </div>
      </div>
      
      {/* Game History */}
      <div className="bg-neutral-800 p-4 border-t border-neutral-700">
        <h3 className="font-medium text-white mb-3">Recent Rolls</h3>
        {history.length === 0 ? (
          <p className="text-neutral-400 text-sm">No recent rolls</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((item, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  item.isWin 
                    ? 'bg-green-900 bg-opacity-30 border-green-500' 
                    : 'bg-red-900 bg-opacity-30 border-red-500'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium ${item.isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {item.isWin ? 'Win' : 'Loss'}
                  </span>
                  <span className="text-neutral-300 text-sm">{formatCurrency(item.amount, currentCurrency)}</span>
                </div>
                <div className="text-xs text-neutral-400">
                  Result: {item.roll} | Target: {item.rollOver ? 'Over' : 'Under'} {item.prediction}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}