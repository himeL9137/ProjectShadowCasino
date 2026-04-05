import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bomb, Gem, Trophy } from "lucide-react";
import { useBetAmount } from "@/hooks/use-bet-amount";
import { useGameHistory } from "@/hooks/use-game-history";
import { applyOptimisticDebit, applyServerBalance } from "@/lib/balance";

interface TileState {
  position: number;
  isRevealed: boolean;
  isMine: boolean;
  isGem: boolean;
}

type Phase = 'setup' | 'playing' | 'gameover' | 'cashout';

// Particle explosion component
function Explosion({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    id: i,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full bg-orange-400"
          style={{ left: '50%', top: '50%', transformOrigin: 'center' }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            x: Math.cos((p.angle * Math.PI) / 180) * 30,
            y: Math.sin((p.angle * Math.PI) / 180) * 30,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-lg"
        initial={{ backgroundColor: 'rgba(239,68,68,0)' }}
        animate={{ backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(239,68,68,0)'] }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

// Flip tile component
function FlipTile({
  tile,
  idx,
  phase,
  explodedPos,
  onClick,
  disabled,
}: {
  tile: TileState;
  idx: number;
  phase: Phase;
  explodedPos: number | null;
  onClick: () => void;
  disabled: boolean;
}) {
  const isExploded = explodedPos === idx;
  const canClick = phase === 'playing' && !tile.isRevealed && !disabled;

  return (
    <div
      className="relative w-full aspect-square"
      style={{ perspective: 600 }}
      onClick={canClick ? onClick : undefined}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: tile.isRevealed ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-lg border-2 flex items-center justify-center text-xl font-bold
            ${canClick
              ? 'bg-slate-700 border-slate-500 hover:bg-slate-600 hover:border-blue-400 cursor-pointer hover:scale-105 transition-all'
              : 'bg-slate-700 border-slate-600 cursor-default'
            }
            ${phase === 'gameover' && !tile.isRevealed && !tile.isMine ? 'opacity-50' : ''}
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-gray-400 select-none">?</span>
        </div>

        {/* Back face */}
        <div
          className={`absolute inset-0 rounded-lg border-2 flex items-center justify-center overflow-hidden
            ${tile.isMine
              ? isExploded
                ? 'bg-red-600 border-red-300'
                : 'bg-red-900 border-red-600'
              : 'bg-emerald-800 border-emerald-500'
            }
          `}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {tile.isMine ? (
            <Bomb className={`w-5 h-5 ${isExploded ? 'text-white' : 'text-red-300'}`} />
          ) : (
            <Gem className="w-5 h-5 text-emerald-200" />
          )}
          {isExploded && <Explosion x={0} y={0} />}
        </div>
      </motion.div>

      {/* Pulse ring on exploded tile */}
      {isExploded && (
        <motion.div
          className="absolute inset-0 rounded-lg border-4 border-red-400 pointer-events-none"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
          transition={{ duration: 0.8, repeat: 2 }}
        />
      )}
    </div>
  );
}

export function MinesGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { betAmount, setBetAmount, half, double } = useBetAmount("1.00");
  const { addEntry } = useGameHistory();

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

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/mines/start", {
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        mineCount: mineCount[0]
      });
      return res.json();
    },
    onMutate: () => {
      applyOptimisticDebit(parseFloat(betAmount), currentCurrency);
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
      toast({ title: `💣 Game Started — ${mineCount[0]} mines hidden!` });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

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
        applyServerBalance(data.balance, currentCurrency);
        addEntry({ game: 'Mines', isWin: false, betAmount: parseFloat(betAmount), winAmount: 0, multiplier: 0 });
        toast({ title: "💥 BOOM! Mine hit!", description: "You lost your bet.", variant: "destructive" });
      } else {
        setGemsFound(data.gemsFound);
        setCurrentMultiplier(data.multiplier);
        setCurrentWin(data.currentWin || 0);
      }
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const cashoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/mines/cashout", { sessionId });
      return res.json();
    },
    onSuccess: (data) => {
      setGrid(data.grid);
      setFinalWin(data.winAmount);
      setPhase('cashout');
      applyServerBalance(data.balance, currentCurrency);
      addEntry({ game: 'Mines', isWin: true, betAmount: parseFloat(betAmount), winAmount: data.winAmount, multiplier: data.multiplier });
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

  const nextMultiplier = phase === 'playing' ? calcNextMultiplier() : currentMultiplier;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Multiplier</div>
          <motion.div
            className="text-yellow-400 font-black text-xl"
            key={currentMultiplier}
            initial={{ scale: 1.3, color: '#86efac' }}
            animate={{ scale: 1, color: '#facc15' }}
            transition={{ duration: 0.3 }}
          >
            {currentMultiplier.toFixed(2)}x
          </motion.div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Potential Win</div>
          <motion.div
            className="text-green-400 font-black text-xl"
            key={currentWin}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {currencySymbol}{fmt(currentWin)}
          </motion.div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Next Pick</div>
          <div className="text-blue-400 font-black text-xl">{nextMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Bet Amount ({currentCurrency})</label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600" onClick={half}>½</Button>
              <Input
                type="number" value={betAmount} min="0.01" step="0.01"
                onChange={e => setBetAmount(e.target.value)}
                disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600 text-white text-center"
              />
              <Button size="sm" variant="outline" disabled={phase === 'playing'}
                className="bg-gray-700 border-gray-600" onClick={double}>2×</Button>
            </div>
          </div>

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
              <span>1 mine (safe)</span><span>24 mines (risky)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Banner */}
      <AnimatePresence>
        {phase === 'cashout' && finalWin !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-900/40 border border-green-500 rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-green-400 font-black text-2xl">+{currencySymbol}{fmt(finalWin)}</div>
            <div className="text-gray-400 text-sm">{gemsFound} gems at {currentMultiplier}x</div>
          </motion.div>
        )}
        {phase === 'gameover' && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-900/40 border border-red-500 rounded-xl p-4 text-center">
            <Bomb className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-red-400 font-black text-2xl">💥 Mine Hit!</div>
            <div className="text-gray-400 text-sm">Found {gemsFound} gem{gemsFound !== 1 ? 's' : ''} before exploding</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-5 gap-2">
          {grid.map((tile, idx) => (
            <FlipTile
              key={idx}
              tile={tile}
              idx={idx}
              phase={phase}
              explodedPos={explodedPos}
              onClick={() => handleTileClick(idx)}
              disabled={revealMutation.isPending || cashoutMutation.isPending}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {phase === 'setup' && (
          <Button
            className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || !parseFloat(betAmount)}
          >
            {startMutation.isPending
              ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Starting...</>
              : '💣 Start Game'}
          </Button>
        )}

        {phase === 'playing' && (
          <Button
            className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg rounded-xl disabled:opacity-50"
            onClick={() => cashoutMutation.mutate()}
            disabled={cashoutMutation.isPending || gemsFound === 0 || revealMutation.isPending}
          >
            {cashoutMutation.isPending
              ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Cashing out...</>
              : `💰 Cash Out (${currencySymbol}${fmt(currentWin)})`}
          </Button>
        )}

        {(phase === 'gameover' || phase === 'cashout') && (
          <Button
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl"
            onClick={resetGame}
          >
            🔄 New Game
          </Button>
        )}
      </div>
    </div>
  );
}
