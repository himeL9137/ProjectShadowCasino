import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Risk = 'low' | 'medium' | 'high';

const ROWS = 8;
const BUCKETS = 9; // ROWS + 1
const BUCKET_MULTIPLIERS: Record<Risk, number[]> = {
  low:    [5.6,  2.1,  1.1,  1.0,  0.5,  1.0,  1.1,  2.1,  5.6],
  medium: [13,   3,    1.3,  0.7,  0.4,  0.7,  1.3,  3,    13 ],
  high:   [29,   4,    1.5,  0.3,  0.2,  0.3,  1.5,  4,    29 ],
};

const BUCKET_COLORS: Record<Risk, string[]> = {
  low: [
    '#f59e0b','#d97706','#b45309','#78716c','#4b5563','#78716c','#b45309','#d97706','#f59e0b'
  ],
  medium: [
    '#ef4444','#f97316','#eab308','#6b7280','#374151','#6b7280','#eab308','#f97316','#ef4444'
  ],
  high: [
    '#7c3aed','#dc2626','#f97316','#374151','#1f2937','#374151','#f97316','#dc2626','#7c3aed'
  ],
};

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: { bucket: number; multiplier: number; };
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  path: boolean[]; // true = right, false = left at each row
  currentRow: number;
  done: boolean;
  bucketIndex: number;
  color: string;
}

