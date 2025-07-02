import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Gamepad2 } from 'lucide-react';
import { get } from '@/lib/api';

interface CustomGame {
  id: number;
  name: string;
  type: string;
  htmlContent: string;
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
}

// Game Card Component
function GameCard({ game }: { game: CustomGame }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">{game.name}</CardTitle>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {game.type.toUpperCase()}
          </span>
        </div>
        {game.description && (
          <CardDescription>{game.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Win Chance:</span>
            <span className="font-semibold">{game.winChance}%</span>
          </div>
          <div className="flex justify-between">
            <span>Max Multiplier:</span>
            <span className="font-semibold">{game.maxMultiplier}x</span>
          </div>
          <div className="flex justify-between">
            <span>Bet Range:</span>
            <span className="font-semibold">{game.minBet} - {game.maxBet}</span>
          </div>
        </div>
        
        <Link
          href={`/html-game/${game.id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-block text-center"
        >
          Play Game
        </Link>
      </CardContent>
    </Card>
  );
}

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGames, setFilteredGames] = useState<CustomGame[]>([]);

  // Fetch custom games
  const { data: customGames = [], isLoading, error } = useQuery<CustomGame[]>({
    queryKey: ['/api/games'],
  });

  // Default games data (existing games like Slots, Dice, Plinko)
  const defaultGames = [
    {
      id: -1,
      name: 'Slots',
      type: 'slots',
      description: 'Classic slot machine game with multiple paylines',
      path: '/slots'
    },
    {
      id: -2,
      name: 'Dice',
      type: 'dice',
      description: 'Roll the dice and predict the outcome',
      path: '/dice'
    },
    {
      id: -3,
      name: 'Plinko',
      type: 'plinko',
      description: 'Drop the ball and watch it bounce to victory',
      path: '/plinko'
    }
  ];

  // Filter games based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredGames(customGames);
    } else {
      const filtered = customGames.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredGames(filtered);
    }
  }, [customGames, searchTerm]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading games...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Error loading games</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Games</h1>
          <p className="text-gray-600 mb-6">Discover and play all available games on Shadow Casino</p>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Default Games Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultGames.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Gamepad2 className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                  </div>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={game.path}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-block text-center"
                  >
                    Play {game.name}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Games Section */}
        {customGames.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Custom Games ({filteredGames.length})
            </h2>
            
            {filteredGames.length === 0 && searchTerm ? (
              <div className="text-center py-12">
                <Gamepad2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </div>
        )}

        {customGames.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom games yet</h3>
            <p className="text-gray-600">Custom games added by admins will appear here</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}