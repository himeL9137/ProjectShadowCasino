import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatGameType } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Winner {
  id: number;
  username: string;
  gameType: string;
  betAmount: string;
  winAmount: string;
  multiplier: number;
  currency: string;
  createdAt: string;
}

export function WinnersList() {
  const { data: winners, isLoading, error } = useQuery<Winner[]>({
    queryKey: ["/api/games/winners"],
  });

  if (isLoading) {
    return (
      <div className="bg-background-light rounded-xl overflow-hidden">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Game</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bet</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Win</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light rounded-xl overflow-hidden p-8 text-center">
        <p className="text-destructive">Error loading winners: {error.message}</p>
      </div>
    );
  }

  if (!winners || winners.length === 0) {
    return (
      <div className="bg-background-light rounded-xl overflow-hidden p-8 text-center">
        <p className="text-gray-400">No recent winners yet. Be the first to win!</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Game</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Bet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Win</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((winner) => (
                <tr key={winner.id} className="border-b border-gray-800">
                  <td className="px-4 py-3 text-white">{winner.username}</td>
                  <td className="px-4 py-3 text-white">{formatGameType(winner.gameType)}</td>
                  <td className="px-4 py-3 text-white">{formatCurrency(winner.betAmount, winner.currency)}</td>
                  <td className="px-4 py-3 text-win">{formatCurrency(winner.winAmount, winner.currency)}</td>
                  <td className="px-4 py-3 text-accent-gold">{winner.multiplier}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