export function PlinkoGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState("1.00");
  const [risk, setRisk] = useState<Risk>('medium');
  const [isDropping, setIsDropping] = useState(false);
  const [landedBucket, setLandedBucket] = useState<number | null>(null);
  const [history, setHistory] = useState<{ isWin: boolean; mult: number; amount: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const landedBucketRef = useRef<number | null>(null);

  const W = 400;
  const H = 380;
  const TOP_PAD = 30;
  const BOT_PAD = 50;
  const PIN_R = 5;
  const BALL_R = 8;

  const getPinPositions = () => {
    const pins: { x: number; y: number }[] = [];
    const rowH = (H - TOP_PAD - BOT_PAD) / (ROWS + 1);
    for (let row = 0; row < ROWS; row++) {
      const count = row + 2; // starts at 2 pins
      const startX = W / 2 - ((count - 1) * 40) / 2;
      const y = TOP_PAD + rowH * (row + 1);
      for (let col = 0; col < count; col++) {
        pins.push({ x: startX + col * 40, y });
      }
    }
    return pins;
  };

  const getBucketPositions = () => {
    const buckets: { x: number; y: number; w: number }[] = [];
    const bucketW = W / BUCKETS;
    const y = H - BOT_PAD + 5;
    for (let i = 0; i < BUCKETS; i++) {
      buckets.push({ x: i * bucketW, y, w: bucketW });
    }
    return buckets;
  };

  const generatePath = (targetBucket: number): boolean[] => {
    // Generate a random path that leads to targetBucket
    // With ROWS pegs, bucket = number of "right" moves
    const rights = targetBucket;
    const lefts = ROWS - targetBucket;
    const path: boolean[] = [];
    let r = rights;
    let l = lefts;
    for (let i = 0; i < ROWS; i++) {
      const pRight = r / (r + l);
      if (Math.random() < pRight) {
        path.push(true); r--;
      } else {
        path.push(false); l--;
      }
    }
    return path;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, W, H);

    const pins = getPinPositions();
    const buckets = getBucketPositions();
    const mults = BUCKET_MULTIPLIERS[risk];
    const colors = BUCKET_COLORS[risk];

    // Draw buckets
    buckets.forEach((b, i) => {
      const isLanded = landedBucketRef.current === i;
      ctx.fillStyle = isLanded ? '#fbbf24' : colors[i];
      ctx.globalAlpha = isLanded ? 1 : 0.85;
      ctx.fillRect(b.x + 2, b.y, b.w - 4, BOT_PAD - 10);
      ctx.globalAlpha = 1;

      ctx.fillStyle = isLanded ? '#1f2937' : '#fff';
      ctx.font = `bold ${b.w > 40 ? 11 : 9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${mults[i]}x`, b.x + b.w / 2, b.y + (BOT_PAD - 10) / 2 + 5);
    });

    // Draw pins
    pins.forEach(pin => {
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, PIN_R, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pin.x - 1, pin.y - 1, PIN_R * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
    });

    // Draw balls
    ballsRef.current.forEach(ball => {
      const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, ball.color);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [risk]);

  const animate = useCallback(() => {
    const pins = getPinPositions();
    const rowH = (H - TOP_PAD - BOT_PAD) / (ROWS + 1);
    const buckets = getBucketPositions();

    ballsRef.current.forEach(ball => {
      if (ball.done) return;

      ball.vy += 0.4; // gravity
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.98;

      // Check pin collisions
      for (const pin of pins) {
        const dx = ball.x - pin.x;
        const dy = ball.y - pin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_R + PIN_R) {
          // Move ball out of pin
          const angle = Math.atan2(dy, dx);
          ball.x = pin.x + Math.cos(angle) * (BALL_R + PIN_R + 1);
          ball.y = pin.y + Math.sin(angle) * (BALL_R + PIN_R + 1);
          // Bounce - follow predetermined path
          const rowIdx = Math.round((pin.y - TOP_PAD) / rowH) - 1;
          if (rowIdx >= 0 && rowIdx < ball.path.length && rowIdx >= ball.currentRow) {
            const goRight = ball.path[rowIdx];
            ball.vx = goRight ? 1.5 : -1.5;
            ball.vy = 2;
            ball.currentRow = rowIdx + 1;
          }
        }
      }

      // Check if landed in bucket zone
      if (ball.y >= H - BOT_PAD - BALL_R) {
        ball.y = H - BOT_PAD - BALL_R;
        ball.vy = -ball.vy * 0.2;
        ball.vx *= 0.5;
        if (Math.abs(ball.vy) < 0.5) {
          ball.done = true;
          // Find bucket
          const bIdx = Math.floor(ball.x / (W / BUCKETS));
          const clampedIdx = Math.max(0, Math.min(BUCKETS - 1, bIdx));
          landedBucketRef.current = ball.bucketIndex;
          setLandedBucket(ball.bucketIndex);
        }
      }

      // Wall bounce
      if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    });

    draw();

    if (ballsRef.current.some(b => !b.done)) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      setIsDropping(false);
    }
  }, [draw]);

  useEffect(() => {
    draw();
  }, [risk, landedBucket, draw]);

  const dropMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: "PLINKO",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        risk
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      const targetBucket = data.gameData.bucket;
      const path = generatePath(targetBucket);

      const rowH = (H - TOP_PAD - BOT_PAD) / (ROWS + 1);
      const ball: Ball = {
        x: W / 2 + (Math.random() - 0.5) * 4,
        y: TOP_PAD - BALL_R,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 1,
        radius: BALL_R,
        path,
        currentRow: 0,
        done: false,
        bucketIndex: targetBucket,
        color: data.isWin ? '#10b981' : '#ef4444',
      };
      ballsRef.current = [ball];
      landedBucketRef.current = null;
      setLandedBucket(null);

      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);

      setHistory(prev => [
        { isWin: data.isWin, mult: data.multiplier, amount: data.winAmount },
        ...prev.slice(0, 9)
      ]);

      setTimeout(() => {
        const mult = data.multiplier;
        if (data.isWin) {
          toast({ title: `🎉 ${mult}x — Win!`, description: `+${data.winAmount.toFixed(2)} ${currentCurrency}` });
        } else {
          toast({ title: `${mult}x — Better luck next time`, variant: "destructive" });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      }, 3000);
    },
    onError: (e: any) => {
      setIsDropping(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const handleDrop = () => {
    if (!user) return;
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({ title: "Invalid bet", variant: "destructive" });
      return;
    }
    setIsDropping(true);
    dropMutation.mutate();
  };

  const fmt = (v: number) => v.toFixed(2);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Risk Selector */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-gray-400 text-sm font-bold mb-3">Risk Level</div>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as Risk[]).map(r => (
            <button
              key={r}
              onClick={() => { setRisk(r); setLandedBucket(null); landedBucketRef.current = null; }}
              disabled={isDropping}
              className={`py-2 px-3 rounded-lg font-bold text-sm capitalize transition-all ${
                risk === r
                  ? r === 'low' ? 'bg-green-600 text-white ring-2 ring-green-400'
                  : r === 'medium' ? 'bg-yellow-600 text-white ring-2 ring-yellow-400'
                  : 'bg-red-600 text-white ring-2 ring-red-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {r === 'low' ? '🟢 Low' : r === 'medium' ? '🟡 Medium' : '🔴 High'}
            </button>
          ))}
        </div>
        <div className="text-gray-500 text-xs mt-2 text-center">
          {risk === 'low' ? 'Safe bets, frequent small wins'
            : risk === 'medium' ? 'Balanced risk and reward'
            : 'High risk, big potential payouts'}
        </div>
      </div>

      {/* Canvas Board */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>

      {/* Bet + Drop */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Bet Amount ({currentCurrency})</div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 h-8"
                disabled={isDropping} onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) / 2))}>½</Button>
              <Input
                type="number" value={betAmount} min="0.01" step="0.01"
                onChange={e => setBetAmount(e.target.value)}
                disabled={isDropping}
                className="bg-gray-700 border-gray-600 text-white text-center h-8"
              />
              <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 h-8"
                disabled={isDropping} onClick={() => setBetAmount(fmt((parseFloat(betAmount) || 0) * 2))}>2×</Button>
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Multipliers ({risk})</div>
            <div className="text-gray-300 text-xs font-mono">
              {BUCKET_MULTIPLIERS[risk].join(' · ')}
            </div>
          </div>
        </div>

        <Button
          className="w-full py-3 font-black text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl"
          onClick={handleDrop}
          disabled={isDropping || dropMutation.isPending}
        >
          {isDropping ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Ball dropping...</> : '🪂 Drop Ball'}
        </Button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-gray-400 text-xs font-bold mb-2">RECENT DROPS</div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div key={i} className={`px-2 py-1 rounded text-xs font-bold border ${
                h.isWin ? 'bg-green-900/40 text-green-400 border-green-700' : 'bg-red-900/30 text-red-400 border-red-800'
              }`}>
                {h.mult}x {h.isWin ? `+${h.amount.toFixed(2)}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
