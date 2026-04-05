import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useBetAmount } from "@/hooks/use-bet-amount";
import { useGameHistory } from "@/hooks/use-game-history";
import { applyOptimisticDebit, applyServerBalance } from "@/lib/balance";
import { GameHistoryFeed } from "@/components/common/GameHistoryFeed";
import { GameType } from "@shared/schema";

// Symbols and multipliers must match the backend exactly (server/games.ts processSlotsGame)
const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '👑', '🎰', '7️⃣', '💰', '🃏'];
const SYMBOL_MULTIPLIERS: Record<string, number> = {
  '7️⃣': 10, '🎰': 8, '👑': 7, '💎': 5, '💰': 4, '⭐': 3, '🔔': 2, '🍒': 1.5, '🍋': 1.2, '🃏': 1.1
};

function validateSlotsResponse(data: any): data is GameResult {
  const required = ['isWin', 'winAmount', 'multiplier', 'gameData'] as const;
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      console.error(`[Slots] API response missing field: ${field}`, data);
      throw new Error(`Missing field: ${field}`);
    }
  }
  const gd = data.gameData;
  if (!gd.reels || !gd.middleRow) {
    console.error('[Slots] API response missing gameData.reels / gameData.middleRow', data);
    throw new Error('Missing gameData.reels or gameData.middleRow');
  }
  return true;
}

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance?: string;
  gameData: { reels: string[][]; middleRow: string[]; isMatch: boolean };
}

function randomSym() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

