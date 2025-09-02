import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, AlertTriangle, Code, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/CurrencyProvider';
import { get } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { WinnersList } from '@/components/common/WinnersList';
import { CurrencySelector } from '@/components/common/CurrencySelector';

// Import the game framework for uploaded React component games
import { 
  useGameFramework, 
  GameWrapper, 
  BettingInterface, 
  GameHistory, 
  GameStats, 
  useGameSounds 
} from '@/lib/gameFramework';

interface CustomGame {
  id: number;
  name: string;
  type: string;
  gameCode: string;
  htmlContent: string;
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  description?: string;
  instructions?: string;
  category: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  createdBy: number;
  fileExtension: string;
}

interface GameComponentProps {
  game: CustomGame;
  gameFramework: ReturnType<typeof useGameFramework>;
  sounds: ReturnType<typeof useGameSounds>;
}

/**
 * Dynamic Game Component Loader
 * This component can load and execute React component games that have been uploaded by users.
 * It provides the same integration as built-in games.
 */
export default function DynamicGameLoader() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const params = useParams();
  const gameId = parseInt(params.id as string);
  
  const [game, setGame] = useState<CustomGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("1.00");
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWagered: 0,
    totalWon: 0
  });

  // Initialize game framework
  const gameFramework = useGameFramework({
    gameId: `custom-${gameId}`,
    gameName: game?.name || 'Custom Game',
    onResult: (result) => {
      // Update game history
      setGameHistory(prev => [{
        isWin: result.isWin,
        betAmount: parseFloat(betAmount),
        winAmount: result.winAmount,
        multiplier: result.multiplier,
        timestamp: new Date(),
        gameData: result.gameData
      }, ...prev.slice(0, 9)]); // Keep last 10 games

      // Update stats
      setGameStats(prev => ({
        totalGames: prev.totalGames + 1,
        totalWins: prev.totalWins + (result.isWin ? 1 : 0),
        totalLosses: prev.totalLosses + (result.isWin ? 0 : 1),
        totalWagered: prev.totalWagered + parseFloat(betAmount),
        totalWon: prev.totalWon + result.winAmount
      }));

      // Play sounds
      if (result.isWin) {
        sounds.playWinSound();
      } else {
        sounds.playLoseSound();
      }
    }
  });

  const sounds = useGameSounds();

  useEffect(() => {
    if (gameId && !isNaN(gameId)) {
      fetchGame();
    } else {
      setError('Invalid game ID');
      setLoading(false);
    }
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const foundGame = await get(`/api/games/custom/${gameId}`);
      
      if (!foundGame) {
        setError('Game not found');
        return;
      }
      
      if (!foundGame.isApproved) {
        setError('This game is not yet approved for play');
        return;
      }
      
      setGame(foundGame);
      setBetAmount(Math.max(parseFloat(foundGame.minBet), 1).toFixed(2));
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic component loader for React games
  const DynamicGameComponent = useMemo(() => {
    if (!game || game.fileExtension !== '.tsx') {
      return null;
    }

    try {
      // This is a simplified version - in a real implementation, you'd need
      // a more sophisticated module loader that can handle React components
      // For now, we'll show how the game code would be executed
      
      // Create a wrapper component that executes the uploaded game code
      const WrappedGameComponent: React.FC<GameComponentProps> = ({ game, gameFramework, sounds }) => {
        // This would execute the uploaded React component code
        // For security and complexity reasons, this is a demonstration
        return (
          <GameWrapper 
            title={game.name}
            description={game.description}
            instructions={game.instructions}
          >
            <div className="text-center p-8 border-2 border-dashed border-blue-300 rounded-lg">
              <Code className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">React Component Game</h3>
              <p className="text-gray-400 mb-4">
                This is where your uploaded React component would run with full casino integration.
              </p>
              <div className="bg-gray-800 p-4 rounded-lg text-left">
                <p className="text-sm text-green-400 mb-2">Available Framework Features:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• useGameFramework hook for API integration</li>
                  <li>• Automatic balance updates</li>
                  <li>• Toast notifications</li>
                  <li>• Multi-language support</li>
                  <li>• Sound effects</li>
                  <li>• Game history tracking</li>
                  <li>• Statistics collection</li>
                </ul>
              </div>
              
              <div className="mt-6">
                <BettingInterface
                  betAmount={betAmount}
                  onBetAmountChange={setBetAmount}
                  onPlay={() => {
                    gameFramework.playGame(parseFloat(betAmount), {
                      action: 'demo_play',
                      gameType: game.type
                    });
                  }}
                  isPlaying={gameFramework.isPlaying}
                  minBet={parseFloat(game.minBet)}
                  maxBet={parseFloat(game.maxBet)}
                  userBalance={parseFloat(gameFramework.user?.balance || '0')}
                  currency={currentCurrency}
                />
              </div>
            </div>
          </GameWrapper>
        );
      };

      return WrappedGameComponent;
    } catch (error) {
      console.error('Error loading game component:', error);
      return null;
    }
  }, [game, betAmount, gameFramework, sounds, currentCurrency]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              Loading game...
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !game) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div className="text-lg text-red-600">{error || 'Game not found'}</div>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold font-heading flex items-center gap-2">
                  <Gamepad2 className="h-6 w-6" />
                  {game.name}
                </h2>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{game.category}</Badge>
                  <Badge variant="outline">{game.type.toUpperCase()}</Badge>
                  <Badge variant="default">Custom Game</Badge>
                </div>
              </div>
            </div>
            <CurrencySelector />
          </div>

          {/* Game Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3">
              {game.fileExtension === '.tsx' && DynamicGameComponent ? (
                <DynamicGameComponent 
                  game={game}
                  gameFramework={gameFramework}
                  sounds={sounds}
                />
              ) : (
                // Fallback to iframe for HTML/JS games
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
                        srcDoc={game.htmlContent}
                        className="w-full h-96 border border-gray-300 rounded-lg bg-gray-900"
                        title={game.name}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Game Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Game Info</CardTitle>
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

              {/* Game Statistics */}
              {gameStats.totalGames > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GameStats
                      totalGames={gameStats.totalGames}
                      totalWins={gameStats.totalWins}
                      totalLosses={gameStats.totalLosses}
                      totalWagered={gameStats.totalWagered}
                      totalWon={gameStats.totalWon}
                      currency={currentCurrency}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Game History */}
              {gameHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Games</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GameHistory
                      history={gameHistory}
                      currency={currentCurrency}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Winners */}
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Recent Winners</h2>
          <WinnersList />
        </motion.div>
      </div>
    </MainLayout>
  );
}