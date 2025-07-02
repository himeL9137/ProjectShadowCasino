import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Game, User, UserStats } from "@shared/schema";

export function useCasino() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameSession, setGameSession] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: featuredGames } = useQuery<Game[]>({
    queryKey: ["/api/games/featured"],
  });

  // Mutations
  const playGameMutation = useMutation({
    mutationFn: async ({ gameId, betAmount }: { gameId: number; betAmount: number }) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/play`, {
        betAmount: betAmount.toString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGameSession(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });

      if (data.isWin) {
        toast({
          title: "🎉 Congratulations!",
          description: `You won $${data.winAmount} with a ${data.multiplier}x multiplier!`,
          className: "bg-casino-green text-black",
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: "Don't give up - your next win could be huge!",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message || "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Game management
  const selectGame = useCallback((game: Game) => {
    setSelectedGame(game);
    setGameSession(null);
  }, []);

  const closeGame = useCallback(() => {
    setSelectedGame(null);
    setGameSession(null);
  }, []);

  const playGame = useCallback((betAmount: number) => {
    if (!selectedGame) return;
    
    playGameMutation.mutate({
      gameId: selectedGame.id,
      betAmount,
    });
  }, [selectedGame, playGameMutation]);

  // Search and filter
  const searchGames = useCallback(async (query: string) => {
    if (!query.trim()) return games || [];
    
    try {
      const response = await apiRequest("GET", `/api/games/search?q=${encodeURIComponent(query)}`);
      return response.json();
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }, [games]);

  const getGamesByCategory = useCallback((category: string) => {
    if (!games) return [];
    if (category === "all") return games;
    return games.filter(game => game.category === category);
  }, [games]);

  return {
    // Data
    user,
    userStats,
    games,
    featuredGames,
    selectedGame,
    gameSession,
    
    // Loading states
    userLoading,
    statsLoading,
    gamesLoading,
    isPlaying: playGameMutation.isPending,
    
    // Actions
    selectGame,
    closeGame,
    playGame,
    searchGames,
    getGamesByCategory,
  };
}
