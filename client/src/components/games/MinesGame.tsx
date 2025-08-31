import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/providers/LanguageProvider";
import { motion } from "framer-motion";
import { Loader2, Bomb, Gem } from "lucide-react";

interface GameResult {
  isWin: boolean;
  winAmount: number;
  multiplier: number;
  balance: string;
  gameData: {
    grid: Array<{
      position: number;
      isMine: boolean;
      isRevealed: boolean;
      isGem: boolean;
    }>;
    minePositions: number[];
    gemsFound: number;
    action: 'reveal' | 'cashout';
    hitMine?: boolean;
    explodedMine?: number;
    foundGem?: number;
    multiplier: number;
    currentWin?: number;
  };
}

export function MinesGame() {
  const { user } = useAuth();
  const { currency: currentCurrency, getCurrencySymbol, formatAmount } = useCurrency();
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [betAmount, setBetAmount] = useState("1.00");
  const [mineCount, setMineCount] = useState([3]); // Default 3 mines
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [grid, setGrid] = useState<Array<{
    position: number;
    isMine: boolean;
    isRevealed: boolean;
    isGem: boolean;
  }>>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [currentWin, setCurrentWin] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [explodedMine, setExplodedMine] = useState<number | null>(null);
  
  // Initialize empty 5x5 grid
  useEffect(() => {
    if (!gameStarted) {
      const emptyGrid = Array(25).fill(0).map((_, index) => ({
        position: index,
        isMine: false,
        isRevealed: false,
        isGem: false
      }));
      setGrid(emptyGrid);
    }
  }, [gameStarted]);

  const formatBetAmount = (value: number): string => {
    return value.toFixed(2);
  };

  const handleBetAmountChange = (value: string) => {
    if (value === '') {
      setBetAmount('');
      return;
    }
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setBetAmount(value);
    }
  };

  const handleHalfBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(currentBet / 2));
  };
  
  const handleDoubleBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    setBetAmount(formatBetAmount(currentBet * 2));
  };

  // Calculate potential multiplier for next gem
  const calculateNextMultiplier = () => {
    const gemsFound = selectedTiles.length;
    const safeTiles = 25 - mineCount[0];
    
    if (gemsFound === 0) return 1.0;
    
    let multiplier = 1.0;
    for (let i = 0; i < gemsFound + 1; i++) {
      const remainingSafeTiles = safeTiles - i;
      const remainingTiles = 25 - i;
      const probability = remainingSafeTiles / remainingTiles;
      multiplier /= probability;
    }
    
    // Apply 99% RTP
    multiplier *= 0.99;
    return Math.round(multiplier * 100) / 100;
  };

  const nextMultiplier = calculateNextMultiplier();
  const possibleWin = parseFloat(betAmount || "0") * nextMultiplier;

  // Start new game
  const startGameMutation = useMutation({
    mutationFn: async () => {
      setGameStarted(true);
      setSelectedTiles([]);
      setGameOver(false);
      setExplodedMine(null);
      setCurrentMultiplier(1.0);
      setCurrentWin(0);
      
      // Initialize grid for display
      const emptyGrid = Array(25).fill(0).map((_, index) => ({
        position: index,
        isMine: false,
        isRevealed: false,
        isGem: false
      }));
      setGrid(emptyGrid);
    },
    onSuccess: () => {
      toast({
        title: "Game Started!",
        description: `Started new game with ${mineCount[0]} mines`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    }
  });

  // Reveal tile
  const revealTileMutation = useMutation({
    mutationFn: async (tilePosition: number) => {
      const newSelectedTiles = [...selectedTiles, tilePosition];
      
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: "MINES",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        mineCount: mineCount[0],
        selectedTiles: newSelectedTiles,
        action: "reveal",
        clientSeed: "default",
        nonce: 1
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      setGrid(data.gameData.grid);
      setSelectedTiles(prev => [...prev, data.gameData.foundGem || data.gameData.explodedMine || 0]);
      setCurrentMultiplier(data.gameData.multiplier);
      setCurrentWin(data.gameData.currentWin || 0);
      
      if (data.gameData.hitMine) {
        setGameOver(true);
        setExplodedMine(data.gameData.explodedMine || null);
        setGameStarted(false);
        toast({
          title: "💣 Boom!",
          description: `You hit a mine! Game over.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "💎 Gem Found!",
          description: `Multiplier: ${data.gameData.multiplier}x`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reveal tile",
        variant: "destructive",
      });
    }
  });

  // Cash out
  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: "MINES",
        betAmount: parseFloat(betAmount),
        currency: currentCurrency,
        mineCount: mineCount[0],
        selectedTiles: selectedTiles,
        action: "cashout",
        clientSeed: "default",
        nonce: 1
      });
      return res.json() as Promise<GameResult>;
    },
    onSuccess: (data) => {
      setGrid(data.gameData.grid);
      setGameStarted(false);
      setGameOver(true);
      
      toast({
        title: "🎉 Cashed Out!",
        description: `Won ${currencySymbol}${formatAmount(data.winAmount, currentCurrency)} with ${data.multiplier}x multiplier!`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cash out",
        variant: "destructive",
      });
    }
  });

  const handleTileClick = (position: number) => {
    if (!gameStarted || gameOver || selectedTiles.includes(position) || revealTileMutation.isPending) {
      return;
    }
    
    revealTileMutation.mutate(position);
  };

  const getTileContent = (tile: any) => {
    if (!tile.isRevealed) {
      return null;
    }
    
    if (tile.isMine) {
      return <Bomb className="w-6 h-6 text-red-500" />;
    } else {
      return <Gem className="w-6 h-6 text-green-500" />;
    }
  };

  const getTileClassName = (tile: any, position: number) => {
    let baseClass = "w-16 h-16 border-2 border-neutral-600 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ";
    
    if (!gameStarted) {
      baseClass += "bg-neutral-700 hover:bg-neutral-600 ";
    } else if (gameOver && tile.isMine) {
      baseClass += "bg-red-600 border-red-500 ";
    } else if (tile.isRevealed && tile.isGem) {
      baseClass += "bg-green-600 border-green-500 ";
    } else if (tile.isRevealed) {
      baseClass += "bg-neutral-600 ";
    } else if (selectedTiles.includes(position)) {
      baseClass += "bg-blue-600 border-blue-500 ";
    } else {
      baseClass += "bg-neutral-700 hover:bg-neutral-600 ";
    }
    
    if (explodedMine === position) {
      baseClass += "animate-pulse bg-red-700 ";
    }
    
    return baseClass;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Bet Controls */}
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bet Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Bet Amount</label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleHalfBet}
                disabled={gameStarted}
                className="px-2"
              >
                ½
              </Button>
              <div className="flex-1">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => handleBetAmountChange(e.target.value)}
                  disabled={gameStarted}
                  className="text-center bg-neutral-700 border-neutral-600"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDoubleBet}
                disabled={gameStarted}
                className="px-2"
              >
                2×
              </Button>
            </div>
          </div>

          {/* Mine Count */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-neutral-400">Mines</label>
              <span className="text-sm text-white">{mineCount[0]}</span>
            </div>
            <Slider
              value={mineCount}
              onValueChange={setMineCount}
              min={1}
              max={24}
              step={1}
              disabled={gameStarted}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>1</span>
              <span>12</span>
              <span>24</span>
            </div>
          </div>

          {/* Game Info */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-400">Game Stats</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Gems Found:</span>
                <span className="text-white">{selectedTiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Current Win:</span>
                <span className="text-green-400">{currencySymbol}{formatAmount(currentWin, currentCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Next at:</span>
                <span className="text-yellow-400">{nextMultiplier.toFixed(2)}x</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Game Grid */}
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Mines Field</h3>
          <p className="text-sm text-neutral-400">
            {gameStarted ? `Find gems while avoiding ${mineCount[0]} mines` : "Start a game to begin"}
          </p>
        </div>

        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto mb-6">
          {grid.map((tile, index) => (
            <motion.button
              key={index}
              className={getTileClassName(tile, index)}
              onClick={() => handleTileClick(index)}
              disabled={!gameStarted || gameOver || selectedTiles.includes(index)}
              whileHover={gameStarted && !gameOver && !selectedTiles.includes(index) ? { scale: 1.05 } : {}}
              whileTap={gameStarted && !gameOver && !selectedTiles.includes(index) ? { scale: 0.95 } : {}}
            >
              {getTileContent(tile)}
            </motion.button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {!gameStarted ? (
            <Button
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={() => startGameMutation.mutate()}
              disabled={startGameMutation.isPending || !parseFloat(betAmount)}
            >
              {startGameMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Start Game
            </Button>
          ) : (
            <Button
              className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
              onClick={() => cashOutMutation.mutate()}
              disabled={cashOutMutation.isPending || selectedTiles.length === 0}
            >
              {cashOutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Cash Out ({currencySymbol}{formatAmount(currentWin, currentCurrency)})
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}