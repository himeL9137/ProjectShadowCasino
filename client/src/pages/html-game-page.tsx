import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Coins, TrendingUp, Info } from 'lucide-react';
import { FlexibleBetInput } from '@/components/ui/flexible-bet-input';
import { get, post } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from '@/hooks/use-toast';

interface CustomGame {
  id: number;
  name: string;
  type: string;
  htmlContent: string;
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
}

export default function HtmlGamePage() {
  const { user } = useAuth();
  const { balance: userBalance, currency: userCurrency, refetchBalance } = useWallet();
  const [, setLocation] = useLocation();
  const params = useParams();
  const gameId = parseInt(params.id as string);
  
  const [game, setGame] = useState<CustomGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [enhancedHtmlContent, setEnhancedHtmlContent] = useState('');
  const gameIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (gameId && !isNaN(gameId)) {
      fetchGame();
    } else {
      toast({
        title: "Invalid Game ID",
        description: "The game ID provided is not valid.",
        variant: "destructive",
      });
      setLocation('/games');
    }
  }, [gameId]);

  useEffect(() => {
    if (game) {
      const enhanced = enhanceHtmlGameContent(game.htmlContent);
      setEnhancedHtmlContent(enhanced);
      setBetAmount(Math.max(Number(game.minBet), 10));
    }
  }, [game]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const foundGame = await get(`/api/games/custom/${gameId}`);
      
      if (!foundGame) {
        toast({
          title: "Game Not Found",
          description: "The requested game could not be found.",
          variant: "destructive",
        });
        setLocation('/games');
        return;
      }
      
      setGame(foundGame);
    } catch (error) {
      console.error('Error fetching game:', error);
      toast({
        title: "Error",
        description: "Failed to load game. Please try again.",
        variant: "destructive",
      });
      setLocation('/games');
    } finally {
      setLoading(false);
    }
  };

  const enhanceHtmlGameContent = (originalHtml: string) => {
    const casinoScript = `
      <script>
        // Casino integration bridge for HTML games
        window.casinoAPI = {
          gameId: ${gameId},
          userBalance: ${userBalance},
          currency: '${userCurrency}',
          minBet: ${game?.minBet || 1},
          maxBet: ${game?.maxBet || 1000},
          winChance: ${game?.winChance || 50},
          maxMultiplier: ${game?.maxMultiplier || 2.0},
          
          // Place a bet and process game result
          async placeBet(betAmount, gameResult = null) {
            try {
              // Validate bet amount
              if (betAmount < this.minBet || betAmount > this.maxBet) {
                throw new Error(\`Bet amount must be between \${this.minBet} and \${this.maxBet}\`);
              }
              
              if (betAmount > this.userBalance) {
                throw new Error('Insufficient balance');
              }
              
              // Send bet to parent window
              window.parent.postMessage({
                type: 'PLACE_BET',
                gameId: this.gameId,
                betAmount: betAmount,
                gameResult: gameResult
              }, '*');
              
              return true;
            } catch (error) {
              console.error('Casino API Error:', error);
              window.parent.postMessage({
                type: 'GAME_ERROR',
                error: error.message
              }, '*');
              return false;
            }
          },
          
          // Update balance display (called by parent)
          updateBalance(newBalance) {
            this.userBalance = newBalance;
            const balanceElements = document.querySelectorAll('.casino-balance');
            balanceElements.forEach(el => {
              el.textContent = \`\${newBalance} \${this.currency}\`;
            });
          },
          
          // Utility functions for game developers
          generateRandomResult(winChance = this.winChance) {
            return Math.random() * 100 < winChance;
          },
          
          calculatePayout(betAmount, multiplier) {
            return Math.floor(betAmount * multiplier);
          },
          
          // Display current balance
          getCurrentBalance() {
            return this.userBalance;
          }
        };
        
        // Auto-inject balance display if elements exist
        document.addEventListener('DOMContentLoaded', function() {
          const balanceElements = document.querySelectorAll('.casino-balance');
          balanceElements.forEach(el => {
            el.textContent = \`\${window.casinoAPI.userBalance} \${window.casinoAPI.currency}\`;
          });
          
          // Add click handlers for bet buttons
          const betButtons = document.querySelectorAll('.casino-bet-button');
          betButtons.forEach(btn => {
            btn.addEventListener('click', function() {
              const betAmount = parseFloat(this.dataset.betAmount) || 10;
              window.casinoAPI.placeBet(betAmount);
            });
          });
        });
        
        console.log('Casino API initialized for game ID:', window.casinoAPI.gameId);
      </script>
      
      <style>
        .casino-balance {
          font-weight: bold;
          color: #10b981;
          font-size: 1.1em;
        }
        
        .casino-bet-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
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
        
        .casino-game-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 12px;
          color: white;
        }
      </style>`;

    // Inject the enhanced HTML content
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${game?.name || 'Custom Game'}</title>
        ${casinoScript}
      </head>
      <body>
        ${originalHtml}
      </body>
      </html>
    `;
  };
  // Handle messages from iframe (game results)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'PLACE_BET') {
        await handleIframeBet(event.data);
      } else if (event.data.type === 'GAME_ERROR') {
        toast({
          title: "Game Error",
          description: event.data.error,
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeBet = async (data: any) => {
    try {
      setIsPlaying(true);
      
      // Process the bet through the existing casino system
      const response = await post('/api/games/html-game/bet', {
        gameId: data.gameId,
        betAmount: data.betAmount,
        gameResult: data.gameResult
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update balance
        await refetchBalance();
        
        // Send updated balance to iframe
        if (gameIframeRef.current?.contentWindow) {
          gameIframeRef.current.contentWindow.postMessage({
            type: 'BALANCE_UPDATE',
            balance: userBalance,
            gameResult: result
          }, '*');
        }
        
        // Show result toast
        toast({
          title: result.won ? "You Won!" : "Try Again!",
          description: result.won 
            ? `You won ${result.winAmount} ${userCurrency} (${result.multiplier}x)`
            : `Better luck next time!`,
          variant: result.won ? "default" : "destructive",
        });
        
      } else {
        const error = await response.json();
        toast({
          title: "Bet Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing iframe bet:', error);
      toast({
        title: "Error",
        description: "Failed to process bet",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  // Handle manual betting (from the betting interface outside the game)
  const handlePlaceHtmlGameBet = async () => {
    if (!game || isPlaying) return;
    
    try {
      setIsPlaying(true);
      
      const response = await post('/api/games/html-game/bet', {
        gameId: gameId,
        betAmount: betAmount,
        gameResult: null // Let the system determine the outcome
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update balance
        await refetchBalance();
        
        // Send result to iframe if needed
        if (gameIframeRef.current?.contentWindow) {
          gameIframeRef.current.contentWindow.postMessage({
            type: 'GAME_RESULT',
            result: result
          }, '*');
        }
        
        // Show result toast
        toast({
          title: result.won ? "You Won!" : "Try Again!",
          description: result.won 
            ? `You won ${result.winAmount} ${userCurrency} (${result.multiplier}x)`
            : `Better luck next time!`,
          variant: result.won ? "default" : "destructive",
        });
        
      } else {
        const error = await response.json();
        toast({
          title: "Bet Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: "Error",
        description: "Failed to place bet",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading game...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Game not found</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/games')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>
          <h1 className="text-3xl font-bold">{game.name}</h1>
          <Badge variant="secondary">{game.type.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Betting Interface */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Place Your Bet</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="text-lg font-semibold">{userBalance} {userCurrency}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FlexibleBetInput
                    value={betAmount}
                    onChange={setBetAmount}
                    disabled={isPlaying}
                    currency={userCurrency}
                    balance={userBalance}
                    minBet={Number(game.minBet)}
                    maxBet={Number(game.maxBet)}
                    className="max-w-md mx-auto"
                  />
                  
                  <Button
                    onClick={handlePlaceHtmlGameBet}
                    disabled={isPlaying || betAmount < Number(game.minBet) || betAmount > userBalance || !user}
                    className="w-full"
                    size="lg"
                  >
                    {isPlaying ? (
                      <>
                        <Play className="mr-2 h-4 w-4 animate-spin" />
                        Playing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play for {betAmount} {userCurrency}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game iframe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Game Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                  <iframe
                    key={enhancedHtmlContent} // Force re-render when content changes
                    srcDoc={enhancedHtmlContent}
                    className="w-full h-96 border border-gray-300 rounded-lg bg-gray-900"
                    title={game.name}
                    sandbox="allow-scripts allow-same-origin"
                    ref={gameIframeRef}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Game Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {game.description && (
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Win Chance:</span>
                    <span className="font-semibold text-green-600">{game.winChance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Multiplier:</span>
                    <span className="font-semibold text-blue-600">{game.maxMultiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bet Range:</span>
                    <span className="font-semibold">{game.minBet} - {game.maxBet}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Games */}
            {gameHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameHistory.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex justify-between items-center p-2 rounded text-sm ${
                          entry.won ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">
                            {entry.won ? `+${entry.winAmount.toFixed(2)}` : `-${entry.betAmount}`} {entry.currency}
                          </div>
                          <div className="text-xs opacity-75">
                            {entry.won ? `${entry.multiplier}x` : 'Lost'}
                          </div>
                        </div>
                        <div className="text-xs opacity-75">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}