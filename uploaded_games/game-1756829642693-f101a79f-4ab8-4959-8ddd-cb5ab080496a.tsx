import React, { useState, useEffect } from 'react';
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
          description: `You won ${data.winAmount} ${currentCurrency}!`,
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
                  className={`h-full cursor-pointer transition-all ${
                    card.isFlipped || card.isMatched 
                      ? 'bg-blue-500' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
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
}