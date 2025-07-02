import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@shared/schema";

interface GameModalProps {
  game: Game;
  onClose: () => void;
}

const betAmounts = [10, 25, 100, 500, 1000];

export default function GameModal({ game, onClose }: GameModalProps) {
  const [selectedBet, setSelectedBet] = useState(100);
  const [gameState, setGameState] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const playGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/games/${game.id}/play`, {
        betAmount: selectedBet.toString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGameState(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (data.isWin) {
        toast({
          title: "🎉 You Won!",
          description: `You won $${data.winAmount} with a ${data.multiplier}x multiplier!`,
          className: "bg-casino-green text-black",
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `You lost $${selectedBet}. Try again!`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to play game",
        variant: "destructive",
      });
    },
  });

  const handlePlay = () => {
    playGameMutation.mutate();
  };

  const renderGameInterface = () => {
    if (game.category === "table" || game.category === "live") {
      return (
        <div className="bg-green-800 rounded-xl p-8 mb-6 relative" style={{
          background: "radial-gradient(ellipse at center, #1a7c3a 0%, #0f5d2a 100%)"
        }}>
          {/* Dealer Area */}
          <div className="text-center mb-8">
            <div className="text-white mb-2">Dealer</div>
            <div className="flex justify-center space-x-2 mb-2">
              <div className="w-16 h-24 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                K♥
              </div>
              <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-white shadow-lg">
                ?
              </div>
            </div>
            <div className="text-casino-gold font-semibold">Score: ?</div>
          </div>

          {/* Player Area */}
          <div className="text-center">
            <div className="text-white mb-2">Your Hand</div>
            <div className="flex justify-center space-x-2 mb-2">
              {gameState ? (
                gameState.isWin ? (
                  <>
                    <div className="w-16 h-24 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      A♠
                    </div>
                    <div className="w-16 h-24 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      Q♦
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-24 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      10♥
                    </div>
                    <div className="w-16 h-24 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      7♠
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                    ?
                  </div>
                  <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                    ?
                  </div>
                </>
              )}
            </div>
            <div className="text-casino-gold font-semibold text-xl">
              {gameState ? (
                gameState.isWin ? "Blackjack! 21" : "Bust! 27"
              ) : "Ready to play"}
            </div>
          </div>

          {/* Betting Area */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-casino-gold rounded-full w-16 h-16 flex items-center justify-center text-black font-bold shadow-neon-gold">
              ${selectedBet}
            </div>
          </div>
        </div>
      );
    }

    // Slot machine interface
    return (
      <div className="bg-casino-gray rounded-xl p-8 mb-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="aspect-square bg-casino-darker rounded-lg flex items-center justify-center text-2xl"
            >
              {gameState && i < 5 ? (
                gameState.isWin ? ["🍒", "🍒", "🍒", "🔔", "💎"][i] : ["🍒", "🍋", "🍊", "🍇", "⭐"][i]
              ) : "🎰"}
            </div>
          ))}
        </div>
        {gameState && (
          <div className="text-center">
            <div className="text-2xl font-bold text-casino-gold mb-2">
              {gameState.isWin ? `WIN! ${gameState.multiplier}x` : "NO WIN"}
            </div>
            <div className="text-lg">
              {gameState.isWin ? `You won $${gameState.winAmount}!` : "Try again!"}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-casino-darker border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <DialogTitle className="text-xl font-bold">{game.name}</DialogTitle>
            {game.isLive && <Badge className="bg-casino-green text-black">LIVE</Badge>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="p-2">
          {renderGameInterface()}

          {/* Game Controls */}
          {game.category === "table" || game.category === "live" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Button className="bg-casino-green hover:bg-casino-green/90 text-black font-semibold shadow-neon-green">
                Hit
              </Button>
              <Button className="bg-casino-purple hover:bg-casino-purple/90 text-white font-semibold shadow-neon-purple">
                Stand
              </Button>
              <Button className="bg-casino-gold hover:bg-casino-gold/90 text-black font-semibold shadow-neon-gold">
                Double
              </Button>
              <Button variant="secondary" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold">
                Split
              </Button>
            </div>
          ) : null}

          {/* Betting Controls */}
          <div className="bg-casino-gray rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Bet Amount</span>
              <span className="text-casino-green font-semibold">${selectedBet}</span>
            </div>
            <div className="flex space-x-2 mb-4">
              {betAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedBet === amount ? "default" : "secondary"}
                  className={`flex-1 py-2 text-sm transition-all ${
                    selectedBet === amount
                      ? "bg-casino-green text-black hover:bg-casino-green/90 font-semibold"
                      : "bg-casino-darker hover:bg-gray-600"
                  }`}
                  onClick={() => setSelectedBet(amount)}
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <Button
              onClick={handlePlay}
              disabled={playGameMutation.isPending}
              className="w-full bg-gradient-to-r from-casino-green to-green-400 text-black font-semibold py-3 hover:shadow-neon-green"
            >
              {playGameMutation.isPending ? "Playing..." : 
               game.category === "slots" ? "Spin" : "Deal New Hand"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
