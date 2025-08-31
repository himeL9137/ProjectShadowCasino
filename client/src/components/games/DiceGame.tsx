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
        <div className="mb-6 flex flex-col items-center justify-center bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <div className="text-white text-center mb-6">
            <p className="text-2xl font-bold font-sans tracking-tight">Dice</p>
            <p className="text-sm text-neutral-400">Predict if the roll will be over or under your target</p>
          </div>

          {/* Dice Display */}
          <div className="mb-6">
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg flex items-center justify-center border-4 border-white"
              animate={isRolling ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <span className="text-white text-3xl font-bold">
                {isRolling ? "?" : (lastRoll || "?")}
              </span>
            </motion.div>
            {lastRoll !== null && (
              <div className="text-center mt-2">
                <span className="text-sm text-neutral-400">Last Roll: </span>
                <span className="text-white font-semibold">{lastRoll}</span>
              </div>
            )}
          </div>

          {/* Prediction Slider */}
          <div className="w-full max-w-md mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">Prediction</span>
              <span className="text-white font-semibold">{currentPrediction}</span>
            </div>
            <Slider
              value={prediction}
              onValueChange={setPrediction}
              min={2}
              max={98}
              step={1}
              className="w-full"
              disabled={isRolling}
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>2</span>
              <span>98</span>
            </div>
          </div>

          {/* Roll Over/Under Buttons */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={rollOver ? "default" : "outline"}
              onClick={() => setRollOver(true)}
              disabled={isRolling}
              className={`flex-1 py-3 px-6 ${rollOver ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Roll Over {currentPrediction}
            </Button>
            <Button
              variant={!rollOver ? "default" : "outline"}
              onClick={() => setRollOver(false)}
              disabled={isRolling}
              className={`flex-1 py-3 px-6 ${!rollOver ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              Roll Under {currentPrediction}
            </Button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <div className="text-xs text-neutral-400 mb-1">Win Chance</div>
              <div className="text-white font-semibold">{winChance.toFixed(2)}%</div>
            </div>
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <div className="text-xs text-neutral-400 mb-1">Multiplier</div>
              <div className="text-white font-semibold">{multiplier.toFixed(2)}x</div>
            </div>
          </div>
        </div>
        
        {/* Betting Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1 font-sans">Bet Amount</div>
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
            <div className="text-sm text-neutral-400 mb-1 font-sans">Possible Win</div>
            <div className="text-white font-semibold text-lg font-sans">
              {formatCurrency(possibleWin, currentCurrency)}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
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
                Rolling...
              </span>
            ) : (
              "Roll Dice"
            )}
          </Button>
        </div>
      </div>
      
      {/* Game History */}
      <div className="bg-neutral-800 p-4 border-t border-neutral-700">
        <h3 className="font-medium text-white mb-2 font-sans">Recent Rolls</h3>
        {history.length === 0 ? (
          <p className="text-neutral-400 text-sm font-sans">No recent rolls</p>
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
                  Roll: {item.roll} | Prediction: {item.rollOver ? 'Over' : 'Under'} {item.prediction}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}