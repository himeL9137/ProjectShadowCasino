import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const MAX_BALLS = 5;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  ballId: number;
  seed: string;
  ballColor?: any;
  predeterminedSlot: number;
}

interface Pin {
  x: number;
  y: number;
}

interface Slot {
  x: number;
  y: number;
  multiplier: number;
  probability: string;
  color: any;
  animationOffset: number;
  targetOffset: number;
}

export default function AdvancedPlinkoGame() {
  const [betAmount, setBetAmount] = useState('1.00');
  const [activeBalls, setActiveBalls] = useState(0);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<string | null>(null);
  const [gameBalance, setGameBalance] = useState(100);
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const gameStateRef = useRef({
    pins: [] as Pin[],
    slots: [] as Slot[],
    balls: [] as Ball[],
    clientSeed: '',
    serverSeed: '',
    nonce: 0,
    landingSynth: null as any,
    pinHitSynth: null as any,
    betClickSynth: null as any,
    winSound: null as any,
    lossSound: null as any,
    boardLeft: 0,
    boardRight: 0
  });

  // Game constants from the provided code
  const rows = 15;
  const fixedMultipliers = [2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4, 0.4, 0.4, 0.6, 0.8, 1.0, 1.4, 1.6, 1.8, 2.0];
  const pinSpacingBase = 30;
  const slotWidthBase = 30;
  const ballRadiusBase = 5;
  const pinRadiusBase = 4;
  const gravity = 0.5;
  const bounceFactor = -0.7;
  const friction = 0.98;
  const animationSpeed = 0.1;

  // Rigging logic indices
  const winningSlotIndices = [0, 1, 2, 3, 13, 14, 15, 16];
  const losingSlotIndices = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const riggedLosingSlotIndices = [5, 6, 7, 8, 9, 10];

  const generateSeed = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const generateHash = (clientSeed: string, serverSeed: string, nonce: number) => {
    return btoa(clientSeed + serverSeed + nonce).slice(0, 16);
  };

  const calculateProbability = (slotIndex: number, numSlots: number) => {
    const n = rows;
    const k = slotIndex;
    const p = 0.5;

    const combinations = (n: number, k: number) => {
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

  const loadExternalLibraries = async () => {
    // Load p5.js
    if (typeof window !== 'undefined' && !window.p5) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.2/p5.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }

    // Load Tone.js
    if (typeof window !== 'undefined' && !window.Tone) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }
  };

  const setupPlinkoGame = () => {
    if (!window.p5 || !canvasRef.current || p5InstanceRef.current) return;

    const sketch = (p5: any) => {
      const gameState = gameStateRef.current;
      
      // Initialize seeds for provably fair system
      gameState.clientSeed = generateSeed();
      gameState.serverSeed = generateSeed();
      gameState.nonce = 0;

      console.log('Client Seed:', gameState.clientSeed);
      console.log('Server Seed:', gameState.serverSeed);

      const resizeCanvasToContainer = () => {
        const container = canvasRef.current;
        if (container) {
          p5.resizeCanvas(container.offsetWidth, container.offsetWidth);
          updateGameBoard();
        }
      };

      const updateGameBoard = () => {
        gameState.pins = [];
        gameState.slots = [];

        const startY = p5.height * 0.15;
        const startX = p5.width / 2;

        // Create pins in triangular pattern
        for (let i = 0; i < rows; i++) {
          const numPins = i + 1;
          const y = startY + i * pinSpacingBase * (p5.width / 600);
          const rowStartX = startX - (numPins - 1) * pinSpacingBase * (p5.width / 600) / 2;
          for (let j = 0; j < numPins; j++) {
            const x = rowStartX + j * pinSpacingBase * (p5.width / 600);
            gameState.pins.push({ x, y });
          }
        }

        // Calculate board boundaries
        const bottomRowPins = gameState.pins.filter((pin: Pin) => 
          pin.y === startY + (rows - 1) * pinSpacingBase * (p5.width / 600)
        );
        gameState.boardLeft = Math.min(...bottomRowPins.map((pin: Pin) => pin.x)) - pinRadiusBase * (p5.width / 600);
        gameState.boardRight = Math.max(...bottomRowPins.map((pin: Pin) => pin.x)) + pinRadiusBase * (p5.width / 600);

        // Create slots
        const numSlots = fixedMultipliers.length;
        const slotY = startY + rows * pinSpacingBase * (p5.width / 600) + ballRadiusBase * (p5.width / 600) * 2;

        for (let i = 0; i < numSlots; i++) {
          const multiplier = fixedMultipliers[i];
          const x = startX - (numSlots - 1) * slotWidthBase * (p5.width / 600) / 2 + i * slotWidthBase * (p5.width / 600);
          const probability = calculateProbability(i, numSlots);
          
          // Map multiplier to grayscale brightness
          const brightness = p5.map(multiplier, 0.4, 2.0, 20, 80);
          const slotColor = p5.color(0, 0, brightness);

          gameState.slots.push({
            x, y: slotY, multiplier, probability, color: slotColor,
            animationOffset: 0, targetOffset: 0
          });
        }
      };

      const initializeAudio = () => {
        if (window.Tone) {
          gameState.landingSynth = new window.Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.5 }
          }).toDestination();

          gameState.pinHitSynth = new window.Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 }
          }).toDestination();

          gameState.betClickSynth = new window.Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.05 }
          }).toDestination();

          gameState.winSound = new window.Tone.Synth({
            oscillator: { type: "square" },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.8 }
          }).toDestination();

          gameState.lossSound = new window.Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.05, release: 0.7 }
          }).toDestination();
        }
      };

      p5.setup = () => {
        const canvas = p5.createCanvas(600, 600);
        canvas.parent(canvasRef.current);
        p5.colorMode(p5.HSB, 360, 100, 100);
        
        updateGameBoard();
        initializeAudio();
        
        window.addEventListener('resize', resizeCanvasToContainer);
      };

      p5.draw = () => {
        p5.background(0); // Black background

        // Draw pins
        p5.fill(255);
        p5.noStroke();
        for (const pin of gameState.pins) {
          p5.ellipse(pin.x, pin.y, pinRadiusBase * 2 * (p5.width / 600), pinRadiusBase * 2 * (p5.width / 600));
        }

        // Draw slots with animation
        for (let i = 0; i < gameState.slots.length; i++) {
          const slot = gameState.slots[i];

          slot.animationOffset = p5.lerp(slot.animationOffset, slot.targetOffset, animationSpeed);

          p5.fill(slot.color);
          p5.rect(
            slot.x - slotWidthBase * (p5.width / 600) / 2,
            slot.y + slot.animationOffset,
            slotWidthBase * (p5.width / 600),
            15 * (p5.width / 600),
            5
          );

          p5.fill(255);
          p5.textAlign(p5.CENTER);
          p5.textSize(10 * (p5.width / 600));
          const multiplierText = slot.multiplier.toFixed(1);
          p5.text(multiplierText + 'x', slot.x, slot.y + 30 * (p5.width / 600) + slot.animationOffset);

          if (p5.abs(slot.animationOffset - slot.targetOffset) < 0.1) {
            slot.targetOffset = 0;
          }
        }

        // Update and draw balls with improved physics
        let pinHitCurrentOffset = 0;
        for (let i = gameState.balls.length - 1; i >= 0; i--) {
          const ball = gameState.balls[i];
          ball.vy += gravity;
          ball.vx *= friction;
          ball.x += ball.vx;
          ball.y += ball.vy;

          const scaledBallRadius = ballRadiusBase * (p5.width / 600);
          const scaledPinRadius = pinRadiusBase * (p5.width / 600);

          // Constrain ball within board boundaries
          if (ball.x < gameState.boardLeft + scaledBallRadius) {
            ball.x = gameState.boardLeft + scaledBallRadius;
            ball.vx *= bounceFactor;
          } else if (ball.x > gameState.boardRight - scaledBallRadius) {
            ball.x = gameState.boardRight - scaledBallRadius;
            ball.vx *= bounceFactor;
          }

          // Pin collision detection
          if (ball.row < rows) {
            for (const pin of gameState.pins) {
              const d = p5.dist(ball.x, ball.y, pin.x, pin.y);
              const collisionThreshold = scaledBallRadius + scaledPinRadius;
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

                // Play pin hit sound
                if (gameState.pinHitSynth && window.Tone) {
                  gameState.pinHitSynth.triggerAttackRelease("C2", "32n", window.Tone.context.currentTime + pinHitCurrentOffset);
                  pinHitCurrentOffset += 0.005;
                }
              }
            }
          }

          // Check for landing in slots
          for (let j = 0; j < gameState.slots.length; j++) {
            const slot = gameState.slots[j];
            const scaledSlotWidth = slotWidthBase * (p5.width / 600);

            if (ball.y > slot.y && p5.abs(ball.x - slot.x) < scaledSlotWidth / 2) {
              console.log("Ball landed in slot:", slot.multiplier + "x");

              // Use the rigged outcome that was predetermined when ball was created
              const predeterminedSlotIndex = ball.predeterminedSlot;
              const payout = parseFloat((parseFloat(betAmount) * fixedMultipliers[predeterminedSlotIndex]).toFixed(2));

              console.log("Balance before payout:", gameBalance.toFixed(2));
              console.log("Visual Slot Index:", j);
              console.log("Predetermined Slot Index:", predeterminedSlotIndex);
              console.log("Multiplier:", fixedMultipliers[predeterminedSlotIndex]);
              console.log("Calculated Payout:", payout.toFixed(2));

              setGameBalance(prev => prev + payout);
              
              // Show result based on predetermined outcome
              const isWin = fixedMultipliers[predeterminedSlotIndex] > 1.0;
              const isBreakEven = fixedMultipliers[predeterminedSlotIndex] === 1.0;
              
              let resultText, messageType;
              if (isWin) {
                resultText = `Win: $${payout.toFixed(2)}`;
                messageType = 'win';
                if (gameState.winSound) {
                  gameState.winSound.triggerAttackRelease("C6", "4n", window.Tone.now());
                }
              } else if (isBreakEven) {
                resultText = `Break Even: $${payout.toFixed(2)}`;
                messageType = 'info';
              } else {
                resultText = `Loss: $${(parseFloat(betAmount) - payout).toFixed(2)} (Payout: $${payout.toFixed(2)})`;
                messageType = 'loss';
                if (gameState.lossSound) {
                  gameState.lossSound.triggerAttackRelease("C3", "4n", window.Tone.now());
                }
              }

              toast({
                title: isWin ? "WIN!" : isBreakEven ? "BREAK EVEN" : "LOSS",
                description: `${fixedMultipliers[predeterminedSlotIndex].toFixed(1)}x - ${resultText}`,
                variant: isWin ? "default" : "destructive",
              });

              if (gameState.landingSynth) {
                gameState.landingSynth.triggerAttackRelease("C4", "8n", window.Tone.now());
              }

              slot.targetOffset = 5 * (p5.width / 600);
              gameState.balls.splice(gameState.balls.indexOf(ball), 1);
              setActiveBalls(prev => Math.max(0, prev - 1));
              break;
            }
          }

          // Remove ball if off screen
          if (ball.y > p5.height) {
            gameState.balls.splice(i, 1);
            setActiveBalls(prev => Math.max(0, prev - 1));
          }

          // Draw ball
          p5.fill(ball.ballColor);
          p5.noStroke();
          p5.ellipse(ball.x, ball.y, scaledBallRadius * 2, scaledBallRadius * 2);
        }
      };

      p5.mousePressed = () => {
        // Resume audio context on user interaction
        if (window.Tone && window.Tone.context.state !== 'running') {
          window.Tone.context.resume();
        }

        for (const slot of gameState.slots) {
          const scaledSlotWidth = slotWidthBase * (p5.width / 600);
          const scaledSlotHeight = 15 * (p5.width / 600);

          if (p5.mouseX > slot.x - scaledSlotWidth / 2 &&
              p5.mouseX < slot.x + scaledSlotWidth / 2 &&
              p5.mouseY > slot.y &&
              p5.mouseY <= slot.y + scaledSlotHeight) {
            const probabilityText = slot.probability;
            const multiplierText = slot.multiplier.toFixed(1);
            setSelectedSlotInfo(`Slot ${multiplierText}x: ${probabilityText}%`);
            setTimeout(() => setSelectedSlotInfo(null), 3000);
            break;
          }
        }
      };

      p5.keyPressed = () => {
        if (p5.key === ' ') {
          dropBall();
        }
      };
    };

    p5InstanceRef.current = new window.p5(sketch);
  };

  // Simulate ball path with rigging logic from original HTML
  const simulateBallPath = (seed: string, numSlots: number) => {
    // Rigging logic: If balance is >= $150, force outcome to 0.8x, 0.6x, or 0.4x slots
    if (gameBalance >= 150) {
      console.log("Rigging: Forcing loss to 0.8x, 0.6x, or 0.4x slots (balance >= $150)");
      // Select a random index from the specific rigged losing slots
      return riggedLosingSlotIndices[Math.floor(Math.random() * riggedLosingSlotIndices.length)];
    } else {
      // If balance is less than $150, use the original 50/50 chance logic
      let randomChance = Math.random(); // Value between 0 and 1
      if (randomChance < 0.5) { // 50% chance to win
        console.log("Rigging: Fair chance - Win (balance < $150, 50% chance)");
        // Select a random index from the winning slots
        return winningSlotIndices[Math.floor(Math.random() * winningSlotIndices.length)];
      } else { // 50% chance to lose
        console.log("Rigging: Fair chance - Loss (balance < $150, 50% chance)");
        // Select a random index from the general losing slots (includes 1.0x)
        return losingSlotIndices[Math.floor(Math.random() * losingSlotIndices.length)];
      }
    }
  };

  const dropBall = () => {
    // Resume audio context if needed
    if (window.Tone && window.Tone.context.state !== 'running') {
      window.Tone.context.resume();
    }

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (gameBalance < bet) {
      toast({
        title: "Insufficient balance!",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    if (activeBalls >= MAX_BALLS) {
      toast({
        title: "Too many balls",
        description: `Maximum ${MAX_BALLS} balls allowed`,
        variant: "destructive",
      });
      return;
    }

    // Deduct bet from balance immediately
    setGameBalance(prev => prev - bet);

    // Play bet click sound
    const gameState = gameStateRef.current;
    if (gameState.betClickSynth && window.Tone) {
      gameState.betClickSynth.triggerAttackRelease("C5", "16n", window.Tone.now());
    }

    if (!p5InstanceRef.current) return;

    const p5 = p5InstanceRef.current;
    
    // Determine the predetermined outcome using the exact logic from HTML
    const predeterminedSlot = simulateBallPath(generateHash(gameState.clientSeed, gameState.serverSeed, gameState.nonce), fixedMultipliers.length);
    
    const ball: Ball = {
      x: p5.width / 2,
      y: 50,
      vx: p5.random(-0.5, 0.5),
      vy: 0,
      row: 0,
      ballId: Date.now() + Math.random(),
      seed: generateHash(gameState.clientSeed, gameState.serverSeed, gameState.nonce++),
      ballColor: p5.color(p5.random(360), 100, 100),
      predeterminedSlot: predeterminedSlot
    };

    console.log("Ball created with predetermined slot:", predeterminedSlot, "Multiplier:", fixedMultipliers[predeterminedSlot]);

    gameState.balls.push(ball);
    setActiveBalls(prev => prev + 1);
  };

  const handleBetChange = (value: string) => {
    if (value === '') {
      setBetAmount('');
      return;
    }
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setBetAmount(value);
    }
  };

  const adjustBetAmount = (adjustment: number) => {
    const current = parseFloat(betAmount) || 0;
    const newAmount = Math.max(0.01, current + adjustment);
    setBetAmount(newAmount.toFixed(2));
  };

  const setBetToHalf = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current / 2).toFixed(2));
  };

  const setBetToDouble = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current * 2).toFixed(2));
  };

  const setBetToMax = () => {
    setBetAmount(gameBalance.toFixed(2));
  };

  // Load libraries and initialize game
  useEffect(() => {
    const initializeGame = async () => {
      await loadExternalLibraries();
      
      // Small delay to ensure libraries are fully loaded
      setTimeout(() => {
        setupPlinkoGame();
      }, 300);
    };

    initializeGame();

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-background-light rounded-xl p-6 mb-6">
        <div className="flex justify-center">
          <div ref={canvasRef} className="border border-gray-700 rounded-lg" style={{ width: '600px', height: '600px' }} />
        </div>
        {selectedSlotInfo && (
          <div className="text-center mt-4 text-sm text-green-400">
            {selectedSlotInfo}
          </div>
        )}
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
                -0.01
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(-0.1)}
                disabled={activeBalls >= MAX_BALLS}
              >
                -0.1
              </Button>
              <Input
                type="text"
                value={betAmount}
                onChange={(e) => handleBetChange(e.target.value)}
                className="text-center"
                disabled={activeBalls >= MAX_BALLS}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(0.1)}
                disabled={activeBalls >= MAX_BALLS}
              >
                +0.1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustBetAmount(0.01)}
                disabled={activeBalls >= MAX_BALLS}
              >
                +0.01
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={setBetToHalf}
                disabled={activeBalls >= MAX_BALLS}
              >
                1/2
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={setBetToDouble}
                disabled={activeBalls >= MAX_BALLS}
              >
                2x
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={setBetToMax}
                disabled={activeBalls >= MAX_BALLS}
              >
                Max
              </Button>
            </div>

            <Button
              onClick={dropBall}
              disabled={activeBalls >= MAX_BALLS || gameBalance < parseFloat(betAmount)}
              className="w-full"
              size="lg"
            >
              Drop Ball ({activeBalls}/{MAX_BALLS})
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Active Balls:</span>
                <span>{activeBalls}/{MAX_BALLS}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Bet:</span>
                <span>${betAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance:</span>
                <span>${gameBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rigging:</span>
                <span className={gameBalance >= 150 ? "text-red-400" : "text-green-400"}>
                  {gameBalance >= 150 ? "ACTIVE" : "FAIR"}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <p>• Click on slots to see win probability</p>
              <p>• Press Space or click button to drop ball</p>
              <p>• Balance ≥$150 triggers loss rigging</p>
              <p>• Provably fair system with client/server seeds</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multipliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {fixedMultipliers.map((mult, i) => (
                <div 
                  key={i} 
                  className={`text-center p-2 rounded ${
                    mult >= 1.5 ? 'bg-green-800 text-green-100' :
                    mult >= 1.0 ? 'bg-yellow-800 text-yellow-100' :
                    'bg-red-800 text-red-100'
                  }`}
                >
                  <div className="font-bold">{mult.toFixed(1)}x</div>
                  <div className="text-xs opacity-75">#{i + 1}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}