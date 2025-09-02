import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameInstaller } from './GameInstaller';
import { 
  Search, Filter, Upload, Play, Edit, Trash2, Eye, CheckCircle, 
  XCircle, Clock, Download, Settings, Gamepad2, BarChart3,
  FileText, Image as ImageIcon, Code, AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { get, post } from '@/lib/api';

interface Game {
  id: number;
  name: string;
  type: string;
  category: string;
  description?: string;
  instructions?: string;
  tags: string[];
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  isActive: boolean;
  isApproved: boolean;
  installationStatus: string;
  playCount: number;
  thumbnailUrl?: string;
  filePath?: string;
  originalFileName?: string;
  fileExtension?: string;
  createdAt: string;
  createdBy: string;
  errorLog?: string;
}

interface ImprovedGameManagementProps {
  onRefresh?: () => void;
}

export function ImprovedGameManagement({ onRefresh }: ImprovedGameManagementProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [installerOpen, setInstallerOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Games' },
    { value: 'casino', label: 'Casino' },
    { value: 'card', label: 'Card Games' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'arcade', label: 'Arcade' },
    { value: 'strategy', label: 'Strategy' },
    { value: 'action', label: 'Action' }
  ];

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await get('/api/admin/games');
      // Ensure response is an array
      setGames(Array.isArray(response) ? response : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch games",
        variant: "destructive"
      });
      setGames([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchGames();
      return;
    }
    
    try {
      const response = await get(`/api/admin/games/search?q=${encodeURIComponent(searchQuery)}`);
      setGames(response);
    } catch (error: any) {
      toast({
        title: "Search error",
        description: "Failed to search games",
        variant: "destructive"
      });
    }
  };

  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      fetchGames();
      return;
    }
    
    try {
      const response = await get(`/api/admin/games/category/${category}`);
      setGames(response);
    } catch (error: any) {
      toast({
        title: "Filter error",
        description: "Failed to filter games",
        variant: "destructive"
      });
    }
  };

  const handleApproveGame = async (gameId: number) => {
    try {
      await post(`/api/admin/games/${gameId}/approve`, {});
      toast({
        title: "Game approved",
        description: "Game has been approved and is now available",
      });
      fetchGames();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve game",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGame = async (gameId: number, gameName: string) => {
    if (!confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }
      
      toast({
        title: "Game deleted",
        description: `${gameName} has been removed`,
      });
      fetchGames();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete game",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string, isApproved: boolean) => {
    if (!isApproved) return <Clock className="h-4 w-4 text-yellow-500" />;
    
    switch (status) {
      case 'installed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getFileTypeIcon = (fileExtension: string) => {
    if (!fileExtension) return <FileText className="h-4 w-4" />;
    
    const ext = fileExtension.toLowerCase();
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      return <Code className="h-4 w-4" />;
    }
    if (['.html', '.htm'].includes(ext)) {
      return <FileText className="h-4 w-4" />;
    }
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const filteredGames = games.filter(game => {
    if (selectedCategory !== 'all' && game.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        game.name.toLowerCase().includes(query) ||
        (game.description && game.description.toLowerCase().includes(query)) ||
        game.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Game Management</h2>
          <p className="text-gray-600">Install and manage casino games</p>
        </div>
        
        <Dialog open={installerOpen} onOpenChange={setInstallerOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Install New Game
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-5xl max-h-[90vh] overflow-y-auto"
            preventOutsideClose={true}
          >
            <DialogHeader>
              <DialogTitle>Install New Game</DialogTitle>
            </DialogHeader>
            <GameInstaller 
              onGameInstalled={() => {
                setInstallerOpen(false);
                fetchGames();
                if (onRefresh) onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search games, descriptions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Gamepad2 className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Games</p>
                <p className="text-2xl font-bold">{games.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{games.filter(g => g.isApproved).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{games.filter(g => !g.isApproved).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Plays</p>
                <p className="text-2xl font-bold">{games.reduce((sum, g) => sum + g.playCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Installed Games</CardTitle>
          <CardDescription>
            Manage all games in your casino platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading games...</span>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No games found</p>
              <p className="text-sm">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Click "Install New Game" to add your first game'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Settings</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGames.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {game.thumbnailUrl ? (
                              <img 
                                src={game.thumbnailUrl} 
                                alt={game.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                {getFileTypeIcon(game.fileExtension || '')}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{game.name}</p>
                              {game.originalFileName && (
                                <p className="text-xs text-gray-500">{game.originalFileName}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">
                            {game.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="secondary">
                            {game.category}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(game.installationStatus, game.isApproved)}
                            <div>
                              <p className="text-sm font-medium">
                                {game.isApproved ? 'Approved' : 'Pending Approval'}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {game.installationStatus}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <p>{game.winChance}% win</p>
                            <p>{game.maxMultiplier}x max</p>
                            <p className="text-xs text-gray-500">
                              {game.minBet}-{game.maxBet}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{game.playCount}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm text-gray-500">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {game.isApproved && game.installationStatus === 'installed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/games/${game.id}`, '_blank')}
                                title="Play game"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedGame(game);
                                setPreviewOpen(true);
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {!game.isApproved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveGame(game.id)}
                                title="Approve game"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGame(game.id, game.name)}
                              title="Delete game"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Details Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          preventOutsideClose={true}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {selectedGame?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGame && (
            <div className="space-y-6">
              {/* Game Header */}
              <div className="flex items-start gap-4">
                {selectedGame.thumbnailUrl ? (
                  <img 
                    src={selectedGame.thumbnailUrl} 
                    alt={selectedGame.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                    {getFileTypeIcon(selectedGame.fileExtension || '')}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{selectedGame.name}</h3>
                    {getStatusIcon(selectedGame.installationStatus, selectedGame.isApproved)}
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline">{selectedGame.type.toUpperCase()}</Badge>
                    <Badge variant="secondary">{selectedGame.category}</Badge>
                    {selectedGame.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  
                  {selectedGame.description && (
                    <p className="text-gray-600">{selectedGame.description}</p>
                  )}
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Win Chance</p>
                  <p className="text-lg font-bold">{selectedGame.winChance}%</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Max Multiplier</p>
                  <p className="text-lg font-bold">{selectedGame.maxMultiplier}x</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Bet Range</p>
                  <p className="text-lg font-bold">{selectedGame.minBet}-{selectedGame.maxBet}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Play Count</p>
                  <p className="text-lg font-bold">{selectedGame.playCount}</p>
                </div>
              </div>

              {/* Instructions */}
              {selectedGame.instructions && (
                <div>
                  <h4 className="font-medium mb-2">How to Play</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedGame.instructions}</p>
                  </div>
                </div>
              )}

              {/* Error Log */}
              {selectedGame.errorLog && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Installation Errors
                  </h4>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <pre className="text-sm text-red-700 whitespace-pre-wrap">{selectedGame.errorLog}</pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedGame.isApproved && selectedGame.installationStatus === 'installed' && (
                  <Button
                    onClick={() => window.open(`/games/${selectedGame.id}`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Test Game
                  </Button>
                )}
                
                {!selectedGame.isApproved && (
                  <Button
                    onClick={() => {
                      handleApproveGame(selectedGame.id);
                      setPreviewOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Game
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteGame(selectedGame.id, selectedGame.name);
                    setPreviewOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Game
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}