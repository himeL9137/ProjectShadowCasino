import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AdminRoute } from "@/components/guards/AdminRoute";
import { useBalance } from "@/providers/BalanceProvider";

interface DiceResult {
  roll: number;
  result: 'win' | 'lose';
  payout: number;
  multiplier: number;
  prediction: number;
  rollOver: boolean;
}

interface RecentRoll {
  roll: number;
  isWin: boolean;
  timestamp: number;
}

function DicePageContent() {
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState([50]);
  const [rollOver, setRollOver] = useState(true);
  const [recentRolls, setRecentRolls] = useState<RecentRoll[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  
  const { toast } = useToast();
  const { balance, setBalance } = useBalance();

  // Calculate multiplier and win chance based on target and roll direction
  const targetNumber = target[0];
  const winChance = rollOver ? (100 - targetNumber) : targetNumber;
  const multiplier = winChance > 0 ? (99 / winChance) : 1;

  // Dice roll mutation
  const rollDice = useMutation({
    mutationFn: async (): Promise<DiceResult> => {
      setIsRolling(true);
      const response = await apiRequest("POST", "/api/dice/roll", {
        bet: betAmount,
        prediction: targetNumber,
        rollOver: rollOver,
        clientSeed: Date.now().toString(),
        nonce: 1
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to roll dice");
      }
      
      return await response.json();
    },
    onSuccess: (data: DiceResult) => {
      // Add to recent rolls
      const newRoll: RecentRoll = {
        roll: data.roll,
        isWin: data.result === 'win',
        timestamp: Date.now()
      };
      setRecentRolls(prev => [newRoll, ...prev.slice(0, 4)]);
      
      // Show result toast
      if (data.result === 'win') {
        toast({
          title: "🎉 You Won!",
          description: `Roll: ${data.roll.toFixed(2)} | Payout: ${data.payout.toFixed(2)}`,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ You Lost",
          description: `Roll: ${data.roll.toFixed(2)} | Better luck next time!`,
          variant: "destructive",
        });
      }
      
      // We'll get the updated balance from the game result
      setIsRolling(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to roll dice",
        variant: "destructive",
      });
      setIsRolling(false);
    },
  });

  const handleRoll = () => {
    if (betAmount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (balance < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    rollDice.mutate();
  };

  const doubleBet = () => setBetAmount(prev => prev * 2);
  const halveBet = () => setBetAmount(prev => Math.max(1, prev / 2));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🎲 DICE GAME</h1>
            <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* Roll Direction Selection */}
          <div className="mb-8">
            <h3 className="text-white text-lg font-semibold mb-4">🔵 Choose Roll Over or Under</h3>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant={!rollOver ? "default" : "outline"}
                onClick={() => setRollOver(false)}
                className={`px-6 py-3 ${!rollOver 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                }`}
              >
                &lt; Roll Under
              </Button>
              
              <div className="text-white text-2xl font-bold px-4">
                {targetNumber.toFixed(2)}
              </div>
              
              <Button
                variant={rollOver ? "default" : "outline"}
                onClick={() => setRollOver(true)}
                className={`px-6 py-3 ${rollOver 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                }`}
              >
                &gt; Roll Over
              </Button>
            </div>

            {/* Target Slider */}
            <div className="px-4 mb-6">
              <Slider
                value={target}
                onValueChange={setTarget}
                min={2}
                max={98}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-white/70 text-sm mt-2">
                <span>2.00</span>
                <span>50.00</span>
                <span>98.00</span>
              </div>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className="text-white/70 text-sm">🎯 Target Number</div>
              <div className="text-white text-2xl font-bold">{targetNumber.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-white/70 text-sm">🎚️ Multiplier</div>
              <div className="text-white text-2xl font-bold">{multiplier.toFixed(2)}x</div>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="text-white/70 text-sm">🎛️ Chance to Win</div>
            <div className="text-white text-3xl font-bold">{winChance.toFixed(2)}%</div>
          </div>

          {/* Bet Controls */}
          <div className="mb-8">
            <h3 className="text-white text-lg font-semibold mb-4">🔢 Input Bet</h3>
            <div className="flex items-center gap-4 justify-center">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-32 text-center bg-white/10 border-white/30 text-white placeholder-white/50"
                placeholder="Bet amount"
              />
              <Button
                onClick={doubleBet}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                ⬆️ Double
              </Button>
              <Button
                onClick={halveBet}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                ⬇️ Halve
              </Button>
            </div>
          </div>

          {/* Roll Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleRoll}
              disabled={isRolling || rollDice.isPending}
              className={`px-12 py-4 text-xl font-bold ${
                isRolling 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
              }`}
            >
              {isRolling ? '🎲 Rolling...' : '💥 ROLL'}
            </Button>
          </div>

          {/* Recent Rolls */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">💬 Recent Rolls</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {recentRolls.length === 0 ? (
                <div className="text-white/50 text-center py-4">
                  No rolls yet - place your first bet!
                </div>
              ) : (
                recentRolls.map((roll, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 rounded-lg font-bold text-lg ${
                      roll.isWin 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    }`}
                  >
                    🎲 {roll.roll.toFixed(2)}
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DicePage() {
  return (
    <AdminRoute>
      <DicePageContent />
    </AdminRoute>
  );
}