import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { 
  allThemes, 
  getThemesByCategory, 
  getThemesByMood, 
  getPopularThemes, 

  getTimeBasedTheme,
  searchThemes,
  Theme
} from '@/lib/themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Star,
  Clock,
  Palette,
  Sparkles,
  Heart,
  Timer,
  Gamepad2,
  Wand2,
  Crown,
  Zap,
  Moon,
  Sun,
  Sunset,
  Sunrise
} from 'lucide-react';
import { AuroraBackground, GradientText, MysticGlow } from './mystic-effects';

interface AdvancedThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedThemeSelector({ isOpen, onClose }: AdvancedThemeSelectorProps) {
  const { currentTheme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoThemeEnabled, setAutoThemeEnabled] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedFavorites = localStorage.getItem('theme-favorites');
    const savedAutoTheme = localStorage.getItem('auto-theme-enabled');
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    if (savedAutoTheme) {
      setAutoThemeEnabled(JSON.parse(savedAutoTheme));
    }
  }, []);

  // Auto theme scheduler
  useEffect(() => {
    if (!autoThemeEnabled) return;

    const checkTimeBasedTheme = () => {
      const recommendedTheme = getTimeBasedTheme();
      if (recommendedTheme.id !== currentTheme.id) {
        setTheme(recommendedTheme.id);
      }
    };

    checkTimeBasedTheme();
    const interval = setInterval(checkTimeBasedTheme, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoThemeEnabled, currentTheme.id, setTheme]);

  const filteredThemes = React.useMemo(() => {
    let themes = allThemes;

    // Search filter
    if (searchQuery) {
      themes = searchThemes(searchQuery);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        themes = themes.filter(theme => favorites.includes(theme.id));
      } else if (selectedCategory === 'popular') {
        themes = getPopularThemes();

      } else {
        themes = getThemesByCategory(selectedCategory as Theme['category']);
      }
    }

    return themes;
  }, [searchQuery, selectedCategory, favorites]);

  const toggleFavorite = (themeId: string) => {
    const newFavorites = favorites.includes(themeId)
      ? favorites.filter(id => id !== themeId)
      : [...favorites, themeId];
    
    setFavorites(newFavorites);
    localStorage.setItem('theme-favorites', JSON.stringify(newFavorites));
  };

  const toggleAutoTheme = (enabled: boolean) => {
    setAutoThemeEnabled(enabled);
    localStorage.setItem('auto-theme-enabled', JSON.stringify(enabled));
  };

  const applyTimeBasedTheme = () => {
    const recommendedTheme = getTimeBasedTheme();
    setTheme(recommendedTheme.id);
  };

  const ThemeCard = ({ theme }: { theme: Theme }) => {
    const isActive = currentTheme.id === theme.id;
    const isFavorite = favorites.includes(theme.id);
    const isPreview = previewTheme?.id === theme.id;

    return (
      <Card 
        className={`group cursor-pointer card-enhanced transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 ${
          isActive ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border/50'
        } ${isPreview ? 'ring-2 ring-accent/50 shadow-lg' : ''} hover:bg-card/80`}
        onClick={() => {
          setTheme(theme.id);
          onClose();
        }}
        onMouseEnter={() => setPreviewTheme(theme)}
        onMouseLeave={() => setPreviewTheme(null)}
      >
        <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 truncate">
                {theme.name}

              </CardTitle>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: theme.popularity }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(theme.id);
              }}
              aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
            >
              <Heart className={`w-3 h-3 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'hover:text-red-400'}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3 sm:px-4 sm:pb-4">
          <CardDescription className="text-xs mb-3 line-clamp-2">{theme.description}</CardDescription>
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="text-xs px-2 py-0.5">{theme.category}</Badge>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">{theme.mood}</Badge>
          </div>
          
          {/* Color Preview */}
          <div className="grid grid-cols-6 gap-1 h-6 rounded overflow-hidden shadow-inner">
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.primary }} />
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.secondary }} />
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.accent }} />
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.background }} />
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.card }} />
            <div className="bg-current transition-all hover:scale-110" style={{ color: theme.colors.text }} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <AuroraBackground>
        <Card className="w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-slideUp bg-card/95 backdrop-blur-xl border-primary/20">
          <CardHeader className="border-b border-primary/20 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MysticGlow intensity="medium">
                  <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </MysticGlow>
                <GradientText gradient="mystic">
                  <CardTitle className="text-lg sm:text-2xl">Advanced Theme Center</CardTitle>
                </GradientText>
              </div>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="h-8 w-8 sm:h-10 sm:w-10 text-lg hover:bg-muted/50 transition-colors"
              aria-label="Close theme selector"
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <div className="flex flex-col lg:flex-row h-[calc(95vh-80px)] sm:h-[calc(90vh-100px)]">
          {/* Sidebar */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-muted/30 p-3 sm:p-4">
            <ScrollArea className="h-48 lg:h-full">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 placeholder:text-muted-foreground/70 placeholder:opacity-100 focus:placeholder:opacity-50 transition-all"
                />
              </div>

              {/* Auto Theme */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="auto-theme"
                    checked={autoThemeEnabled}
                    onCheckedChange={toggleAutoTheme}
                  />
                  <Label htmlFor="auto-theme" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Auto Theme
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Automatically change themes based on time of day
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={applyTimeBasedTheme}
                  className="w-full"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Apply Time-Based Theme
                </Button>
              </div>

              <Separator className="mb-4" />

              {/* Quick Actions */}
              <div className="space-y-2 mb-6">
                <h3 className="font-semibold text-sm">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTheme(getTimeBasedTheme().id)}
                  >
                    <Sunrise className="w-4 h-4 mr-1" />
                    Time
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory('popular')}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Popular
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory('premium')}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Premium
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory('favorites')}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Favorites
                  </Button>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Categories</h3>
                <div className="space-y-1">
                  {['all', 'dark', 'vibrant', 'elegant', 'neon', 'nature'].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="w-full justify-start"
                    >
                      {category === 'all' && <Palette className="w-4 h-4 mr-2" />}
                      {category === 'dark' && <Moon className="w-4 h-4 mr-2" />}
                      {category === 'vibrant' && <Zap className="w-4 h-4 mr-2" />}
                      {category === 'elegant' && <Sparkles className="w-4 h-4 mr-2" />}
                      {category === 'neon' && <Wand2 className="w-4 h-4 mr-2" />}
                      {category === 'nature' && <Sun className="w-4 h-4 mr-2" />}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-6">
            <ScrollArea className="h-full">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  {selectedCategory === 'all' ? 'All Themes' : 
                   selectedCategory === 'favorites' ? 'Your Favorites' :
                   selectedCategory === 'popular' ? 'Popular Themes' :
                   selectedCategory === 'premium' ? 'Premium Themes' :
                   `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Themes`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredThemes.length} theme{filteredThemes.length !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 responsive-grid">
                {filteredThemes.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>

              {filteredThemes.length === 0 && (
                <div className="text-center py-12">
                  <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No themes found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or category filters
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        </Card>
      </AuroraBackground>
    </div>
  );
}