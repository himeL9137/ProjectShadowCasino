import { useState } from "react";
import CasinoHeader from "@/components/casino/header";
import CasinoSidebar from "@/components/casino/sidebar";
import FeaturedGames from "@/components/casino/featured-games";
import GamesGrid from "@/components/casino/games-grid";
import StatsSection from "@/components/casino/stats-section";
import GameModal from "@/components/casino/game-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function CasinoPage() {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filter, setFilter] = useState("all");

  const handleGameSelect = (game: any) => {
    setSelectedGame(game);
  };

  const handleCloseGame = () => {
    setSelectedGame(null);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-casino-dark text-white">
      <CasinoHeader />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <CasinoSidebar 
            selectedCategory={selectedCategory} 
            onCategoryChange={handleCategoryChange} 
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed bottom-4 right-4 bg-casino-green text-black hover:bg-casino-green/90 shadow-neon-green z-40"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-casino-darker border-gray-800 p-0">
            <CasinoSidebar 
              selectedCategory={selectedCategory} 
              onCategoryChange={handleCategoryChange} 
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Casino Games</h1>
                <p className="text-gray-400">Choose from over 100 exciting games</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-casino-gray border-gray-700 w-64 pl-10 focus:border-casino-green"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Filter */}
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="bg-casino-gray border-gray-700 w-32 focus:border-casino-green">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-casino-gray border-gray-700">
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="high-rtp">High RTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <FeaturedGames onGameSelect={handleGameSelect} />
          <GamesGrid 
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            filter={filter}
            onGameSelect={handleGameSelect}
          />
          <StatsSection />
        </main>
      </div>

      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={handleCloseGame} 
        />
      )}
    </div>
  );
}
