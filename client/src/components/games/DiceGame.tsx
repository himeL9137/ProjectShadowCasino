import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBetAmount } from "@/hooks/use-bet-amount";
import { useGameHistory } from "@/hooks/use-game-history";
import { applyOptimisticDebit, applyServerBalance } from "@/lib/balance";
import { GameType } from "@shared/schema";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance?: string;
  gameData: {
    roll: number;
    prediction: number;
    rollOver: boolean;
    winChance: string;
  };
}

function useCountUp(target: number | null, duration = 600) {
  const [display, setDisplay] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) { setDisplay(null); return; }
    const start = Date.now();
    const startVal = Math.floor(Math.random() * 100) + 1;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (progress < 1) {
        setDisplay(Math.floor(startVal + (target - startVal) * eased));
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return display;
}

export function DiceGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { betAmount, setBetAmount, half, double } = useBetAmount("1.00");
  const { history, addEntry } = useGameHistory();

  const [prediction, setPrediction] = useState([50]);
  const [rollOver, setRollOver] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [targetRoll, setTargetRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const currentPrediction = prediction[0];
  const winChance = rollOver ? 100 - currentPrediction : currentPrediction - 1;
  const multiplier = winChance > 0 ? parseFloat((99 / winChance).toFixed(4)) : 99;
  const possibleWin = parseFloat(betAmount || "0") * multiplier;

  const displayRoll = useCountUp(isRolling ? null : targetRoll, 700);

  const diceHistory = history.filter(h => h.game === 'Dice').slice(0, 8);

  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: GameType.DICE,
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        prediction: currentPrediction,
        rollOver,
        clientSeed: "default",
        nonce: 1
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      setTargetRoll(data.gameData.roll);
      setLastResult(data);
      applyServerBalance(data.balance, currentCurrency);
      addEntry({
        game: 'Dice',
        isWin: data.isWin,
        betAmount: parseFloat(betAmount),
        winAmount: data.winAmount,
        multiplier: data.multiplier,
        detail: `${data.gameData.roll} (${data.gameData.rollOver ? '>' : '<'}${data.gameData.prediction})`,
      });
      setTimeout(() => setIsRolling(false), 100);
      if (data.isWin) {
        toast({ title: "🎲 You Won!", description: `+${currencySymbol}${data.winAmount.toFixed(2)}` });
      } else {
        toast({ title: "💸 You Lost", description: "Better luck next time!", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setIsRolling(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleRoll = () => {
    if (!user) return;
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({ title: "Invalid Bet", variant: "destructive" });
      return;
    }
    setIsRolling(true);
    setTargetRoll(null);
    applyOptimisticDebit(bet, currentCurrency);
    rollMutation.mutate();
  };

  const isWin = lastResult?.isWin;
  const barRoll = !isRolling && targetRoll !== null ? targetRoll : null;

  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700 max-w-2xl mx-auto">
      <div className="p-6">

        {/* Result Display */}
        <div className="text-center mb-8">
          <div className="text-sm text-neutral-400 mb-3">Result</div>
          <motion.div
            className={`inline-flex items-center justify-center w-36 h-36 rounded-2xl border-4 shadow-xl transition-all duration-500 ${
              isRolling
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400'
                : isWin === true
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-300 shadow-green-500/30'
                : isWin === false
                ? 'bg-gradient-to-br from-red-500 to-rose-600 border-red-300 shadow-red-500/30'
                : 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-500'
            }`}
            animate={isRolling ? { rotate: [0, 20, -20, 10, -10, 0], scale: [1, 1.05, 0.95, 1.02, 0.98, 1] } : {}}
            transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
          >
            <div className="text-center">
              <div className="text-white text-5xl font-black">
                {isRolling ? '?' : (displayRoll !== null ? displayRoll : '—')}
              </div>
              {!isRolling && targetRoll !== null && (
                <div className={`text-xs font-bold mt-1 ${isWin ? 'text-green-200' : 'text-red-200'}`}>
                  {isWin ? '✓ WIN' : '✗ LOSS'}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Result Bar — shows win zone (green) and loss zone (red) with marker */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden bg-neutral-700">
            {/* Win zone */}
            {rollOver ? (
              <>
                <div className="absolute inset-y-0 left-0 bg-red-600/70" style={{ width: `${currentPrediction}%` }} />
                <div className="absolute inset-y-0 right-0 bg-green-500/70" style={{ width: `${100 - currentPrediction}%` }} />
              </>
            ) : (
              <>
                <div className="absolute inset-y-0 left-0 bg-green-500/70" style={{ width: `${currentPrediction - 1}%` }} />
                <div className="absolute inset-y-0 right-0 bg-red-600/70" style={{ width: `${100 - (currentPrediction - 1)}%` }} />
              </>
            )}
            {/* Divider line */}
            <div className="absolute inset-y-0 bg-white/30 w-0.5" style={{ left: `${rollOver ? currentPrediction : currentPrediction - 1}%` }} />
            {/* Rolled marker */}
            <AnimatePresence>
              {barRoll !== null && (
                <motion.div
                  className={`absolute inset-y-0 w-1 rounded-full ${isWin ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'bg-white/60'}`}
                  style={{ left: `${barRoll}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-red-400">Lose</span>
            <span className={`font-bold ${rollOver ? 'text-green-400' : 'text-green-400'}`}>
              {rollOver ? `> ${currentPrediction} to win` : `< ${currentPrediction} to win`}
            </span>
            <span className="text-red-400">Lose</span>
          </div>
        </div>

        {/* Prediction Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-lg font-semibold">Roll {rollOver ? 'Over' : 'Under'}</span>
            <span className="text-white text-2xl font-bold bg-neutral-800 px-3 py-1 rounded-lg">{currentPrediction}</span>
          </div>
          <Slider
            value={prediction} onValueChange={setPrediction}
            min={2} max={98} step={1}
            className="w-full" disabled={isRolling}
          />
        </div>

        {/* Roll Over/Under toggle + stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center">
            <Button
              onClick={() => setRollOver(false)} disabled={isRolling}
              className={`w-full mb-2 py-2 ${!rollOver ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-neutral-700 border border-neutral-600 text-white hover:bg-neutral-600'}`}
            >
              Roll Under
            </Button>
            <div className="bg-neutral-800 rounded-lg p-2 text-center">
              <div className="text-xs text-neutral-400 mb-0.5">Multiplier</div>
              <div className="text-white font-semibold text-sm">
                {!rollOver ? multiplier.toFixed(4) : (99 / Math.max(1, currentPrediction - 1)).toFixed(4)}×
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 py-2 text-neutral-400 text-sm">Win Chance</div>
            <div className="bg-neutral-800 rounded-lg p-2">
              <div className="text-xs text-neutral-400 mb-0.5">Chance</div>
              <div className="text-white font-semibold text-lg">{winChance.toFixed(2)}%</div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setRollOver(true)} disabled={isRolling}
              className={`w-full mb-2 py-2 ${rollOver ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-neutral-700 border border-neutral-600 text-white hover:bg-neutral-600'}`}
            >
              Roll Over
            </Button>
            <div className="bg-neutral-800 rounded-lg p-2 text-center">
              <div className="text-xs text-neutral-400 mb-0.5">Multiplier</div>
              <div className="text-white font-semibold text-sm">
                {rollOver ? multiplier.toFixed(4) : (99 / Math.max(1, 100 - currentPrediction)).toFixed(4)}×
              </div>
            </div>
          </div>
        </div>

        {/* Payout + Bet */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
            <div className="text-xs text-neutral-400 mb-1">Bet Amount ({currentCurrency})</div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={half} disabled={isRolling}
                className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 h-8 px-2">½</Button>
              <Input
                type="number" value={betAmount} min="0.01" step="0.01"
                onChange={e => setBetAmount(e.target.value)}
                disabled={isRolling}
                className="bg-neutral-700 border-neutral-600 text-white text-center h-8 flex-1"
              />
              <Button size="sm" variant="outline" onClick={double} disabled={isRolling}
                className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 h-8 px-2">2×</Button>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
            <div className="text-xs text-neutral-400 mb-1">Payout on Win</div>
            <div className="text-white text-xl font-bold">{currencySymbol}{possibleWin.toFixed(2)}</div>
            <div className="text-neutral-500 text-xs">{multiplier.toFixed(4)}× multiplier</div>
          </div>
        </div>

        {/* Roll Button */}
        <Button
          className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/30"
          onClick={handleRoll}
          disabled={isRolling || rollMutation.isPending}
        >
          {isRolling || rollMutation.isPending
            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Rolling...</>
            : '🎲 ROLL'}
        </Button>
      </div>

      {/* History */}
      {diceHistory.length > 0 && (
        <div className="bg-neutral-800 px-4 py-3 border-t border-neutral-700">
          <div className="text-neutral-500 text-xs font-bold mb-2 tracking-widest">RECENT ROLLS</div>
          <div className="flex flex-wrap gap-1.5">
            {diceHistory.map((h, i) => (
              <div key={i} className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                h.isWin
                  ? 'bg-green-900/40 text-green-400 border-green-700/50'
                  : 'bg-red-900/30 text-red-400 border-red-800/50'
              }`}>
                {h.detail}
                {h.isWin && <span className="ml-1 text-green-300">+{h.winAmount.toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
