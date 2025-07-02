import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, Circle } from "lucide-react";
import { FlexibleBetInput } from "@/components/ui/flexible-bet-input";
import { Link } from "wouter";

export default function Plinko() {
  const [betAmount, setBetAmount] = useState(10);
  const [lastResult, setLastResult] = useState<any>(null);
  const [ballPosition, setBallPosition] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/wallet/balance"],
  });

  const dropMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/plinko/drop", { bet: betAmount });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setBallPosition(data.bucket);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      
      if (data.result === 'win') {
        toast({
          title: "🎉 You Win!",
          description: `You won ${data.payout} credits!`,
          className: "bg-green-600 text-white",
        });
      } else {
        toast({
          title: "Try Again",
          description: "Better luck next drop!",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrop = () => {
    if (!user || user.balance < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough credits to place this bet.",
        variant: "destructive",
      });
      return;
    }
    setBallPosition(null);
    dropMutation.mutate();
  };

  const multipliers = [16.0, 9.0, 2.0, 1.4, 1.4, 1.2, 1.0, 0.5, 0.2, 0.2, 0.2, 1.0, 1.2, 1.4, 1.4, 2.0, 9.0, 16.0];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="bg-transparent border-[hsl(var(--casino-gold))]/30 text-[hsl(var(--casino-gold))] hover:bg-[hsl(var(--casino-gold))]/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Casino
            </Button>
          </Link>
          <h1 className="text-4xl font-display font-bold text-[hsl(var(--casino-gold))]">
            ⚪ Plinko
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-400">Your Balance</div>
            <div className="text-xl font-mono font-bold text-[hsl(var(--casino-gold))]">
              {user?.balance?.toLocaleString() || 0} Credits
            </div>
          </div>
        </div>

        {/* Plinko Board */}
        <Card className="felt-table p-8 mb-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-[hsl(var(--casino-gold))] mb-6">
              Drop the Ball
            </h3>
            
            {/* Plinko Board Visualization */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 mx-auto max-w-2xl border-4 border-[hsl(var(--casino-gold))]">
              {/* Drop Zone */}
              <div className="text-center mb-6">
                <motion.div
                  className="w-8 h-8 bg-white rounded-full mx-auto shadow-lg"
                  animate={dropMutation.isPending ? { y: [0, 300] } : {}}
                  transition={{ duration: 2, ease: "easeIn" }}
                >
                  <Circle className="w-8 h-8 text-red-500" fill="currentColor" />
                </motion.div>
              </div>

              {/* Pins Grid */}
              <div className="mb-6">
                {Array.from({ length: 8 }).map((_, row) => (
                  <div key={row} className="flex justify-center mb-4" style={{ paddingLeft: `${(row % 2) * 20}px` }}>
                    {Array.from({ length: 9 - Math.floor(row / 2) }).map((_, pin) => (
                      <div
                        key={pin}
                        className="w-3 h-3 bg-[hsl(var(--casino-gold))] rounded-full mx-2"
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Buckets */}
              <div className="grid grid-cols-9 gap-1 mb-4">
                {multipliers.slice(0, 9).map((multiplier, index) => (
                  <div
                    key={index}
                    className={`text-center p-3 rounded-lg border-2 ${
                      ballPosition === index
                        ? 'bg-[hsl(var(--win-green))] border-[hsl(var(--win-green))] animate-pulse'
                        : multiplier >= 2.0
                        ? 'bg-red-600 border-red-500'
                        : multiplier >= 1.0
                        ? 'bg-yellow-600 border-yellow-500'
                        : 'bg-gray-600 border-gray-500'
                    }`}
                  >
                    <div className="text-white font-bold text-sm">{multiplier}x</div>
                  </div>
                ))}
              </div>

              {lastResult && (
                <div className="text-center">
                  <Badge className={`px-6 py-3 text-lg font-bold ${
                    lastResult.result === 'win' 
                      ? 'bg-[hsl(var(--win-green))] text-white' 
                      : 'bg-[hsl(var(--loss-red))] text-white'
                  }`}>
                    {lastResult.result === 'win' 
                      ? `${lastResult.multiplier}x - Won ${lastResult.payout} Credits!` 
                      : `${lastResult.multiplier}x - Lost ${betAmount} Credits`
                    }
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Bet Controls */}
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="text-xl font-bold text-[hsl(var(--casino-gold))] text-center">Place Your Bet</h4>
            
            <FlexibleBetInput
              value={betAmount}
              onChange={setBetAmount}
              disabled={dropMutation.isPending}
              currency={balance?.currency || 'USD'}
              balance={parseFloat(balance?.balance || '0')}
              minBet={1}
              maxBet={1000}
              className="max-w-sm mx-auto"
            />

            <div className="text-center">
              <Button
                onClick={handleDrop}
                disabled={dropMutation.isPending || !user || user.balance < betAmount}
                className="casino-button px-12 py-4 text-xl font-bold"
              >
                ⚪ {dropMutation.isPending ? "Dropping..." : "Drop Ball"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Multiplier Table */}
        <Card className="casino-card p-6">
          <h3 className="text-xl font-bold text-[hsl(var(--casino-gold))] mb-4">
            Multiplier Table
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {multipliers.slice(0, 9).map((multiplier, index) => (
              <div
                key={index}
                className={`text-center p-3 rounded-lg ${
                  multiplier >= 2.0
                    ? 'bg-red-600/20 border border-red-500'
                    : multiplier >= 1.0
                    ? 'bg-yellow-600/20 border border-yellow-500'
                    : 'bg-gray-600/20 border border-gray-500'
                }`}
              >
                <div className="text-white font-bold">{multiplier}x</div>
                <div className="text-sm text-gray-400">Bucket {index + 1}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center text-gray-300">
            <p>Drop the ball and watch it bounce through the pins!</p>
            <p>Higher multipliers are rarer but give bigger payouts.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}