export function SlotsGame() {
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();
  const { toast } = useToast();
  const { betAmount, setBetAmount, half, double } = useBetAmount("1.00");
  const { history, addEntry } = useGameHistory();

  const [isSpinning, setIsSpinning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [bigWin, setBigWin] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const [reelDisplay, setReelDisplay] = useState<[string, string, string][]>([
    ['🍒', '💎', '7️⃣'],
    ['🍋', '🍊', '🍇'],
    ['🎰', '🍒', '💎'],
  ]);

  const stoppedReels = useRef<boolean[]>([false, false, false]);
  const intervalRefs = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null]);
  const resultRef = useRef<GameResult | null>(null);

  const stopReel = useCallback((reelIdx: number, isLastReel: boolean) => {
    if (intervalRefs.current[reelIdx]) {
      clearInterval(intervalRefs.current[reelIdx]!);
      intervalRefs.current[reelIdx] = null;
    }
    stoppedReels.current[reelIdx] = true;

    if (resultRef.current) {
      const fr = resultRef.current.gameData.reels;
      setReelDisplay(prev => {
        const next = [...prev] as [string, string, string][];
        next[reelIdx] = [fr[reelIdx][0], fr[reelIdx][1], fr[reelIdx][2]];
        return next;
      });
    }

    if (isLastReel && resultRef.current) {
      const res = resultRef.current;
      setIsSpinning(false);
      setShowWin(res.isWin);
      const isBig = res.isWin && res.multiplier >= 5;
      setBigWin(isBig);
      applyServerBalance(res.balance, currentCurrency);
      addEntry({
        game: 'Slots',
        isWin: res.isWin,
        betAmount: parseFloat(betAmount),
        winAmount: res.winAmount,
        multiplier: res.multiplier,
        detail: res.gameData.middleRow.join(''),
      });
      if (res.isWin) {
        toast({ title: `🎉 ${res.multiplier}x WIN!`, description: `+${res.winAmount.toFixed(2)} ${currentCurrency}` });
        if (isBig) setTimeout(() => setBigWin(false), 4000);
      } else {
        toast({ title: "No match — try again!", variant: "destructive" });
      }
    }
  }, [currentCurrency, betAmount, toast, addEntry]);

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
      validateSlotsResponse(data);
      resultRef.current = data;
      setLastResult(data);
    },
    onError: (error: Error) => {
      setIsSpinning(false);
      intervalRefs.current.forEach(ref => { if (ref) clearInterval(ref); });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const startSpin = () => {
    if (!user || isSpinning) return;
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({ title: "Invalid bet", variant: "destructive" });
      return;
    }

    setIsSpinning(true);
    setShowWin(false);
    setBigWin(false);
    resultRef.current = null;
    stoppedReels.current = [false, false, false];

    applyOptimisticDebit(bet, currentCurrency);

    for (let r = 0; r < 3; r++) {
      const reelIdx = r;
      intervalRefs.current[reelIdx] = setInterval(() => {
        setReelDisplay(prev => {
          const next = [...prev] as [string, string, string][];
          next[reelIdx] = [randomSym(), randomSym(), randomSym()];
          return next;
        });
      }, 70);
    }

    spinMutation.mutate();

    const stopDelays = [1500, 2100, 2700];
    stopDelays.forEach((delay, idx) => {
      setTimeout(() => {
        const tryStop = () => {
          if (resultRef.current !== null || idx < 2) {
            stopReel(idx, idx === 2);
          } else {
            setTimeout(tryStop, 150);
          }
        };
        tryStop();
      }, delay);
    });
  };

  useEffect(() => {
    return () => { intervalRefs.current.forEach(ref => { if (ref) clearInterval(ref); }); };
  }, []);

  const fmt = (v: number) => v.toFixed(2);
  const slotHistory = history.filter(h => h.game === 'Slots').slice(0, 8);

  return (
    <div className={`bg-gray-900 rounded-2xl overflow-hidden border transition-all duration-700 max-w-lg mx-auto relative ${
      bigWin ? 'border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.5)]' : 'border-gray-700'
    }`}>
      {/* Big Win Glow Overlay */}
      <AnimatePresence>
        {bigWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.1, 0.3, 0.1, 0] }}
            transition={{ duration: 4, times: [0, 0.1, 0.3, 0.5, 0.7, 1] }}
            className="absolute inset-0 bg-yellow-400 pointer-events-none z-20 rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-900 p-4 text-center border-b border-yellow-600 relative z-10">
        <div className="text-2xl font-black text-yellow-400 tracking-widest">🎰 SHADOW SLOTS 🎰</div>
        <div className="text-yellow-600 text-xs mt-1">Match 3 on the centre line to win</div>
      </div>

      <div className="p-5 relative z-10">
        {/* Slot Machine */}
        <div className={`rounded-xl p-4 mb-4 border-2 transition-all duration-500 ${
          showWin ? 'bg-gray-950 border-yellow-500 shadow-[inset_0_0_30px_rgba(250,204,21,0.15)]' : 'bg-gray-950 border-gray-700'
        }`}>
          {/* Win line indicator */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-[calc(50%-1px)] pointer-events-none z-10">
              <div className={`h-0.5 w-full transition-all duration-500 ${showWin ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-gray-600/40'}`} />
            </div>

            <div className="flex gap-3 justify-center">
              {[0, 1, 2].map(reelIdx => (
                <div key={reelIdx} className="flex flex-col gap-1.5 w-24 overflow-hidden">
                  {reelDisplay[reelIdx]?.map((sym, rowIdx) => (
                    <motion.div
                      key={`${reelIdx}-${rowIdx}`}
                      className={`h-20 flex items-center justify-center rounded-lg text-4xl select-none transition-all duration-200 ${
                        rowIdx === 1 && showWin
                          ? 'bg-yellow-500/20 ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/40'
                          : rowIdx === 1
                          ? 'bg-gray-800 ring-1 ring-gray-600'
                          : 'bg-gray-800/50 ring-1 ring-gray-700 opacity-60'
                      }`}
                      animate={isSpinning ? { y: [0, -4, 4, 0] } : {}}
                      transition={{ duration: 0.07, repeat: isSpinning ? Infinity : 0 }}
                    >
                      <span className={`transition-all duration-100 ${isSpinning ? 'blur-[1.5px] scale-90' : 'scale-100'}`}>
                        {sym}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-3">
            <span className={`text-xs font-bold tracking-[0.3em] transition-colors duration-500 ${showWin ? 'text-yellow-400' : 'text-gray-600'}`}>
              ══ WIN LINE ══
            </span>
          </div>
        </div>

        {/* Win Celebration */}
        <AnimatePresence>
          {showWin && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 text-center"
            >
              <div className="text-yellow-400 font-black text-3xl mb-1">
                {lastResult.multiplier >= 8 ? '🔥 ' : '🎉 '}{lastResult.multiplier}x
              </div>
              <div className="text-green-400 font-bold text-xl">+{lastResult.winAmount.toFixed(2)} {currentCurrency}</div>
              <div className="text-gray-400 text-sm mt-1">{lastResult.gameData.middleRow.join(' ')}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paytable */}
        <div className="bg-gray-800/80 rounded-xl p-3 mb-4 border border-gray-700">
          <div className="text-gray-400 text-xs font-bold mb-2 text-center tracking-widest">PAYTABLE — 3 of a kind on centre</div>
          <div className="grid grid-cols-7 gap-1">
            {Object.entries(SYMBOL_MULTIPLIERS).map(([sym, mult]) => (
              <div key={sym} className="bg-gray-700 rounded-lg p-1.5 text-center">
                <div className="text-xl">{sym}</div>
                <div className="text-yellow-400 text-xs font-bold">{mult}x</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 mb-4">
          <div className="text-gray-400 text-xs mb-2">Bet Amount ({currentCurrency})</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 w-10"
              disabled={isSpinning} onClick={half}>½</Button>
            <Input
              type="number" value={betAmount}
              onChange={e => setBetAmount(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white text-center flex-1"
              disabled={isSpinning} min="0.01" step="0.01"
            />
            <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 w-10"
              disabled={isSpinning} onClick={double}>2×</Button>
          </div>
          <div className="text-gray-500 text-xs mt-2 text-center">
            Max win: {fmt((parseFloat(betAmount) || 0) * 10)} {currentCurrency} (7️⃣7️⃣7️⃣ = 10×)
          </div>
        </div>

        {/* Spin Button */}
        <Button
          className={`w-full py-5 text-xl font-black rounded-xl transition-all duration-300 ${
            isSpinning
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-900 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/50 hover:scale-[1.02]'
          }`}
          onClick={startSpin}
          disabled={isSpinning || spinMutation.isPending}
        >
          {isSpinning
            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Spinning...</>
            : '🎰 SPIN'}
        </Button>
      </div>

      {/* History Feed */}
      {slotHistory.length > 0 && (
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="text-gray-500 text-xs font-bold mb-2 tracking-widest">RECENT SPINS</div>
          <div className="flex flex-wrap gap-1.5">
            {slotHistory.map((h, i) => (
              <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                h.isWin
                  ? 'bg-green-900/40 text-green-400 border-green-700/50'
                  : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
              }`}>
                <span>{h.detail || '···'}</span>
                {h.isWin && <span className="text-green-300">+{h.winAmount.toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
