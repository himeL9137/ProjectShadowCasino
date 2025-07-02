import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useTranslation } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Matter from "matter-js";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    bucket?: number;
    [key: string]: any;
  };
}

// Destructure Matter.js modules
const { Engine, Render, World, Bodies, Runner, Events, Composite } = Matter;

export function PlinkoGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [betAmount, setBetAmount] = useState("0.001");
  const [isDropping, setIsDropping] = useState(false);
  const [landedBucket, setLandedBucket] = useState<number | null>(null);
  const [history, setHistory] = useState<{ isWin: boolean; amount: string }[]>([]);
  
  // State to hold the Matter.js engine and world
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Configuration for the Plinko board
  const boardConfig = {
    rows: 12,
    pinSize: 3,
    ballSize: 6,
    bucketCount: 16, // Updated to match your 16-slot system
    bucketHeight: 30,
    boardHeight: 400,
    boardWidth: 500,
    pinGapX: 28,
    pinGapY: 32,
    friction: 0.0001,
    restitution: 0.8,
    pinFriction: 0,
    pinRestitution: 1,
  };

  // Comprehensive payout multipliers matching your specification
  const bucketMultipliers = [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8, 2.0];
  
  // Payout calculation function
  const calculatePayout = (betAmount: number, multiplier: number) => {
    return parseFloat((betAmount * multiplier).toFixed(2));
  };
  
  // Get example payouts for display
  const getExamplePayouts = () => {
    const exampleBets = [1, 2, 5];
    return bucketMultipliers.map(multiplier => ({
      multiplier,
      payouts: exampleBets.map(bet => calculatePayout(bet, multiplier))
    }));
  };

  const dropMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: GameType.PLINKO,
        betAmount: parseFloat(betAmount),
        currency: currentCurrency
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      // Update the landed bucket based on game result
      if (data.gameData && 'bucket' in data.gameData) {
        setLandedBucket(data.gameData.bucket as number);
      }
      
      // Add to history
      setHistory(prev => [
        { 
          isWin: data.isWin, 
          amount: data.isWin ? data.winAmount.toString() : betAmount 
        },
        ...prev.slice(0, 3)
      ]);
      
      // Show toast
      if (data.isWin) {
        toast({
          title: "You won!",
          description: `You won ${data.winAmount} ${currentCurrency}`,
          variant: "default",
        });
      } else {
        toast({
          title: "You lost",
          description: `You lost ${betAmount} ${currentCurrency}`,
          variant: "destructive",
        });
      }
      
      // Add the ball to the physics world for visual effect
      addBallToWorld(data.gameData && 'bucket' in data.gameData ? data.gameData.bucket as number : Math.floor(Math.random() * 17));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
      setIsDropping(false);
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

    setIsDropping(true);
    setLandedBucket(null);
    dropMutation.mutate();
  };

  // Function to add the ball to the Matter.js world with target bucket
  const addBallToWorld = (targetBucket?: number) => {
    if (!worldRef.current || !engineRef.current) {
      return;
    }

    // Remove any existing balls
    const existingBalls = Composite.allBodies(worldRef.current).filter(
      (body) => body.label === "ball",
    );
    existingBalls.forEach((ball) => World.remove(worldRef.current!, ball));

    // Calculate initial ball position
    const startX = boardConfig.boardWidth / 2;
    const startY = boardConfig.ballSize;

    // Create the ball body
    const ball = Bodies.circle(startX, startY, boardConfig.ballSize, {
      label: "ball",
      restitution: boardConfig.restitution,
      friction: boardConfig.friction,
      frictionAir: 0.01,
      density: 0.1,
      render: {
        fillStyle: "#f59e0b",
        strokeStyle: "#d97706",
        lineWidth: 1,
      },
    });

    // Add the ball to the world
    World.add(worldRef.current, ball);

    // Turn on gravity to let the ball fall
    engineRef.current.gravity.y = 1;

    // If we have a target bucket, simulate the result after animation
    if (typeof targetBucket === 'number') {
      setTimeout(() => {
        setLandedBucket(targetBucket);
        setIsDropping(false);
        // Remove ball after landing
        setTimeout(() => {
          if (worldRef.current) {
            World.remove(worldRef.current, ball);
          }
          if (engineRef.current) {
            engineRef.current.gravity.y = 0;
          }
        }, 1000);
      }, 2000); // 2 second animation
    }
  };

  // Setup Matter.js engine and world on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    try {
      // Create a Matter.js engine
      const engine = Engine.create();
      const world = engine.world;
      engineRef.current = engine;
      worldRef.current = world;

      // Disable gravity initially
      engine.gravity.y = 0;

      // Create a renderer
      const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
          width: boardConfig.boardWidth,
          height: boardConfig.boardHeight + boardConfig.bucketHeight,
          wireframes: false,
          background: "transparent",
        },
      });
      renderRef.current = render;

      // Run the renderer
      Render.run(render);

      // Create a runner
      const runner = Runner.create();
      runnerRef.current = runner;
      Runner.run(runner, engine);

      // Create the board boundaries (walls)
      const wallThickness = 20;
      const walls = [
        Bodies.rectangle(
          boardConfig.boardWidth / 2,
          boardConfig.boardHeight + wallThickness / 2,
          boardConfig.boardWidth,
          wallThickness,
          { isStatic: true, render: { visible: false }, label: "bottom-wall" },
        ),
        Bodies.rectangle(
          -wallThickness / 2,
          (boardConfig.boardHeight + boardConfig.bucketHeight) / 2,
          wallThickness,
          boardConfig.boardHeight + boardConfig.bucketHeight,
          { isStatic: true, render: { fillStyle: "#374151" } },
        ),
        Bodies.rectangle(
          boardConfig.boardWidth + wallThickness / 2,
          (boardConfig.boardHeight + boardConfig.bucketHeight) / 2,
          wallThickness,
          boardConfig.boardHeight + boardConfig.bucketHeight,
          { isStatic: true, render: { fillStyle: "#374151" } },
        ),
      ];
      World.add(world, walls);

      // Create the pins
      const pins = [];
      const startY = boardConfig.pinGapY;
      for (let row = 0; row < boardConfig.rows; row++) {
        const numPins = row + 3;
        const rowWidth = (numPins - 1) * boardConfig.pinGapX;
        const startX = (boardConfig.boardWidth - rowWidth) / 2;
        const y = startY + row * boardConfig.pinGapY;

        for (let col = 0; col < numPins; col++) {
          const x = startX + col * boardConfig.pinGapX;
          const pin = Bodies.circle(x, y, boardConfig.pinSize, {
            isStatic: true,
            render: {
              fillStyle: "#f9fafb",
            },
            friction: boardConfig.pinFriction,
            restitution: boardConfig.pinRestitution,
            label: "pin",
          });
          pins.push(pin);
        }
      }
      World.add(world, pins);

      // Create the buckets
      const buckets = [];
      const bucketWidth = boardConfig.boardWidth / boardConfig.bucketCount;
      const bucketY = boardConfig.boardHeight + boardConfig.bucketHeight / 2;
      const dividerThickness = 2;

      for (let i = 0; i < boardConfig.bucketCount; i++) {
        const bucketX = i * bucketWidth + bucketWidth / 2;
        const bucketBody = Bodies.rectangle(
          bucketX,
          bucketY,
          bucketWidth,
          boardConfig.bucketHeight,
          {
            isStatic: true,
            render: { visible: false },
            label: `bucket-${i}`,
          },
        );
        buckets.push(bucketBody);

        if (i < boardConfig.bucketCount - 1) {
          const dividerX = (i + 1) * bucketWidth;
          const divider = Bodies.rectangle(
            dividerX,
            bucketY,
            dividerThickness,
            boardConfig.bucketHeight,
            {
              isStatic: true,
              render: { fillStyle: "#4b5563" },
              label: "divider",
            },
          );
          World.add(world, divider);
        }
      }
      World.add(world, buckets);

    } catch (error) {
      console.error("Failed to initialize Matter.js:", error);
    }

    // Cleanup function
    return () => {
      if (runnerRef.current && engineRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (renderRef.current) {
        Render.stop(renderRef.current);
      }
      if (engineRef.current) {
        Engine.clear(engineRef.current);
      }
    };
  }, []);

  const adjustBetAmount = (adjustment: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = Math.max(0.001, current + adjustment);
    setBetAmount(newAmount.toString());
  };

  const setBetToHalf = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current / 2).toString());
  };

  const setBetToDouble = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current * 2).toString());
  };

  const setBetToMax = () => {
    if (user?.balance) {
      setBetAmount(user.balance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Plinko Board */}
      <div className="bg-background-light rounded-xl p-6 mb-6">
        <div className="relative mx-auto" style={{ width: boardConfig.boardWidth }}>
          {/* Canvas for Matter.js */}
          <canvas
            ref={canvasRef}
            className="border border-gray-700 rounded-lg bg-gradient-to-b from-background-darker to-background"
            style={{
              width: boardConfig.boardWidth,
              height: boardConfig.boardHeight + boardConfig.bucketHeight,
            }}
          />
          
          {/* Bucket multipliers overlay */}
          <div className="absolute bottom-0 left-0 right-0 flex">
            {bucketMultipliers.map((multiplier, index) => (
              <div
                key={index}
                className={`flex-1 text-center py-2 text-xs font-semibold border-r border-gray-700 last:border-r-0 ${
                  landedBucket === index ? 'bg-accent-gold text-black animate-pulse' : ''
                }`}
              >
                {multiplier}x
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comprehensive Payout Logic Display */}
      <div className="bg-background-light rounded-xl p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-center">Plinko Payout Logic</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payout Formula */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-accent-gold">How Payouts Work</h4>
            <div className="bg-background-darker rounded-lg p-4">
              <div className="text-center text-xl font-mono mb-4">
                <span className="text-green-400">Payout</span> = 
                <span className="text-blue-400"> Bet Amount</span> × 
                <span className="text-yellow-400"> Multiplier</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Examples:</div>
                  <div>₳1 × 2.0x = ₳2.00</div>
                  <div>₳2 × 1.8x = ₳3.60</div>
                  <div>₳5 × 0.4x = ₳2.00</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-semibold">Win Types:</div>
                  <div className="text-green-400">≥1.0x = WIN</div>
                  <div className="text-yellow-400">=1.0x = BREAK EVEN</div>
                  <div className="text-red-400">&lt;1.0x = LOSS</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold">Probability:</div>
                  <div>Higher multipliers</div>
                  <div>are much rarer</div>
                  <div>to achieve</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Complete Multiplier Grid */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-accent-gold">All Multipliers</h4>
            <div className="grid grid-cols-4 gap-2">
              {bucketMultipliers.map((multiplier, index) => (
                <div
                  key={index}
                  className={`text-center p-3 rounded-lg border transition-all duration-200 ${
                    landedBucket === index 
                      ? 'bg-accent-gold text-black border-accent-gold animate-pulse' 
                      : multiplier >= 2.0 
                        ? 'bg-red-600/20 border-red-500 text-red-400' 
                        : multiplier >= 1.4 
                          ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                          : multiplier >= 1.0 
                            ? 'bg-green-600/20 border-green-500 text-green-400' 
                            : 'bg-gray-600/20 border-gray-500 text-gray-400'
                  }`}
                >
                  <div className="font-bold text-lg">{multiplier.toFixed(1)}x</div>
                  <div className="text-xs opacity-75">Slot {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Detailed Explanation */}
        <div className="mt-6 p-4 bg-background-darker rounded-lg">
          <h5 className="font-medium mb-2 text-accent-gold">Game Rules:</h5>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Set your bet amount using the controls above</li>
            <li>Click "DROP BALL" to release the ball through the pins</li>
            <li>The ball will randomly bounce and land in one of 16 slots</li>
            <li>Your payout is calculated as: Bet Amount × Slot Multiplier</li>
            <li>Multipliers range from 0.4x (loss) to 2.0x (big win)</li>
            <li>Edge slots (2.0x) are rarest, center slots are most common</li>
            <li>You win when the multiplier is 1.0x or higher</li>
          </ul>
        </div>
      </div>

      {/* Game Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bet Controls */}
        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Bet Amount</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(-0.001)}
                disabled={isDropping}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={isDropping}
                  className="text-center"
                  step="0.001"
                  min="0.001"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(0.001)}
                disabled={isDropping}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={setBetToHalf} disabled={isDropping}>
                1/2
              </Button>
              <Button variant="outline" size="sm" onClick={setBetToDouble} disabled={isDropping}>
                2x
              </Button>
              <Button variant="outline" size="sm" onClick={setBetToMax} disabled={isDropping}>
                Max
              </Button>
            </div>

            <Button
              onClick={handleDrop}
              disabled={isDropping || dropMutation.isPending}
              className="w-full bg-accent-gold hover:bg-accent-gold/90 text-black font-semibold py-3"
              size="lg"
            >
              {isDropping || dropMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  DROPPING...
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">🟡</span>
                  DROP BALL
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Game Info</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="font-semibold">
                {currencySymbol}{user?.balance || "0.00"}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Bet Amount:</span>
              <span className="font-semibold">
                {currencySymbol}{betAmount}
              </span>
            </div>
            
            {landedBucket !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last Multiplier:</span>
                <span className={`font-semibold ${
                  bucketMultipliers[landedBucket] > 1 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {bucketMultipliers[landedBucket]}x
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payout Table */}
        <div className="bg-background-light rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Payout Table</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 mb-2">
              <span>Multiplier</span>
              <span>Bet 1</span>
              <span>Bet 2</span>
              <span>Bet 5</span>
            </div>
            {getExamplePayouts().map((item, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-4 gap-2 text-xs p-2 rounded ${
                  landedBucket === index ? 'bg-accent-gold/20 border border-accent-gold' :
                  item.multiplier >= 2.0 ? 'bg-red-500/10' :
                  item.multiplier >= 1.0 ? 'bg-green-500/10' :
                  'bg-gray-500/10'
                }`}
              >
                <span className={`font-semibold ${
                  item.multiplier >= 2.0 ? 'text-red-400' :
                  item.multiplier >= 1.0 ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {item.multiplier.toFixed(1)}x
                </span>
                <span>{item.payouts[0]}</span>
                <span>{item.payouts[1]}</span>
                <span>{item.payouts[2]}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>• Payout = Bet Amount × Multiplier</p>
            <p>• Higher multipliers are rarer</p>
            <p>• Break-even at 1.0x multiplier</p>
          </div>
        </div>
      </div>
    </div>
  );
}