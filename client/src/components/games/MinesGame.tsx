import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bomb, Gem, Trophy } from "lucide-react";

interface TileState {
  position: number;
  isRevealed: boolean;
  isMine: boolean;
  isGem: boolean;
}

type Phase = 'setup' | 'playing' | 'gameover' | 'cashout';

export function MinesGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState("1.00");
  const [mineCount, setMineCount] = useState([3]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [grid, setGrid] = useState<TileState[]>(
    Array(25).fill(null).map((_, i) => ({ position: i, isRevealed: false, isMine: false, isGem: false }))
  );
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [currentWin, setCurrentWin] = useState(0);
  const [gemsFound, setGemsFound] = useState(0);
  const [explodedPos, setExplodedPos] = useState<number | null>(null);
  const [finalWin, setFinalWin] = useState<number | null>(null);

  const fmt = (v: number) => v.toFixed(2);

  const calcNextMultiplier = () => {
    const gems = gemsFound + 1;
    const safe = 25 - mineCount[0];
    let mult = 1.0;
    for (let i = 0; i < gems; i++) {
      mult /= ((safe - i) / (25 - i));
    }
    return Math.round(mult * 0.97 * 100) / 100;
  };

  // Start game
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/mines/start", {
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        mineCount: mineCount[0]
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setGrid(data.grid);
      setCurrentMultiplier(1.0);
      setCurrentWin(0);
      setGemsFound(0);
      setExplodedPos(null);
      setFinalWin(null);
      setPhase('playing');
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      toast({ title: `💣 Game Started — ${mineCount[0]} mines hidden!` });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  // Reveal tile
  const revealMutation = useMutation({
    mutationFn: async (position: number) => {
      const res = await apiRequest("POST", "/api/games/mines/reveal", { sessionId, position });
      return res.json();
    },
    onSuccess: (data) => {
      setGrid(data.grid);
      if (data.hitMine) {
        setExplodedPos(data.position);
        setPhase('gameover');
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
        toast({ title: "💥 BOOM! Mine hit!", description: "You lost your bet.", variant: "destructive" });
      } else {
        setGemsFound(data.gemsFound);
        setCurrentMultiplier(data.multiplier);
        setCurrentWin(data.currentWin || 0);
        toast({ title: `💎 Gem! ${data.multiplier}x`, description: `Current win: ${currencySymbol}${fmt(data.currentWin || 0)}` });
      }
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  // Cash out
  const cashoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/mines/cashout", { sessionId });
      return res.json();
    },
    onSuccess: (data) => {
      setGrid(data.grid);
      setFinalWin(data.winAmount);
      setPhase('cashout');
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      toast({ title: `🎉 Cashed out!`, description: `Won ${currencySymbol}${fmt(data.winAmount)} at ${data.multiplier}x` });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const handleTileClick = (position: number) => {
    if (phase !== 'playing' || grid[position].isRevealed || revealMutation.isPending) return;
    revealMutation.mutate(position);
  };

  const resetGame = () => {
    setPhase('setup');
    setSessionId(null);
    setGrid(Array(25).fill(null).map((_, i) => ({ position: i, isRevealed: false, isMine: false, isGem: false })));
    setCurrentMultiplier(1.0);
    setCurrentWin(0);
    setGemsFound(0);
    setExplodedPos(null);
    setFinalWin(null);
  };

  const getTileStyle = (tile: TileState, idx: number) => {
    const base = "w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all duration-300 cursor-pointer text-2xl ";
    if (phase === 'gameover' && tile.isMine) {
      return base + (explodedPos === idx
        ? "bg-red-600 border-red-400 scale-110 animate-pulse"
        : "bg-red-900 border-red-700");
    }
    if (tile.isRevealed && tile.isGem) return base + "bg-emerald-800 border-emerald-500 cursor-default scale-95";
    if (tile.isRevealed && tile.isMine) return base + "bg-red-900 border-red-600 cursor-default";
    if (!tile.isRevealed && phase === 'playing') return base + "bg-slate-700 border-slate-500 hover:bg-slate-600 hover:border-slate-400 hover:scale-105 active:scale-95";
    if (!tile.isRevealed && (phase === 'gameover' || phase === 'cashout')) return base + "bg-slate-700 border-slate-600 cursor-default opacity-60";
    return base + "bg-slate-700 border-slate-600 cursor-default";
  };

  const nextMultiplier = phase === 'playing' ? calcNextMultiplier() : currentMultiplier;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Current Multiplier</div>
          <div className="text-yellow-400 font-black text-xl">{currentMultiplier.toFixed(2)}x</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Current Win</div>
          <div className="text-green-400 font-black text-xl">{currencySymbol}{fmt(currentWin)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Next Pick</div>
          <div className="text-blue-400 font-black text-xl">{nextMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bet Amount */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Bet Amount ({currentCurrency})</label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600"
                onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) / 2))}>½</Button>
              <Input
                type="number" value={betAmount} min="0.01" step="0.01"
                onChange={e => setBetAmount(e.target.value)}
                disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600 text-white text-center"
              />
              <Button size="sm" variant="outline" disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600"
                onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) * 2))}>2×</Button>
            </div>
          </div>

          {/* Mine Count */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-400 text-sm">Mines</label>
              <span className="text-white font-bold">{mineCount[0]}</span>
            </div>
            <Slider
              value={mineCount} onValueChange={setMineCount}
              min={1} max={24} step={1} disabled={phase === 'playing'}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 mine</span><span>24 mines</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Message */}
      <AnimatePresence>
        {phase === 'cashout' && finalWin !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-green-900/40 border border-green-500 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-green-400 font-black text-2xl">+{currencySymbol}{fmt(finalWin)}</div>
            <div className="text-gray-400 text-sm">{gemsFound} gems found at {currentMultiplier}x</div>
          </motion.div>
        )}
        {phase === 'gameover' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-red-900/40 border border-red-500 rounded-xl p-4 text-center">
            <Bomb className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-red-400 font-black text-2xl">💥 Mine Hit!</div>
            <div className="text-gray-400 text-sm">You found {gemsFound} gem{gemsFound !== 1 ? 's' : ''} before exploding</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-5 gap-2">
          {grid.map((tile, idx) => (
            <motion.button
              key={idx}
              className={getTileStyle(tile, idx)}
              onClick={() => handleTileClick(idx)}
              whileHover={phase === 'playing' && !tile.isRevealed ? { scale: 1.08 } : {}}
              whileTap={phase === 'playing' && !tile.isRevealed ? { scale: 0.92 } : {}}
              disabled={phase !== 'playing' || tile.isRevealed || revealMutation.isPending}
            >
              <AnimatePresence mode="wait">
                {tile.isRevealed ? (
                  <motion.span key="revealed"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}>
                    {tile.isMine
                      ? <Bomb className={`w-6 h-6 ${explodedPos === idx ? 'text-red-300' : 'text-red-400'}`} />
                      : <Gem className="w-6 h-6 text-emerald-300" />
                    }
                  </motion.span>
                ) : (
                  <motion.span key="hidden" className="text-gray-500 text-lg font-bold">?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {phase === 'setup' && (
          <Button className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || !parseFloat(betAmount)}>
            {startMutation.isPending ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Starting...</> : '💣 Start Game'}
          </Button>
        )}

        {phase === 'playing' && (
          <>
            <Button className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg rounded-xl"
              onClick={() => cashoutMutation.mutate()}
              disabled={cashoutMutation.isPending || gemsFound === 0 || revealMutation.isPending}>
              {cashoutMutation.isPending
                ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Cashing out...</>
                : `💰 Cash Out (${currencySymbol}${fmt(currentWin)})`}
            </Button>
            {revealMutation.isPending && (
              <div className="flex items-center justify-center w-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </>
        )}

        {(phase === 'gameover' || phase === 'cashout') && (
          <Button className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl"
            onClick={resetGame}>
            🔄 New Game
          </Button>
        )}
      </div>
    </div>
  );
}
