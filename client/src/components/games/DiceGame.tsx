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
import { Loader2 } from "lucide-react";
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
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700 max-w-4xl mx-auto">
      <div className="p-6">
        {/* Top Controls Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Left side - Bet controls */}
          <div className="flex items-center space-x-3">
            <div className="bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-700">
              <div className="text-xs text-neutral-400 mb-1">Bet Amount ({currentCurrency})</div>
              <div className="flex items-center">
                <button 
                  onClick={handleHalfBet}
                  disabled={isRolling}
                  className="text-neutral-400 hover:text-white text-lg font-bold px-2"
                >
                  -
                </button>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => handleBetAmountChange(e.target.value)}
                  className="bg-transparent border-none text-white text-center w-20 p-0 h-auto"
                  disabled={isRolling}
                  step="0.01"
                  min="0.01"
                />
                <button 
                  onClick={handleDoubleBet}
                  disabled={isRolling}
                  className="text-neutral-400 hover:text-white text-lg font-bold px-2"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex space-x-1">
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
                variant="outline" 
                size="sm"
                onClick={() => setBetAmount("0.01")}
                disabled={isRolling}
                className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
              >
                Min
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBetAmount("100.00")}
                disabled={isRolling}
                className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Right side - Auto button */}
          <Button
            variant="outline"
            className="bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
            disabled
          >
            Auto
          </Button>
        </div>

        {/* Main Game Area */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          
          {/* Result Display */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <div className="text-sm text-neutral-400 mb-2">Result</div>
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white"
                animate={isRolling ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360]
                } : {}}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              >
                <div className="text-center">
                  <div className="text-white text-4xl font-bold">
                    {isRolling ? "?" : (lastRoll !== null ? lastRoll : "0")}
                  </div>
                  {lastRoll !== null && !isRolling && (
                    <div className="text-white text-xs opacity-80 mt-1">
                      {history[0]?.isWin ? "YOU WIN" : "YOU LOST"}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Prediction Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white text-lg font-semibold">
                Roll {rollOver ? 'Over' : 'Under'}
              </div>
              <div className="text-white text-2xl font-bold">
                {currentPrediction}
              </div>
            </div>
            
            <div className="relative mb-4">
              <Slider
                value={prediction}
                onValueChange={setPrediction}
                min={2}
                max={98}
                step={1}
                className="w-full"
                disabled={isRolling}
              />
              {/* Scale markers */}
              <div className="flex justify-between text-xs text-neutral-500 mt-2 px-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Roll Over/Under Controls and Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Roll Under */}
            <div className="text-center">
              <Button
                variant={!rollOver ? "default" : "outline"}
                onClick={() => setRollOver(false)}
                disabled={isRolling}
                className={`w-full mb-3 py-3 ${!rollOver ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600'}`}
              >
                Roll Under
              </Button>
              <div className="bg-neutral-700 rounded-lg p-3">
                <div className="text-xs text-neutral-400 mb-1">Multiplier</div>
                <div className="text-white font-semibold">
                  {!rollOver ? multiplier.toFixed(4) + 'x' : (99 / (currentPrediction - 1)).toFixed(4) + 'x'}
                </div>
              </div>
            </div>

            {/* Win Chance */}
            <div className="text-center">
              <div className="mb-3 py-3">
                <div className="text-neutral-400 text-sm">Win Chance</div>
              </div>
              <div className="bg-neutral-700 rounded-lg p-3">
                <div className="text-xs text-neutral-400 mb-1">Win Chance</div>
                <div className="text-white font-semibold text-lg">
                  {winChance.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Roll Over */}
            <div className="text-center">
              <Button
                variant={rollOver ? "default" : "outline"}
                onClick={() => setRollOver(true)}
                disabled={isRolling}
                className={`w-full mb-3 py-3 ${rollOver ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600'}`}
              >
                Roll Over
              </Button>
              <div className="bg-neutral-700 rounded-lg p-3">
                <div className="text-xs text-neutral-400 mb-1">Multiplier</div>
                <div className="text-white font-semibold">
                  {rollOver ? multiplier.toFixed(4) + 'x' : (99 / (100 - currentPrediction)).toFixed(4) + 'x'}
                </div>
              </div>
            </div>
          </div>

          {/* Payout Display */}
          <div className="text-center mb-6">
            <div className="bg-neutral-700 rounded-lg p-4">
              <div className="text-sm text-neutral-400 mb-1">Payout on Win</div>
              <div className="text-white text-xl font-bold">
                {formatCurrency(possibleWin, currentCurrency)}
              </div>
            </div>
          </div>

          {/* Roll Button */}
          <Button 
            variant="default" 
            className="w-full py-4 rounded-lg bg-purple-500 text-white font-bold text-xl hover:bg-purple-400 transition duration-200"
            onClick={handleRoll}
            disabled={isRolling || rollMutation.isPending}
          >
            {isRolling || rollMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Rolling...
              </span>
            ) : (
              "ROLL"
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