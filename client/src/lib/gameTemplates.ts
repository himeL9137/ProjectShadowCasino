import { GameType } from "@shared/schema";

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'react' | 'html' | 'javascript';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  template: string;
  exampleCode?: string;
  requiredFiles?: string[];
  instructions: string;
}

export const gameTemplates: GameTemplate[] = [
  {
    id: 'simple-dice-react',
    name: 'Simple Dice Game (React)',
    description: 'A basic dice game using React with full casino API integration',
    category: 'casino',
    type: 'react',
    difficulty: 'beginner',
    features: ['API Integration', 'Balance Updates', 'Win/Loss Logic', 'Animation'],
    template: `import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/CurrencyProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    playerRoll: number;
    targetNumber: number;
  };
}

export function CustomDiceGame() {
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [targetNumber, setTargetNumber] = useState(4);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/custom-play", {
        gameId: "custom-dice",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        gameData: { targetNumber }
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      setLastRoll(data.gameData.playerRoll);
      
      if (data.isWin) {
        toast({
          title: "You Won!",
          description: \`You won \${data.winAmount} \${currentCurrency}\`,
        });
      } else {
        toast({
          title: "Try Again!",
          description: "Better luck next time!",
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
    },
    onMutate: () => {
      setIsRolling(true);
      setTimeout(() => setIsRolling(false), 2000);
    }
  });

  const handleRoll = () => {
    if (!user || rollMutation.isPending) return;
    rollMutation.mutate();
  };

  return (
    <div className="bg-background-light rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Custom Dice Game</h2>
        <p className="text-gray-400">Roll higher than your target to win!</p>
      </div>

      <div className="flex justify-center">
        <motion.div
          className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-4xl font-bold text-black"
          animate={isRolling ? { rotateX: 360 } : {}}
          transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
        >
          {isRolling ? "?" : (lastRoll || "🎲")}
        </motion.div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bet Amount</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={rollMutation.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Number (1-6)</label>
          <Input
            type="number"
            value={targetNumber}
            onChange={(e) => setTargetNumber(parseInt(e.target.value))}
            min="1"
            max="6"
            disabled={rollMutation.isPending}
          />
        </div>

        <Button 
          onClick={handleRoll}
          disabled={rollMutation.isPending || !user}
          className="w-full"
          size="lg"
        >
          {rollMutation.isPending ? "Rolling..." : \`Roll Dice - \${betAmount} \${currentCurrency}\`}
        </Button>
      </div>
    </div>
  );
}`,
    requiredFiles: ['CustomDiceGame.tsx'],
    instructions: `1. Save this code as CustomDiceGame.tsx
2. The game integrates with the casino API using React Query
3. It updates the user's balance automatically
4. Includes proper error handling and loading states
5. Uses the same UI components as other casino games
6. Ready to be added to the games list and routing`
  },
  {
    id: 'card-flip-react',
    name: 'Card Flip Game (React)',
    description: 'A memory card game with casino betting mechanics',
    category: 'casino',
    type: 'react',
    difficulty: 'intermediate',
    features: ['Memory Game', 'Multiple Rounds', 'Progressive Betting', 'Animations'],
    template: `import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/CurrencyProvider';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface GameCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  gameData: {
    cardsMatched: number;
    totalPairs: number;
    timeBonus: number;
  };
}

export function CustomCardFlipGame() {
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const cardValues = ['🎰', '🎲', '💎', '🍒', '⭐', '🔥', '💰', '🎯'];

  const initializeGame = () => {
    const gameCards = [...cardValues, ...cardValues]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(gameCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(60);
    setGameStarted(true);
  };

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const res = await apiRequest("POST", "/api/games/custom-play", {
        gameId: "custom-card-flip",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        gameData
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      if (data.isWin) {
        toast({
          title: "Congratulations!",
          description: \`You won \${data.winAmount} \${currentCurrency}!\`,
        });
      } else {
        toast({
          title: "Game Over",
          description: "Better luck next time!",
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      setGameStarted(false);
    }
  });

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2 || cards[cardId].isFlipped || cards[cardId].isMatched) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    const newCards = cards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards[firstId];
      const secondCard = newCards[secondId];

      if (firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstId || card.id === secondId 
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Check win condition
  useEffect(() => {
    if (matchedPairs === cardValues.length && gameStarted) {
      playGameMutation.mutate({
        cardsMatched: matchedPairs,
        totalPairs: cardValues.length,
        moves,
        timeLeft,
        completed: true
      });
    }
  }, [matchedPairs]);

  // Timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over - time up
          playGameMutation.mutate({
            cardsMatched: matchedPairs,
            totalPairs: cardValues.length,
            moves,
            timeLeft: 0,
            completed: false
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft]);

  return (
    <div className="bg-background-light rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Memory Card Game</h2>
        <p className="text-gray-400">Match all pairs before time runs out!</p>
      </div>

      {!gameStarted ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bet Amount</label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
          <Button onClick={initializeGame} className="w-full" size="lg">
            Start Game - {betAmount} {currentCurrency}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-sm">
            <span>Pairs: {matchedPairs}/{cardValues.length}</span>
            <span>Moves: {moves}</span>
            <span>Time: {timeLeft}s</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cards.map(card => (
              <motion.div
                key={card.id}
                className="aspect-square"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className={\`h-full cursor-pointer transition-all \${
                    card.isFlipped || card.isMatched 
                      ? 'bg-blue-500' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }\`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardContent className="flex items-center justify-center h-full p-0">
                    <AnimatePresence mode="wait">
                      {card.isFlipped || card.isMatched ? (
                        <motion.span
                          key="front"
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-2xl"
                        >
                          {card.value}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="back"
                          initial={{ rotateY: 0 }}
                          animate={{ rotateY: 0 }}
                          className="text-2xl text-gray-400"
                        >
                          ❓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}`,
    requiredFiles: ['CustomCardFlipGame.tsx'],
    instructions: `1. Save this code as CustomCardFlipGame.tsx
2. This is a more advanced game with timer and multiple game states
3. Includes match detection, scoring, and time pressure
4. Fully integrated with the casino betting system
5. Uses advanced animations and state management
6. Can be easily customized with different card sets or rules`
  },
  {
    id: 'html-slot-basic',
    name: 'Basic Slot Machine (HTML)',
    description: 'A simple HTML/CSS/JS slot machine with casino API integration',
    category: 'casino',
    type: 'html',
    difficulty: 'beginner',
    features: ['HTML/CSS/JS', 'Slot Reels', 'Win Detection', 'Balance Integration'],
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Slot Machine</title>
    <style>
        .casino-game-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #1f2937, #111827);
            border-radius: 12px;
            color: white;
            text-align: center;
            font-family: Arial, sans-serif;
        }
        
        .slot-machine {
            background: #2d3748;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .reels {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }
        
        .reel {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: #333;
            border: 3px solid #ffd700;
            animation: spin 0.5s ease-in-out;
        }
        
        @keyframes spin {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
        }
        
        .controls {
            background: #374151;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .bet-input {
            width: 100px;
            padding: 8px;
            margin: 0 10px;
            border: none;
            border-radius: 4px;
            text-align: center;
        }
        
        .casino-bet-button {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s;
            margin: 0 5px;
        }
        
        .casino-bet-button:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            transform: translateY(-1px);
        }
        
        .casino-bet-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .balance-display {
            background: #065f46;
            color: #10b981;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            font-weight: bold;
        }
        
        .result-display {
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            font-weight: bold;
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .win {
            background: #065f46;
            color: #10b981;
        }
        
        .lose {
            background: #7f1d1d;
            color: #f87171;
        }
        
        .paytable {
            background: #374151;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="casino-game-container">
        <h1>🎰 Custom Slot Machine</h1>
        <p>Your Balance: <span class="casino-balance">Loading...</span></p>
        
        <div class="slot-machine">
            <div class="reels">
                <div class="reel" id="reel1">🍒</div>
                <div class="reel" id="reel2">🍋</div>
                <div class="reel" id="reel3">🍒</div>
            </div>
            
            <div class="result-display" id="result">
                Pull the lever to play!
            </div>
        </div>
        
        <div class="controls">
            <div>
                <label>Bet Amount:</label>
                <input type="number" id="betAmount" class="bet-input" value="1.00" min="0.01" step="0.01">
                <span id="currency">USD</span>
            </div>
            <br><br>
            <button class="casino-bet-button" onclick="spinReels()" id="spinButton">
                🎰 SPIN
            </button>
        </div>
        
        <div class="paytable">
            <h3>💰 Paytable</h3>
            <div>🍒🍒🍒 = 5x bet</div>
            <div>🍋🍋🍋 = 3x bet</div>
            <div>⭐⭐⭐ = 10x bet</div>
            <div>💎💎💎 = 20x bet</div>
            <div>🔥🔥🔥 = 50x bet</div>
            <div>Any two matching = 1.5x bet</div>
        </div>
    </div>

    <script>
        const symbols = ['🍒', '🍋', '⭐', '💎', '🔥', '🍇', '🍊'];
        let isSpinning = false;
        
        function spinReels() {
            if (isSpinning) return;
            
            const betAmount = parseFloat(document.getElementById('betAmount').value);
            if (betAmount <= 0) {
                alert('Please enter a valid bet amount');
                return;
            }
            
            if (betAmount > window.casinoAPI.userBalance) {
                alert('Insufficient balance');
                return;
            }
            
            isSpinning = true;
            document.getElementById('spinButton').disabled = true;
            document.getElementById('result').textContent = 'Spinning...';
            document.getElementById('result').className = 'result-display';
            
            // Animate reels
            const reels = ['reel1', 'reel2', 'reel3'];
            reels.forEach(reelId => {
                const reel = document.getElementById(reelId);
                reel.style.animation = 'spin 0.1s infinite';
            });
            
            // Stop reels after delay
            setTimeout(() => {
                const results = [];
                reels.forEach(reelId => {
                    const reel = document.getElementById(reelId);
                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                    reel.textContent = symbol;
                    reel.style.animation = '';
                    results.push(symbol);
                });
                
                // Calculate win
                const gameResult = calculateWin(results, betAmount);
                
                // Send bet to casino API
                window.casinoAPI.placeBet(betAmount, gameResult);
                
                isSpinning = false;
                document.getElementById('spinButton').disabled = false;
            }, 2000);
        }
        
        function calculateWin(results, betAmount) {
            const [r1, r2, r3] = results;
            let multiplier = 0;
            let winMessage = '';
            
            // Check for three of a kind
            if (r1 === r2 && r2 === r3) {
                switch (r1) {
                    case '🔥': multiplier = 50; winMessage = 'JACKPOT! Triple Fire!'; break;
                    case '💎': multiplier = 20; winMessage = 'HUGE WIN! Triple Diamonds!'; break;
                    case '⭐': multiplier = 10; winMessage = 'BIG WIN! Triple Stars!'; break;
                    case '🍒': multiplier = 5; winMessage = 'Nice! Triple Cherries!'; break;
                    case '🍋': multiplier = 3; winMessage = 'Good! Triple Lemons!'; break;
                    default: multiplier = 2; winMessage = 'Triple Match!'; break;
                }
            }
            // Check for two of a kind
            else if (r1 === r2 || r2 === r3 || r1 === r3) {
                multiplier = 1.5;
                winMessage = 'Small win! Two matching symbols!';
            }
            // No win
            else {
                multiplier = 0;
                winMessage = 'Try again!';
            }
            
            const isWin = multiplier > 0;
            const winAmount = isWin ? betAmount * multiplier : 0;
            
            // Update result display
            const resultEl = document.getElementById('result');
            resultEl.textContent = winMessage;
            resultEl.className = \`result-display \${isWin ? 'win' : 'lose'}\`;
            
            return {
                isWin,
                winAmount,
                multiplier,
                gameData: { reels: results }
            };
        }
        
        // Listen for balance updates from parent
        window.addEventListener('message', function(event) {
            if (event.data.type === 'BALANCE_UPDATE') {
                window.casinoAPI.updateBalance(event.data.balance);
            }
        });
        
        // Initialize display when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Set currency display
            if (window.casinoAPI) {
                document.getElementById('currency').textContent = window.casinoAPI.currency;
            }
        });
    </script>
</body>
</html>`,
    requiredFiles: ['slot-machine.html'],
    instructions: `1. Save this code as slot-machine.html
2. This is a complete slot machine game that integrates with the casino API
3. Includes proper win calculation, animations, and balance management
4. Uses the casinoAPI provided by the platform
5. Automatically updates balance and shows win/loss results
6. Ready to upload through the game installer`
  },
  {
    id: 'javascript-roulette',
    name: 'Roulette Wheel (JavaScript)',
    description: 'A JavaScript-based roulette game with betting options',
    category: 'casino',
    type: 'javascript',
    difficulty: 'advanced',
    features: ['Canvas Graphics', 'Physics Animation', 'Multiple Bet Types', 'Realistic Wheel'],
    template: `class RouletteGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.wheel = null;
        this.ball = null;
        this.isSpinning = false;
        this.betAmount = 1.00;
        this.selectedBets = [];
        
        this.numbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
            24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];
        
        this.redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        
        this.init();
    }
    
    init() {
        this.createGameHTML();
        this.initCanvas();
        this.drawWheel();
        this.setupEventListeners();
    }
    
    createGameHTML() {
        document.body.innerHTML = \`
            <div class="casino-game-container">
                <h1>🎯 Roulette Wheel</h1>
                <p>Your Balance: <span class="casino-balance">Loading...</span></p>
                
                <div class="game-area">
                    <canvas id="rouletteCanvas" width="400" height="400"></canvas>
                    
                    <div class="betting-area">
                        <h3>Place Your Bets</h3>
                        
                        <div class="bet-controls">
                            <label>Bet Amount:</label>
                            <input type="number" id="betAmount" value="1.00" min="0.01" step="0.01">
                        </div>
                        
                        <div class="bet-types">
                            <div class="bet-section">
                                <h4>Number Bets (35:1)</h4>
                                <div class="number-grid">
                                    \${this.generateNumberButtons()}
                                </div>
                            </div>
                            
                            <div class="bet-section">
                                <h4>Outside Bets</h4>
                                <button class="bet-button" data-bet="red">Red (1:1)</button>
                                <button class="bet-button" data-bet="black">Black (1:1)</button>
                                <button class="bet-button" data-bet="even">Even (1:1)</button>
                                <button class="bet-button" data-bet="odd">Odd (1:1)</button>
                                <button class="bet-button" data-bet="low">1-18 (1:1)</button>
                                <button class="bet-button" data-bet="high">19-36 (1:1)</button>
                            </div>
                        </div>
                        
                        <div class="selected-bets">
                            <h4>Your Bets</h4>
                            <div id="betsList"></div>
                            <div>Total: <span id="totalBet">0.00</span></div>
                        </div>
                        
                        <button class="casino-bet-button" onclick="rouletteGame.spin()" id="spinButton">
                            🎯 SPIN WHEEL
                        </button>
                        
                        <button class="clear-button" onclick="rouletteGame.clearBets()">
                            Clear Bets
                        </button>
                    </div>
                </div>
                
                <div class="result-area" id="resultArea"></div>
            </div>
            
            <style>
                .casino-game-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #1f2937, #111827);
                    border-radius: 12px;
                    color: white;
                    font-family: Arial, sans-serif;
                }
                
                .game-area {
                    display: flex;
                    gap: 20px;
                    margin: 20px 0;
                }
                
                canvas {
                    border: 3px solid #ffd700;
                    border-radius: 50%;
                    background: #2d3748;
                }
                
                .betting-area {
                    flex: 1;
                    background: #374151;
                    padding: 20px;
                    border-radius: 8px;
                }
                
                .bet-controls {
                    margin-bottom: 20px;
                }
                
                .bet-controls input {
                    width: 100px;
                    padding: 5px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 4px;
                }
                
                .number-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 5px;
                    margin: 10px 0;
                }
                
                .number-btn {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #555;
                    background: #2d3748;
                    color: white;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .number-btn.red {
                    background: #dc2626;
                }
                
                .number-btn.selected {
                    border-color: #ffd700;
                    box-shadow: 0 0 5px #ffd700;
                }
                
                .bet-button {
                    display: block;
                    width: 100%;
                    margin: 5px 0;
                    padding: 8px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .bet-button:hover {
                    background: #2563eb;
                }
                
                .casino-bet-button {
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0 10px 0;
                }
                
                .clear-button {
                    width: 100%;
                    padding: 10px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .result-area {
                    background: #374151;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                    min-height: 50px;
                }
                
                @media (max-width: 768px) {
                    .game-area {
                        flex-direction: column;
                    }
                }
            </style>
        \`;
    }
    
    generateNumberButtons() {
        let html = '<button class="number-btn green" data-number="0">0</button>';
        
        for (let i = 1; i <= 36; i++) {
            const isRed = this.redNumbers.includes(i);
            html += \`<button class="number-btn \${isRed ? 'red' : 'black'}" data-number="\${i}">\${i}</button>\`;
        }
        
        return html;
    }
    
    initCanvas() {
        this.canvas = document.getElementById('rouletteCanvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 180;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw wheel sections
        const angleStep = (Math.PI * 2) / this.numbers.length;
        
        this.numbers.forEach((number, index) => {
            const startAngle = index * angleStep;
            const endAngle = (index + 1) * angleStep;
            
            // Determine color
            let color = '#2d7d32'; // Green for 0
            if (number !== 0) {
                color = this.redNumbers.includes(number) ? '#dc2626' : '#1f1f1f';
            }
            
            // Draw section
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw number
            const textAngle = startAngle + angleStep / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.8);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.8);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), textX, textY);
        });
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw ball
        this.drawBall();
    }
    
    drawBall() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (!this.ball) {
            this.ball = { angle: 0, radius: 160 };
        }
        
        const ballX = centerX + Math.cos(this.ball.angle) * this.ball.radius;
        const ballY = centerY + Math.sin(this.ball.angle) * this.ball.radius;
        
        ctx.beginPath();
        ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number);
                this.addBet('number', number, 35);
                e.target.classList.toggle('selected');
            });
        });
        
        // Outside bet buttons
        document.querySelectorAll('.bet-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const betType = e.target.dataset.bet;
                this.addBet(betType, betType, 1);
            });
        });
        
        // Bet amount input
        document.getElementById('betAmount').addEventListener('change', (e) => {
            this.betAmount = parseFloat(e.target.value) || 1.00;
        });
    }
    
    addBet(type, value, payout) {
        const amount = this.betAmount;
        const bet = { type, value, amount, payout };
        
        // Check if bet already exists
        const existingIndex = this.selectedBets.findIndex(b => 
            b.type === type && b.value === value
        );
        
        if (existingIndex >= 0) {
            this.selectedBets[existingIndex].amount += amount;
        } else {
            this.selectedBets.push(bet);
        }
        
        this.updateBetsDisplay();
    }
    
    updateBetsDisplay() {
        const betsList = document.getElementById('betsList');
        const totalBet = document.getElementById('totalBet');
        
        let html = '';
        let total = 0;
        
        this.selectedBets.forEach((bet, index) => {
            html += \`<div>
                \${bet.type === 'number' ? 'Number ' + bet.value : bet.value.toUpperCase()}: 
                \${bet.amount.toFixed(2)} (\${bet.payout}:1)
                <button onclick="rouletteGame.removeBet(\${index})">❌</button>
            </div>\`;
            total += bet.amount;
        });
        
        betsList.innerHTML = html;
        totalBet.textContent = total.toFixed(2);
    }
    
    removeBet(index) {
        this.selectedBets.splice(index, 1);
        this.updateBetsDisplay();
        
        // Remove visual selection for number bets
        document.querySelectorAll('.number-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    clearBets() {
        this.selectedBets = [];
        this.updateBetsDisplay();
        document.querySelectorAll('.number-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    async spin() {
        if (this.isSpinning || this.selectedBets.length === 0) return;
        
        const totalBetAmount = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
        
        if (totalBetAmount > window.casinoAPI.userBalance) {
            alert('Insufficient balance for total bets');
            return;
        }
        
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        document.getElementById('resultArea').innerHTML = '<p>🎯 Spinning...</p>';
        
        // Animate wheel and ball
        const winningNumber = this.numbers[Math.floor(Math.random() * this.numbers.length)];
        await this.animateSpin(winningNumber);
        
        // Calculate results
        const gameResult = this.calculateResult(winningNumber);
        
        // Send bet to casino API
        window.casinoAPI.placeBet(totalBetAmount, gameResult);
        
        this.displayResult(winningNumber, gameResult);
        
        this.isSpinning = false;
        document.getElementById('spinButton').disabled = false;
        this.clearBets();
    }
    
    async animateSpin(winningNumber) {
        return new Promise(resolve => {
            let spins = 0;
            const maxSpins = 50;
            const interval = setInterval(() => {
                this.ball.angle += 0.2;
                this.drawWheel();
                
                spins++;
                if (spins >= maxSpins) {
                    clearInterval(interval);
                    
                    // Position ball on winning number
                    const winningIndex = this.numbers.indexOf(winningNumber);
                    const angleStep = (Math.PI * 2) / this.numbers.length;
                    this.ball.angle = winningIndex * angleStep + angleStep / 2;
                    this.drawWheel();
                    
                    resolve();
                }
            }, 100);
        });
    }
    
    calculateResult(winningNumber) {
        let totalWin = 0;
        const wins = [];
        
        this.selectedBets.forEach(bet => {
            let isWin = false;
            
            switch (bet.type) {
                case 'number':
                    isWin = bet.value === winningNumber;
                    break;
                case 'red':
                    isWin = this.redNumbers.includes(winningNumber) && winningNumber !== 0;
                    break;
                case 'black':
                    isWin = !this.redNumbers.includes(winningNumber) && winningNumber !== 0;
                    break;
                case 'even':
                    isWin = winningNumber % 2 === 0 && winningNumber !== 0;
                    break;
                case 'odd':
                    isWin = winningNumber % 2 === 1;
                    break;
                case 'low':
                    isWin = winningNumber >= 1 && winningNumber <= 18;
                    break;
                case 'high':
                    isWin = winningNumber >= 19 && winningNumber <= 36;
                    break;
            }
            
            if (isWin) {
                const winAmount = bet.amount * (bet.payout + 1);
                totalWin += winAmount;
                wins.push({ type: bet.type, value: bet.value, amount: winAmount });
            }
        });
        
        const totalBet = this.selectedBets.reduce((sum, bet) => sum + bet.amount, 0);
        const netWin = totalWin - totalBet;
        
        return {
            isWin: totalWin > 0,
            winAmount: Math.max(0, netWin),
            multiplier: totalBet > 0 ? totalWin / totalBet : 0,
            gameData: {
                winningNumber,
                wins,
                totalBet,
                totalWin
            }
        };
    }
    
    displayResult(winningNumber, gameResult) {
        const isRed = this.redNumbers.includes(winningNumber);
        const color = winningNumber === 0 ? 'green' : (isRed ? 'red' : 'black');
        
        let html = \`
            <h3>🎯 Winning Number: <span style="color: \${color}">\${winningNumber}</span></h3>
        \`;
        
        if (gameResult.isWin) {
            html += \`
                <p style="color: #10b981; font-size: 18px; font-weight: bold;">
                    🎉 You Won \${gameResult.winAmount.toFixed(2)}!
                </p>
                <p>Winning Bets:</p>
                <ul>
                    \${gameResult.gameData.wins.map(win => 
                        \`<li>\${win.type} \${win.value}: +\${win.amount.toFixed(2)}</li>\`
                    ).join('')}
                </ul>
            \`;
        } else {
            html += \`
                <p style="color: #f87171; font-size: 18px;">
                    Better luck next time!
                </p>
            \`;
        }
        
        document.getElementById('resultArea').innerHTML = html;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.rouletteGame = new RouletteGame();
});`,
    requiredFiles: ['roulette-game.js'],
    instructions: `1. Save this code as roulette-game.js
2. This is an advanced JavaScript game with canvas graphics
3. Includes a realistic roulette wheel with animation
4. Multiple betting options (numbers, colors, odds/evens, etc.)
5. Full integration with the casino API
6. Advanced features like visual feedback and detailed results
7. Upload as a JavaScript file through the game installer`
  }
];

export function getTemplateById(id: string): GameTemplate | undefined {
  return gameTemplates.find(template => template.id === id);
}

export function getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): GameTemplate[] {
  return gameTemplates.filter(template => template.difficulty === difficulty);
}

export function getTemplatesByType(type: 'react' | 'html' | 'javascript'): GameTemplate[] {
  return gameTemplates.filter(template => template.type === type);
}

export function getTemplatesByCategory(category: string): GameTemplate[] {
  return gameTemplates.filter(template => template.category === category);
}