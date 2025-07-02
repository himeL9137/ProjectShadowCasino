
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance: string; // Updated balance from server (required)
  gameData: {
    slotIndex?: number;
    ballPath?: number[];
    [key: string]: any;
  };
}

declare global {
  interface Window {
    p5: any;
  }
}

export function PlinkoMasterGame() {
  const { user, refreshUser } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [activeBalls, setActiveBalls] = useState(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string; multiplier: number }[]>([]);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<string>("Click a slot to see probability");
  const [ballCounter, setBallCounter] = useState(0);

  const MAX_BALLS = 30;

  // Use ref for pendingResults so p5.js can access current values
  const pendingResultsRef = useRef<(GameResult & { ballId: number })[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const gameStateRef = useRef({
    pins: [] as any[],
    balls: [] as any[],
    slots: [] as any[],
    rows: 15,
    balance: 0,
    isGameRunning: false
  });

  const fixedMultipliers = useMemo(() => [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8, 2.0], []);

  const dropMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: GameType.PLINKO_MASTER,
        betAmount: parseFloat(betAmount),
        currency: currentCurrency
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      const currentBallId = ballCounter;
      setBallCounter(prev => prev + 1);
      
      // Update both ref and state
      const newResult = { ...data, ballId: currentBallId };
      pendingResultsRef.current = [...pendingResultsRef.current, newResult];
      
      setActiveBalls(prev => prev + 1);
      if (p5InstanceRef.current) {
        dropBallAnimation(data, currentBallId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
      setActiveBalls(prev => Math.max(0, prev - 1));
    },
  });

  const handleDrop = () => {
    const numericBetAmount = parseFloat(betAmount);
    if (isNaN(numericBetAmount) || numericBetAmount <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to play",
        variant: "destructive",
      });
      return;
    }

    if (activeBalls >= MAX_BALLS) {
      toast({
        title: "Maximum balls reached",
        description: `You can only drop up to ${MAX_BALLS} balls at a time.`,
        variant: "destructive",
      });
      return;
    }

    dropMutation.mutate();
  };

  const dropBallAnimation = (result: GameResult, ballId: number) => {
    if (!p5InstanceRef.current) return;

    const p5 = p5InstanceRef.current;
    const gameState = gameStateRef.current;
    
    const ball = {
      id: ballId,
      x: p5.width / 2 + p5.random(-10, 10), // Add slight randomness to starting position
      y: 50,
      vx: p5.random(-1, 1),
      vy: 0,
      row: 0,
      targetSlot: result.gameData?.slotIndex || Math.floor(Math.random() * 16),
      ballColor: p5.color(p5.random(360), 100, 100),
      hasResult: true, // Mark that this ball has a result waiting
      resultProcessed: false
    };
    
    gameState.balls.push(ball);
  };

  const showGameResult = (result: GameResult) => {
    // Batch state updates to prevent flashing
    setTimeout(() => {
      setLastResult(result);
      
      setHistory(prev => [
        { 
          isWin: result.isWin, 
          amount: result.isWin ? result.winAmount.toFixed(2) : betAmount,
          multiplier: result.multiplier
        },
        ...prev.slice(0, 4)
      ]);
      
      // Show minimal toast notification without overwhelming visual feedback
      if (result.isWin) {
        toast({
          title: "Win!",
          description: `${result.winAmount.toFixed(2)} ${currentCurrency} (${result.multiplier.toFixed(1)}x)`,
          variant: "default",
          duration: 2000, // Shorter duration to reduce visual noise
        });
      }
    }, 50); // Small delay to batch updates and reduce flashing
  };

  const initializeP5 = () => {
    if (!canvasRef.current || p5InstanceRef.current) return;

    const sketch = (p5: any) => {
      const gameState = gameStateRef.current;
      const pinSpacing = 30;
      const slotWidth = 30;
      const ballRadius = 5;
      const pinRadius = 4;
      const gravity = 3.1416 / 30;
      const bounceFactor = -0.7;
      const friction = 0.99;

      p5.setup = () => {
        const canvas = p5.createCanvas(600, 600);
        canvas.parent(canvasRef.current);
        p5.colorMode(p5.HSB, 360, 100, 100);
        
        gameState.pins = [];
        const startY = 100;
        const startX = p5.width / 2;
        
        for (let i = 0; i < gameState.rows; i++) {
          const numPins = i + 1;
          const y = startY + i * pinSpacing;
          for (let j = 0; j < numPins; j++) {
            const x = startX - (numPins - 1) * pinSpacing / 2 + j * pinSpacing;
            gameState.pins.push({ x, y });
          }
        }

        gameState.slots = [];
        const numSlots = gameState.rows + 1;
        const slotY = startY + gameState.rows * pinSpacing;
        
        for (let i = 0; i < numSlots; i++) {
          const multiplier = fixedMultipliers[i] || 0.0;
          const x = startX - (numSlots - 1) * slotWidth / 2 + i * slotWidth;
          const probability = calculateProbability(i, numSlots);
          const color = getSlotColor(p5, multiplier);
          
          gameState.slots.push({ 
            x, 
            y: slotY, 
            multiplier, 
            probability, 
            color, 
            animationOffset: 0, 
            targetOffset: 0 
          });
        }
      };

      p5.draw = () => {
        p5.background(0);

        p5.fill(255);
        for (const pin of gameState.pins) {
          p5.ellipse(pin.x, pin.y, pinRadius * 2, pinRadius * 2);
        }

        for (let i = 0; i < gameState.slots.length; i++) {
          const slot = gameState.slots[i];
          
          slot.animationOffset = p5.lerp(slot.animationOffset, slot.targetOffset, 0.1);
          
          p5.fill(slot.color);
          p5.rect(slot.x - slotWidth / 2, slot.y + slot.animationOffset, slotWidth, 15);
          
          p5.fill(255);
          p5.textAlign(p5.CENTER);
          p5.textSize(10);
          p5.text(slot.multiplier.toFixed(1) + 'x', slot.x, slot.y + 30 + slot.animationOffset);

          if (p5.abs(slot.animationOffset - slot.targetOffset) < 0.1) {
            slot.targetOffset = 0;
          }
        }

        for (let i = gameState.balls.length - 1; i >= 0; i--) {
          const ball = gameState.balls[i];
          ball.vy += gravity;
          ball.vx *= friction;
          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.row < gameState.rows) {
            for (const pin of gameState.pins) {
              const d = p5.dist(ball.x, ball.y, pin.x, pin.y);
              const collisionThreshold = ballRadius + pinRadius;
              if (d < collisionThreshold) {
                const angle = p5.atan2(ball.y - pin.y, ball.x - pin.x);
                const overlap = collisionThreshold - d;
                ball.x += p5.cos(angle) * overlap;
                ball.y += p5.sin(angle) * overlap;
                const currentSpeed = p5.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                const newDirection = angle + p5.PI;
                ball.vx = p5.cos(newDirection) * currentSpeed * bounceFactor;
                ball.vy = p5.sin(newDirection) * currentSpeed * bounceFactor;
                ball.row++;
              }
            }
          }

          const firstSlotX = gameState.slots[0].x - slotWidth / 2;
          const lastSlotX = gameState.slots[gameState.slots.length - 1].x + slotWidth / 2;
          if (ball.x < firstSlotX) {
            ball.x = firstSlotX;
            ball.vx = Math.abs(ball.vx);
          }
          if (ball.x > lastSlotX) {
            ball.x = lastSlotX;
            ball.vx = -Math.abs(ball.vx);
          }

          for (let j = 0; j < gameState.slots.length; j++) {
            const slot = gameState.slots[j];
            if (ball.y > slot.y && p5.abs(ball.x - slot.x) < slotWidth / 2 && !ball.resultProcessed) {
              slot.targetOffset = 5;
              ball.resultProcessed = true; // Mark as processed to avoid duplicate processing
              
              // Use ref to get current pending results
              const pendingResult = pendingResultsRef.current.find(res => res.ballId === ball.id);
              if (pendingResult) {
                showGameResult(pendingResult);
                // Remove from ref
                pendingResultsRef.current = pendingResultsRef.current.filter(res => res.ballId !== ball.id);
                
                // Remove ball after a short delay to show landing effect
                setTimeout(() => {
                  const ballIndex = gameState.balls.findIndex(b => b.id === ball.id);
                  if (ballIndex !== -1) {
                    gameState.balls.splice(ballIndex, 1);
                    setActiveBalls(prev => Math.max(0, prev - 1));
                  }
                }, 500);
              } else {
                // Still remove the ball even without result
                gameState.balls.splice(i, 1);
                setActiveBalls(prev => Math.max(0, prev - 1));
              }
              break;
            }
          }

          if (ball.y > p5.height && !ball.resultProcessed) {
            ball.resultProcessed = true;
            
            // Use ref to get current pending results
            const pendingResult = pendingResultsRef.current.find(res => res.ballId === ball.id);
            if (pendingResult) {
              showGameResult(pendingResult);
              // Remove from ref
              pendingResultsRef.current = pendingResultsRef.current.filter(res => res.ballId !== ball.id);
            }
            
            // Remove ball
            gameState.balls.splice(i, 1);
            setActiveBalls(prev => Math.max(0, prev - 1));
          }

          p5.fill(ball.ballColor);
          p5.ellipse(ball.x, ball.y, ballRadius * 2, ballRadius * 2);
        }
      };

      p5.mousePressed = () => {
        for (const slot of gameState.slots) {
          if (p5.mouseX > slot.x - slotWidth / 2 && p5.mouseX < slot.x + slotWidth / 2 && 
              p5.mouseY > slot.y && p5.mouseY < slot.y + 15) {
            setSelectedSlotInfo(`Slot ${slot.multiplier.toFixed(1)}x: ${slot.probability}%`);
            break;
          }
        }
      };
    };

    if (typeof window !== 'undefined' && !window.p5) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.2/p5.min.js';
      script.onload = () => {
        p5InstanceRef.current = new window.p5(sketch);
      };
      script.onerror = () => {
        console.error("Failed to load p5.js");
        toast({
          title: "Error",
          description: "Failed to load game engine",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
    } else if (window.p5) {
      p5InstanceRef.current = new window.p5(sketch);
    }
  };

  const calculateProbability = (slotIndex: number, numSlots: number): string => {
    const n = gameStateRef.current.rows;
    const k = slotIndex;
    const p = 0.5;
    
    const combinations = (n: number, k: number): number => {
      if (k < 0 || k > n) return 0;
      if (k === 0 || k === n) return 1;
      if (k > n / 2) k = n - k;
      let result = 1;
      for (let i = 1; i <= k; i++) {
        result = result * (n - i + 1) / i;
      }
      return result;
    };
    
    const probability = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    return (probability * 100).toFixed(2);
  };

  const getSlotColor = (p5: any, multiplier: number) => {
    const hue = p5.map(multiplier, 0.4, 2.0, 0, 120);
    const constrainedHue = p5.constrain(hue, 0, 120);
    return p5.color(constrainedHue, 80, 90);
  };

  useEffect(() => {
    initializeP5();
    
    // Add keyboard support for dropping balls
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault(); // Prevent page scroll
        handleDrop();
      }
    };

    // Add event listener for keyboard
    window.addEventListener('keydown', handleKeyPress);
    
    // Disable frequent balance refresh to prevent flashing
    // Balance will be updated after each game result instead
    
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      
      // Clean up keyboard listener
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // Remove dependencies to prevent frequent re-initialization

  const formatBetAmount = (value: number): string => {
    return value.toFixed(2);
  };

  const handleBetAmountChange = (value: string) => {
    // Allow empty string for user to clear input
    if (value === '') {
      setBetAmount('');
      return;
    }
    
    // Only allow valid number format
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setBetAmount(value);
    }
  };

  const adjustBetAmount = (adjustment: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = Math.max(0.01, current + adjustment);
    setBetAmount(formatBetAmount(newAmount));
  };

  const setBetToHalf = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(current / 2));
  };

  const setBetToDouble = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(current * 2));
  };

  const setBetToMax = () => {
    if (user?.balance) {
      setBetAmount(formatBetAmount(parseFloat(user.balance)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-background-light rounded-xl p-6 mb-6">
        <div className="flex justify-center">
          <div ref={canvasRef} className="border border-gray-700 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Bet Controls</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(-0.01)}
                disabled={activeBalls >= MAX_BALLS}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 bet-input-container">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => handleBetAmountChange(e.target.value)}
                  disabled={activeBalls >= MAX_BALLS}
                  className="text-center min-w-0"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  style={{ width: '100%', minWidth: '120px', textAlign: 'center' }}
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(0.01)}
                disabled={activeBalls >= MAX_BALLS}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={setBetToHalf} disabled={activeBalls >= MAX_BALLS}>
                1/2
              </Button>
              <Button variant="outline" size="sm" onClick={setBetToDouble} disabled={activeBalls >= MAX_BALLS}>
                2x
              </Button>
              <Button variant="outline" size="sm" onClick={setBetToMax} disabled={activeBalls >= MAX_BALLS}>
                Max
              </Button>
            </div>

            <Button
              onClick={handleDrop}
              disabled={activeBalls >= MAX_BALLS || dropMutation.isPending}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 text-black font-semibold py-3"
              size="lg"
            >
              {activeBalls > 0 || dropMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  DROPPING... ({activeBalls}/{MAX_BALLS})
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">🏀</span>
                  DROP BALL
                </>
              )}
            </Button>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                Press <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded">SPACE</kbd> to drop a ball
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Game Info</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="font-semibold">
                {currencySymbol}{user?.balance ? parseFloat(user.balance).toFixed(2) : "0.00"}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Bet Amount:</span>
              <span className="font-semibold">
                {currencySymbol}{betAmount}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Active Balls:</span>
              <span className="font-semibold text-blue-400">
                {activeBalls}/{MAX_BALLS}
              </span>
            </div>
            
            {lastResult && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last Multiplier:</span>
                <span className={`font-semibold ${
                  lastResult.multiplier > 1 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastResult.multiplier.toFixed(1)}x
                </span>
              </div>
            )}

            <div className="p-3 bg-background-darker rounded-lg">
              <p className="text-sm text-gray-400">{selectedSlotInfo}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Games</h3>
          
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((game, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    game.isWin ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={game.isWin ? 'text-green-400' : 'text-red-400'}>
                      {game.isWin ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {game.multiplier.toFixed(1)}x
                    </span>
                  </div>
                  <span className="font-semibold">
                    {currencySymbol}{game.amount}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">
                No games played yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
