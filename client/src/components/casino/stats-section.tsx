import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import type { UserStats } from "@shared/schema";

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  if (isLoading) {
    return (
      <section className="bg-casino-darker rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <TrendingUp className="text-casino-purple mr-2 h-5 w-5" />
          Your Gaming Stats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-casino-darker rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <TrendingUp className="text-casino-purple mr-2 h-5 w-5" />
        Your Gaming Stats
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-casino-green">
            {stats?.totalBets?.toLocaleString() || "0"}
          </div>
          <div className="text-gray-400 text-sm">Total Bets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-casino-purple">
            {stats?.totalWins?.toLocaleString() || "0"}
          </div>
          <div className="text-gray-400 text-sm">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-casino-gold">
            ${stats?.biggestWin ? parseFloat(stats.biggestWin).toLocaleString('en-US', { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <div className="text-gray-400 text-sm">Biggest Win</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {stats?.favoriteGame || "None"}
          </div>
          <div className="text-gray-400 text-sm">Favorite Game</div>
        </div>
      </div>
    </section>
  );
}
