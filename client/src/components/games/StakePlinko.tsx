import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/hooks/use-currency';
import { PlinkoMasterService } from '@/lib/services/plinkoMasterService';
import { Minus, Plus, Play, Settings } from 'lucide-react';
import Matter from 'matter-js';

interface PlinkoSettings {
  rows: number;
  risk: 'low' | 'medium' | 'high';
}

interface Ball {
  id: number;
  body: Matter.Body;
  targetSlot: number;
  multiplier: number;
  isComplete: boolean;
}

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance: string;
  gameData: {
    slotIndex: number;
    ballPath: number[];
  };
}

export function StakePlinko() {
  const { user, refreshUser } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();

  // Game state
  const [betAmount, setBetAmount] = useState('1.00');
  const [settings, setSettings] = useState<PlinkoSettings>({ rows: 16, risk: 'medium' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBalls, setActiveBalls] = useState<Ball[]>([]);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [ballCounter, setBallCounter] = useState(0);

  // Physics refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const pinsRef = useRef<Matter.Body[]>([]);
  const wallsRef = useRef<Matter.Body[]>([]);
  const slotsRef = useRef<Matter.Body[]>([]);
  const animationRef = useRef<number | null>(null);

  // Exact 16-slot multiplier system as specified
  const getMultipliers = useCallback(() => {
    // Fixed 16-slot system: [2.0x, 1.8x, 1.6x, 1.4x, 1.0x, 0.8x, 0.6x, 0.4x, 0.4x, 0.6x, 0.8x, 1.0x, 1.4x, 1.6x, 1.8x, 2.0x]
    return [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8, 2.0];
  }, []);

  // Probability weights (higher = more likely to land) - 16 slots
  const getSlotWeights = useCallback(() => {
    // Heavily biased toward losing slots (0.4x, 0.6x, 0.8x)
    return [1, 2, 3, 4, 6, 7, 8, 9, 9, 8, 7, 6, 4, 3, 2, 1];
  }, []);

  // Weighted random slot selection
  const getWeightedRandomSlot = useCallback((weights: number[]): number => {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return i;
      }
      random -= weights[i];
    }
    return weights.length - 1;
  }, []);

  // Guaranteed correct payout calculation
  const calculatePayout = useCallback((betAmount: number, slotIndex: number) => {
    const multiplierBar = getMultipliers();
    
    // Validate inputs
    if (slotIndex < 0 || slotIndex >= multiplierBar.length) {
      throw new Error(`Invalid slot index: ${slotIndex}. Must be 0-${multiplierBar.length - 1}`);
    }
    
    const multiplier = multiplierBar[slotIndex];
    const payout = betAmount * multiplier;
    const roundedPayout = parseFloat(payout.toFixed(2));
    const profit = parseFloat((roundedPayout - betAmount).toFixed(2));
    
    return {
      multiplier,
      payout: roundedPayout,
      profit,
      slotIndex
    };
  }, [getMultipliers]);

  // Initialize physics engine
  const initializePhysics = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.width = 800;
    const height = canvas.height = 600;

    // Create engine
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0.8;
    engine.world.gravity.scale = 0.001;
    engineRef.current = engine;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        showVelocity: false,
        showAngleIndicator: false,
        showDebug: false
      }
    });
    renderRef.current = render;

    // Clear existing bodies
    Matter.World.clear(engine.world, false);
    pinsRef.current = [];
    wallsRef.current = [];
    slotsRef.current = [];

    // Create walls
    const wallThickness = 10;
    const leftWall = Matter.Bodies.rectangle(-wallThickness/2, height/2, wallThickness, height, {
      isStatic: true,
      render: { fillStyle: '#4f46e5' }
    });
    const rightWall = Matter.Bodies.rectangle(width + wallThickness/2, height/2, wallThickness, height, {
      isStatic: true,
      render: { fillStyle: '#4f46e5' }
    });
    const bottomWall = Matter.Bodies.rectangle(width/2, height + wallThickness/2, width, wallThickness, {
      isStatic: true,
      render: { fillStyle: '#4f46e5' }
    });

    wallsRef.current = [leftWall, rightWall, bottomWall];
    Matter.World.add(engine.world, wallsRef.current);

    // Create pins in proper Plinko pattern (16 rows for 16 slots)
    const pinRows = 16;
    const pinSpacing = Math.min(40, width / (pinRows + 2));
    const startY = 120;
    const pins: Matter.Body[] = [];

    for (let row = 0; row < pinRows; row++) {
      const pinsInRow = row + 3;
      const rowWidth = (pinsInRow - 1) * pinSpacing;
      const startX = (width - rowWidth) / 2;
      const y = startY + row * (pinSpacing * 0.75);

      for (let col = 0; col < pinsInRow; col++) {
        const x = startX + col * pinSpacing;
        
        const pin = Matter.Bodies.circle(x, y, 4, {
          isStatic: true,
          render: {
            fillStyle: '#fbbf24',
            strokeStyle: '#f59e0b',
            lineWidth: 2
          },
          restitution: 0.7,
          friction: 0.01,
          frictionStatic: 0.01
        });
        
        pins.push(pin);
      }
    }

    pinsRef.current = pins;
    Matter.World.add(engine.world, pins);

    // Create collection slots
    const multipliers = getMultipliers();
    const slotWidth = 45;
    const slotsY = height - 60;
    const totalSlotsWidth = multipliers.length * slotWidth;
    const slotsStartX = (width - totalSlotsWidth) / 2;

    const slots: Matter.Body[] = [];
    multipliers.forEach((multiplier, index) => {
      const x = slotsStartX + index * slotWidth + slotWidth / 2;
      
      // Create invisible sensor for collision detection
      const slot = Matter.Bodies.rectangle(x, slotsY, slotWidth - 2, 40, {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: getSlotColor(multiplier),
          strokeStyle: '#374151',
          lineWidth: 1
        },
        label: `slot_${index}_${multiplier}`
      });
      
      slots.push(slot);
    });

    slotsRef.current = slots;
    Matter.World.add(engine.world, slots);

    // Start physics engine
    Matter.Engine.run(engine);
    Matter.Render.run(render);

    // Add collision detection
    Matter.Events.on(engine, 'collisionStart', handleCollision);

  }, [settings.rows, settings.risk, getMultipliers]);

  // Get slot color based on multiplier
  const getSlotColor = (multiplier: number): string => {
    if (multiplier >= 100) return '#dc2626'; // Red for very high
    if (multiplier >= 10) return '#ea580c'; // Orange for high
    if (multiplier >= 2) return '#ca8a04'; // Yellow for medium-high
    if (multiplier >= 1) return '#16a34a'; // Green for positive
    return '#6b7280'; // Gray for low
  };

  // Handle ball collision with slots
  const handleCollision = useCallback((event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      
      // Check if collision is between ball and slot
      const ball = bodyA.label.startsWith('ball_') ? bodyA : 
                   bodyB.label.startsWith('ball_') ? bodyB : null;
      const slot = bodyA.label.startsWith('slot_') ? bodyA :
                   bodyB.label.startsWith('slot_') ? bodyB : null;

      if (ball && slot) {
        const ballId = parseInt(ball.label.split('_')[1]);
        const [, slotIndex, multiplier] = slot.label.split('_');
        
        // Process ball completion
        processBallResult(ballId, parseInt(slotIndex), parseFloat(multiplier));
        
        // Remove ball from world
        setTimeout(() => {
          if (engineRef.current) {
            Matter.World.remove(engineRef.current.world, ball);
          }
        }, 100);
      }
    });
  }, []);

  // Process ball result with guaranteed correct calculation
  const processBallResult = async (ballId: number, slotIndex: number) => {
    try {
      // Find the ball to get its result data
      const ball = activeBalls.find(b => b.id === ballId);
      if (!ball) return;

      const betValue = parseFloat(betAmount);
      
      // Use guaranteed correct payout calculation
      const payoutResult = calculatePayout(betValue, slotIndex);
      const { multiplier, payout, profit } = payoutResult;
      
      const isWin = payout > betValue;

      // Create game result with exact calculations
      const result: GameResult = {
        isWin,
        winAmount: payout,
        multiplier,
        balance: user?.balance?.toString() || '0',
        gameData: {
          slotIndex,
          ballPath: [],
          payout,
          profit,
          betAmount: betValue
        }
      };

      // Add to history
      setHistory(prev => [result, ...prev.slice(0, 19)]); // Keep last 20 results
      
      // Update profit tracking with exact calculation
      setTotalProfit(prev => prev + profit);

      // Remove ball from active balls
      setActiveBalls(prev => prev.filter(b => b.id !== ballId));

      // Show toast notification with exact payout amounts
      if (profit > 0) {
        toast({
          title: `WIN`,
          description: `${multiplier}x\n${currencySymbol}${payout.toFixed(2)}`,
          className: "bg-green-600 text-white",
        });
      } else if (profit === 0) {
        toast({
          title: `BREAK EVEN`,
          description: `${multiplier}x\n${currencySymbol}${payout.toFixed(2)}`,
          className: "bg-yellow-600 text-white",
        });
      } else {
        toast({
          title: `LOSS`,
          description: `${multiplier}x\n${currencySymbol}${payout.toFixed(2)}`,
          variant: "destructive",
        });
      }

      // Refresh user balance
      if (refreshUser) {
        await refreshUser();
      }

    } catch (error) {
      console.error('Error processing ball result:', error);
    }
  };

  // Drop a ball
  const dropBall = useCallback(async () => {
    if (!engineRef.current || !canvasRef.current || isPlaying) return;

    const betValue = parseFloat(betAmount);
    if (!user || parseFloat(user.balance || '0') < betValue) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to place this bet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPlaying(true);
      const ballId = ballCounter + 1;
      setBallCounter(ballId);

      // Use client-side biased random selection instead of server
      const multipliers = getMultipliers();
      const weights = getSlotWeights();
      const targetSlot = getWeightedRandomSlot(weights);
      const multiplier = multipliers[targetSlot];

      // Make API call with predetermined result
      const gameResult = await PlinkoMasterService.playGame({
        gameType: "PLINKO_MASTER",
        betAmount: betValue,
        currency: currentCurrency,
        numBalls: 1
      });

      // Create ball at random drop position
      const canvas = canvasRef.current;
      const dropWidth = 100;
      const dropX = (canvas.width - dropWidth) / 2 + Math.random() * dropWidth;
      
      const ball = Matter.Bodies.circle(dropX, 50, 8, {
        restitution: 0.6,
        friction: 0.001,
        frictionAir: 0.005,
        density: 0.8,
        render: {
          fillStyle: '#ffffff',
          strokeStyle: '#3b82f6',
          lineWidth: 3
        },
        label: `ball_${ballId}`
      });

      // Add ball to world
      Matter.World.add(engineRef.current.world, ball);

      // Track active ball with biased result
      const newBall: Ball = {
        id: ballId,
        body: ball,
        targetSlot: targetSlot,
        multiplier: multiplier,
        isComplete: false
      };

      setActiveBalls(prev => [...prev, newBall]);

      // Auto-remove ball after timeout (safety measure)
      setTimeout(() => {
        if (engineRef.current) {
          Matter.World.remove(engineRef.current.world, ball);
          setActiveBalls(prev => prev.filter(b => b.id !== ballId));
        }
      }, 10000);

    } catch (error) {
      console.error('Error dropping ball:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to drop ball",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, ballCounter, betAmount, currentCurrency, user, toast]);

  // Drop multiple balls function
  const dropMultipleBalls = useCallback(async (count: number) => {
    if (!engineRef.current || !canvasRef.current || isPlaying) return;

    const betValue = parseFloat(betAmount);
    if (!user || parseFloat(user.balance || '0') < betValue * count) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${currencySymbol}${(betValue * count).toFixed(2)} to drop ${count} balls.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPlaying(true);
      const multipliers = getMultipliers();
      const weights = getSlotWeights();

      for (let i = 0; i < count; i++) {
        setTimeout(async () => {
          const ballId = ballCounter + i + 1;
          const targetSlot = getWeightedRandomSlot(weights);
          const multiplier = multipliers[targetSlot];

          // Create ball
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const dropWidth = 100;
          const dropX = (canvas.width - dropWidth) / 2 + Math.random() * dropWidth;
          
          const ball = Matter.Bodies.circle(dropX, 50, 8, {
            restitution: 0.6,
            friction: 0.001,
            frictionAir: 0.005,
            density: 0.8,
            render: {
              fillStyle: '#ffffff',
              strokeStyle: '#3b82f6',
              lineWidth: 3
            },
            label: `ball_${ballId}`
          });

          if (engineRef.current) {
            Matter.World.add(engineRef.current.world, ball);
          }

          // Track ball
          const newBall: Ball = {
            id: ballId,
            body: ball,
            targetSlot: targetSlot,
            multiplier: multiplier,
            isComplete: false
          };

          setActiveBalls(prev => [...prev, newBall]);
        }, i * 200); // Stagger ball drops
      }

      setBallCounter(prev => prev + count);
    } catch (error) {
      console.error('Error dropping multiple balls:', error);
      toast({
        title: "Error",
        description: "Failed to drop balls",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, ballCounter, betAmount, currentCurrency, user, toast, getMultipliers, getSlotWeights, getWeightedRandomSlot, currencySymbol]);

  // Initialize physics on mount and settings change
  useEffect(() => {
    initializePhysics();
    
    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, [initializePhysics]);

  // Bet amount controls
  const adjustBetAmount = (multiplier: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = Math.max(0.01, current * multiplier);
    setBetAmount(newAmount.toFixed(2));
  };

  const setBetToValue = (value: number) => {
    setBetAmount(value.toFixed(2));
  };

  const multipliers = getMultipliers();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plinko</h1>
          <p className="text-muted-foreground">Drop balls and watch them bounce to win!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Balance</div>
          <div className="text-2xl font-bold">
            {currencySymbol}{parseFloat(user?.balance || '0').toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="relative bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-w-full"
                  style={{ aspectRatio: '4/3' }}
                />
                
                {/* Multiplier display */}
                <div className="absolute bottom-0 left-0 right-0 flex">
                  {multipliers.map((multiplier, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center py-2 text-xs font-bold text-white border-l border-gray-600 first:border-l-0"
                      style={{ backgroundColor: getSlotColor(multiplier) + '80' }}
                    >
                      {multiplier}x
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Bet Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bet Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBetAmount(0.5)}
                  disabled={isPlaying}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="text-center"
                  min="0.01"
                  step="0.01"
                  disabled={isPlaying}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBetAmount(2)}
                  disabled={isPlaying}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[0.10, 1.00, 10.00, 100.00].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBetToValue(amount)}
                    disabled={isPlaying}
                  >
                    {currencySymbol}{amount.toFixed(2)}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={dropBall}
                  disabled={isPlaying || !user || parseFloat(user.balance || '0') < parseFloat(betAmount)}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isPlaying ? 'Dropping...' : 'Drop 1 Ball'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => dropMultipleBalls(5)}
                    disabled={isPlaying || !user || parseFloat(user.balance || '0') < parseFloat(betAmount) * 5}
                    variant="outline"
                    size="sm"
                  >
                    Drop 5 Balls
                  </Button>
                  <Button
                    onClick={() => dropMultipleBalls(10)}
                    disabled={isPlaying || !user || parseFloat(user.balance || '0') < parseFloat(betAmount) * 10}
                    variant="outline"
                    size="sm"
                  >
                    Drop 10 Balls
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rows</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[8, 12, 16].map((rows) => (
                    <Button
                      key={rows}
                      variant={settings.rows === rows ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, rows }))}
                      disabled={isPlaying}
                    >
                      {rows}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Risk</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map((risk) => (
                    <Button
                      key={risk}
                      variant={settings.risk === risk ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, risk }))}
                      disabled={isPlaying}
                    >
                      {risk.charAt(0).toUpperCase() + risk.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Profit</span>
                <span className={`font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalProfit >= 0 ? '+' : ''}{currencySymbol}{totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Games Played</span>
                <span className="font-bold">{history.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Balls</span>
                <span className="font-bold">{activeBalls.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Results */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.slice(0, 10).map((result, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={result.winAmount > (result.gameData?.betAmount || parseFloat(betAmount)) ? "default" : "secondary"}
                          className={result.winAmount > (result.gameData?.betAmount || parseFloat(betAmount)) ? "bg-green-500" : result.winAmount === (result.gameData?.betAmount || parseFloat(betAmount)) ? "bg-yellow-500" : "bg-red-500"}
                        >
                          {result.winAmount > (result.gameData?.betAmount || parseFloat(betAmount)) ? "WIN" : result.winAmount === (result.gameData?.betAmount || parseFloat(betAmount)) ? "EVEN" : "LOSS"}
                        </Badge>
                        <span className="text-muted-foreground">{result.multiplier}x</span>
                      </div>
                      <span className="font-mono">
                        {currencySymbol}{result.winAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}