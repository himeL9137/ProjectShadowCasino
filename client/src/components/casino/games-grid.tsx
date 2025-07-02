import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GameCard from "./game-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface GamesGridProps {
  searchTerm: string;
  selectedCategory: string;
  filter: string;
  onGameSelect: (game: Game) => void;
}

const categoryTabs = [
  { id: "all", label: "All Games" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Table Games" },
  { id: "live", label: "Live Casino" },
];

export default function GamesGrid({ searchTerm, selectedCategory, filter, onGameSelect }: GamesGridProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [visibleGames, setVisibleGames] = useState(12);

  const { data: allGames, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: searchResults } = useQuery<Game[]>({
    queryKey: ["/api/games/search", { q: searchTerm }],
    enabled: !!searchTerm,
  });

  const getFilteredGames = () => {
    let games = searchTerm && searchResults ? searchResults : allGames || [];

    // Filter by category
    const categoryToUse = selectedCategory !== "all" ? selectedCategory : activeTab;
    if (categoryToUse !== "all") {
      games = games.filter(game => game.category === categoryToUse);
    }

    // Apply additional filters
    switch (filter) {
      case "popular":
        games = games.filter(game => game.isFeatured || game.isHot);
        break;
      case "new":
        // In a real app, you'd filter by creation date
        games = games.slice(0, 5);
        break;
      case "high-rtp":
        games = games.filter(game => game.rtp && parseFloat(game.rtp) > 96);
        break;
    }

    return games.slice(0, visibleGames);
  };

  const filteredGames = getFilteredGames();

  const handleLoadMore = () => {
    setVisibleGames(prev => prev + 12);
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex space-x-1 bg-casino-darker rounded-lg p-1 mb-6">
          {categoryTabs.map((tab) => (
            <div key={tab.id} className="flex-1 py-2 px-4 bg-gray-700 rounded-md animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="bg-casino-gray rounded-lg overflow-hidden animate-pulse">
              <div className="w-full h-32 bg-gray-700"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-700 rounded mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Game Categories Tabs */}
      <div className="flex space-x-1 bg-casino-darker rounded-lg p-1 mb-6">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 px-4 rounded-md font-medium transition-all",
              activeTab === tab.id
                ? "bg-casino-green text-black"
                : "text-gray-400 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => onGameSelect(game)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {allGames && filteredGames.length < allGames.length && (
        <div className="text-center mt-8">
          <Button
            onClick={handleLoadMore}
            variant="secondary"
            className="bg-casino-gray hover:bg-gray-700 px-8 py-3"
          >
            Load More Games
          </Button>
        </div>
      )}

      {filteredGames.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No games found matching your criteria.</p>
        </div>
      )}
    </section>
  );
}
