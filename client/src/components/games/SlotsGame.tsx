import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '👑', '🎰', '7️⃣', '💰', '🃏'];
const SYMBOL_MULTIPLIERS: Record<string, number> = {
  '7️⃣': 10, '🎰': 8, '👑': 7, '💎': 5,
  '💰': 4, '⭐': 3, '🔔': 2, '🍒': 1.5, '🍋': 1.2, '🃏': 1.1
};

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    reels: string[][];
    middleRow: string[];
    isMatch: boolean;
  };
}

function randomSym() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

export function SlotsGame() {
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState("1.00");
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string; symbols: string[] }[]>([]);

  // 3 reels × 3 rows [top, middle, bottom]
  const [reelDisplay, setReelDisplay] = useState<[string, string, string][]>([
    ['🍒', '🔔', '💎'],
    ['🍋', '⭐', '7️⃣'],
    ['👑', '🎰', '🍒'],
  ]);

  const intervalRefs = useRef<(ReturnType<typeof setInterval> | null)[]>([null, null, null]);
  const resultRef = useRef<GameResult | null>(null);

  const stopReel = useCallback((reelIdx: number, isLastReel: boolean) => {
    if (intervalRefs.current[reelIdx]) {
      clearInterval(intervalRefs.current[reelIdx]!);
      intervalRefs.current[reelIdx] = null;
    }
    // Snap to final result
    if (resultRef.current) {
      const fr = resultRef.current.gameData.reels;
      setReelDisplay(prev => {
        const next = [...prev] as [string, string, string][];
        next[reelIdx] = [fr[reelIdx][0], fr[reelIdx][1], fr[reelIdx][2]];
        return next;
      });
      if (isLastReel) {
        setIsSpinning(false);
        setShowWin(resultRef.current.isWin);
        if (resultRef.current.isWin) {
          toast({
            title: `🎉 WIN! ${resultRef.current.multiplier}x`,
            description: `+${resultRef.current.winAmount.toFixed(2)} ${currentCurrency}`,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      }
    }
  }, [currentCurrency, toast]);

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
      resultRef.current = data;
      setLastResult(data);
      setHistory(prev => [
        { isWin: data.isWin, amount: data.isWin ? data.winAmount.toFixed(2) : betAmount, symbols: data.gameData.middleRow },
        ...prev.slice(0, 9)
      ]);
      if (!data.isWin) {
        toast({ title: "No match — try again!", variant: "destructive" });
      }
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
      toast({ title: "Invalid bet", description: "Enter a valid bet amount", variant: "destructive" });
      return;
    }
    setIsSpinning(true);
    setShowWin(false);
    resultRef.current = null;

    // Start spinning all reels
    const reelIntervals = [null, null, null] as (ReturnType<typeof setInterval> | null)[];
    for (let r = 0; r < 3; r++) {
      const reelIdx = r;
      reelIntervals[reelIdx] = setInterval(() => {
        setReelDisplay(prev => {
          const next = [...prev] as [string, string, string][];
          next[reelIdx] = [randomSym(), randomSym(), randomSym()];
          return next;
        });
      }, 80);
      intervalRefs.current[reelIdx] = reelIntervals[reelIdx];
    }

    spinMutation.mutate();

    // Stop reels at staggered intervals (1.5s, 2.0s, 2.5s)
    const stopDelays = [1500, 2000, 2500];
    stopDelays.forEach((delay, idx) => {
      setTimeout(() => {
        // Wait for result if not yet available
        const tryStop = () => {
          if (resultRef.current || idx < 2) {
            stopReel(idx, idx === 2);
          } else {
            setTimeout(tryStop, 200); // retry
          }
        };
        tryStop();
      }, delay);
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(ref => { if (ref) clearInterval(ref); });
    };
  }, []);

  const fmt = (v: number) => v.toFixed(2);

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-900 p-4 text-center border-b border-yellow-600">
        <div className="text-2xl font-black text-yellow-400 tracking-widest">🎰 SHADOW SLOTS 🎰</div>
      </div>

      <div className="p-5">
        {/* Slot Machine Display */}
        <div className="bg-gray-950 rounded-xl p-4 mb-4 border-2 border-yellow-600">
          <div className="relative">
            {/* Win line indicator */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className={`h-px w-full ${showWin ? 'bg-yellow-400/60' : 'bg-gray-600/40'} transition-colors duration-500`} />
            </div>

            <div className="flex gap-3 justify-center">
              {[0, 1, 2].map(reelIdx => (
                <div key={reelIdx} className="flex flex-col gap-1 w-24">
                  {reelDisplay[reelIdx]?.map((sym, rowIdx) => (
                    <div
                      key={rowIdx}
                      className={`
                        h-20 flex items-center justify-center rounded-lg text-4xl select-none
                        transition-all duration-200
                        ${isSpinning ? 'opacity-70' : 'opacity-100'}
                        ${rowIdx === 1 && showWin
                          ? 'bg-yellow-400/25 ring-2 ring-yellow-400 scale-110 animate-pulse shadow-lg shadow-yellow-500/30'
                          : rowIdx === 1
                          ? 'bg-gray-800 ring-1 ring-gray-600'
                          : 'bg-gray-800/50 ring-1 ring-gray-700'}
                      `}
                    >
                      <span className={isSpinning ? 'blur-[1px]' : ''}>{sym}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win line label */}
          <div className="text-center mt-3">
            <span className={`text-xs font-bold tracking-[0.3em] ${showWin ? 'text-yellow-400' : 'text-gray-600'} transition-colors duration-500`}>
              ══ WIN LINE ══
            </span>
          </div>
        </div>

        {/* Win Celebration */}
        {showWin && lastResult && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 text-center animate-bounce">
            <div className="text-yellow-400 font-black text-2xl">🎉 WIN! {lastResult.multiplier}x</div>
            <div className="text-green-400 font-bold text-lg">+{lastResult.winAmount.toFixed(2)} {currentCurrency}</div>
            <div className="text-gray-400 text-sm">{lastResult.gameData.middleRow.join(' ')} matched!</div>
          </div>
        )}

        {/* Paytable */}
        <div className="bg-gray-800/80 rounded-xl p-3 mb-4 border border-gray-700">
          <div className="text-gray-400 text-xs font-bold mb-2 text-center">PAYTABLE — Match 3 on middle row</div>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(SYMBOL_MULTIPLIERS).map(([sym, mult]) => (
              <div key={sym} className="bg-gray-700 rounded-lg p-1.5 text-center">
                <div className="text-xl">{sym}</div>
                <div className="text-yellow-400 text-xs font-bold">{mult}x</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-2">Bet ({currentCurrency})</div>
            <Input
              type="number" value={betAmount}
              onChange={e => setBetAmount(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white text-center mb-2"
              disabled={isSpinning} min="0.01" step="0.01"
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-gray-700 border-gray-600 text-gray-300"
                disabled={isSpinning} onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) / 2))}>½</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-gray-700 border-gray-600 text-gray-300"
                disabled={isSpinning} onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) * 2))}>2×</Button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-2">Max Win (estimate)</div>
            <div className="text-yellow-400 font-black text-xl">{fmt((parseFloat(betAmount) || 0) * 10)}</div>
            <div className="text-gray-500 text-xs">if 7️⃣7️⃣7️⃣ hits (10x)</div>
          </div>
        </div>

        {/* Spin Button */}
        <Button
          className="w-full py-5 text-xl font-black rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-900 shadow-lg shadow-yellow-500/30 transition-all"
          onClick={startSpin}
          disabled={isSpinning || spinMutation.isPending}
        >
          {isSpinning
            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Spinning...</>
            : '🎰 SPIN'}
        </Button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="text-gray-500 text-xs font-bold mb-2">RECENT SPINS</div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h, i) => (
              <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                h.isWin
                  ? 'bg-green-900/40 text-green-400 border-green-700/50'
                  : 'bg-gray-700/50 text-gray-400 border-gray-600/50'
              }`}>
                <span>{h.symbols?.join('') ?? '···'}</span>
                {h.isWin && <span className="text-green-300">+{h.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
