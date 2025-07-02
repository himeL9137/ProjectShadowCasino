import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp, Medal, Award, Clock, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/game-utils";

interface Winner {
  id: number;
  userId: number;
  username: string;
  gameType: string;
  betAmount: string;
  winAmount: string;
  multiplier: number;
  currency: string;
  isWin: boolean;
  createdAt: string;
}

export default function LeaderboardPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchWinners() {
      try {
        const response = await fetch('/api/games/winners?limit=20');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        setWinners(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWinners();
    // Refresh winners every 60 seconds
    const interval = setInterval(() => {
      fetchWinners();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [toast]);
  
  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'slots':
        return '🎰';
      case 'dice':
        return '🎲';
      case 'plinko':
        return '⚾';
      case 'crash':
        return '📈';
      default:
        return '🎮';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-lg animate-fadeIn">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Medal className="h-5 w-5 text-yellow-400 mr-2" />
            Recent Winners
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No winners yet. Be the first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-gray-400">
                    <th className="pb-3 pl-2">Rank</th>
                    <th className="pb-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Player
                      </div>
                    </th>
                    <th className="pb-3">
                      <div className="flex items-center">
                        Game
                      </div>
                    </th>
                    <th className="pb-3">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Win Amount
                      </div>
                    </th>
                    <th className="pb-3">
                      <div className="flex items-center">
                        Multiplier
                      </div>
                    </th>
                    <th className="pb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        When
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((winner, index) => (
                    <tr 
                      key={winner.id} 
                      className="border-b border-border hover:bg-background-light transition-colors cursor-pointer"
                    >
                      <td className="py-3 pl-2">
                        {index === 0 ? (
                          <span className="flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full text-black font-bold">1</span>
                        ) : index === 1 ? (
                          <span className="flex items-center justify-center w-6 h-6 bg-gray-400 rounded-full text-black font-bold">2</span>
                        ) : index === 2 ? (
                          <span className="flex items-center justify-center w-6 h-6 bg-amber-700 rounded-full text-black font-bold">3</span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="py-3 font-medium">{winner.username}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getGameIcon(winner.gameType)}</span>
                          <span className="capitalize">{winner.gameType}</span>
                        </div>
                      </td>
                      <td className="py-3 text-green-500 font-medium">
                        {formatCurrency(parseFloat(winner.winAmount), winner.currency)}
                      </td>
                      <td className="py-3">
                        {winner.multiplier}x
                      </td>
                      <td className="py-3 text-gray-400">
                        {formatDate(winner.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-background rounded-lg border border-border">
          <h3 className="text-sm font-medium mb-2 text-gray-400">ABOUT THE LEADERBOARD</h3>
          <p className="text-sm text-gray-400">
            The leaderboard shows the most recent big winners from all casino games.
            Win big to get your name on the leaderboard!
          </p>
        </div>
      </div>
    </MainLayout>
  );
}