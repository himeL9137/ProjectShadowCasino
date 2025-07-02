import { useQuery } from "@tanstack/react-query";
import GameCard from "./game-card";
import { Star } from "lucide-react";
import type { Game } from "@shared/schema";

interface FeaturedGamesProps {
  onGameSelect: (game: Game) => void;
}

export default function FeaturedGames({ onGameSelect }: FeaturedGamesProps) {
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/featured"],
  });

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="text-casino-gold mr-2 h-5 w-5" />
          Featured Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-casino-gray rounded-xl p-6 animate-pulse">
              <div className="w-full h-40 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-4 w-2/3"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Star className="text-casino-gold mr-2 h-5 w-5" />
        Featured Games
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games?.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => onGameSelect(game)}
            size="large"
          />
        ))}
      </div>
    </section>
  );
}
