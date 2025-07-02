import React, { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { AdvancedThemeSelector } from '@/components/ui/advanced-theme-selector';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Palette, 
  Sparkles, 
  Star, 
  Crown, 
  Heart,
  Timer,
  Gamepad2,
  ChevronDown
} from 'lucide-react';
import { getPopularThemes, getTimeBasedTheme, getGameRecommendedTheme } from '@/lib/themes';

interface ThemeToggleProps {
  showAdvanced?: boolean;
  gameContext?: 'slots' | 'dice' | 'plinko';
}

export function ThemeToggle({ showAdvanced = true, gameContext }: ThemeToggleProps) {
  const { currentTheme, setTheme } = useTheme();
  const [showAdvancedSelector, setShowAdvancedSelector] = useState(false);

  const popularThemes = getPopularThemes().slice(0, 5);

  const handleQuickThemeChange = (themeId: string) => {
    setTheme(themeId);
  };

  const handleTimeBasedTheme = () => {
    const timeTheme = getTimeBasedTheme();
    setTheme(timeTheme.id);
  };

  const handleGameTheme = () => {
    if (gameContext) {
      const gameTheme = getGameRecommendedTheme(gameContext);
      setTheme(gameTheme.id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 relative overflow-hidden group"
            style={{
              background: currentTheme.gradients.primary,
              borderColor: currentTheme.colors.primary,
              color: 'white'
            }}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{currentTheme.name}</span>
            <ChevronDown className="w-3 h-3" />
            
            {/* Animated background effect */}
            <div 
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: currentTheme.gradients.card }}
            />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Theme Selection
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick Actions */}
          <DropdownMenuItem onClick={handleTimeBasedTheme} className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Time-Based Theme
          </DropdownMenuItem>
          
          {gameContext && (
            <DropdownMenuItem onClick={handleGameTheme} className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              {`${gameContext.charAt(0).toUpperCase() + gameContext.slice(1)} Theme`}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Popular Themes */}
          <DropdownMenuLabel className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Popular
          </DropdownMenuLabel>
          {popularThemes.map((theme) => (
            <DropdownMenuItem 
              key={theme.id}
              onClick={() => handleQuickThemeChange(theme.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span>{theme.name}</span>
              </div>
              {currentTheme.id === theme.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Advanced Selector */}
          {showAdvanced && (
            <DropdownMenuItem 
              onClick={() => setShowAdvancedSelector(true)}
              className="flex items-center gap-2 text-primary"
            >
              <Sparkles className="w-4 h-4" />
              Advanced Theme Center
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Theme Selector Modal */}
      <AdvancedThemeSelector 
        isOpen={showAdvancedSelector}
        onClose={() => setShowAdvancedSelector(false)}
      />
    </>
  );
}

// Quick theme button for mobile/compact views
export function QuickThemeButton() {
  const { currentTheme, setTheme } = useTheme();
  const [themeIndex, setThemeIndex] = useState(0);
  
  const quickThemes = [
    'mystic-twilight',
    'cyber-ice', 
    'crimson-noir',
    'solar-dusk',
    'neo-tokyo'
  ];

  const cycleTheme = () => {
    const nextIndex = (themeIndex + 1) % quickThemes.length;
    setThemeIndex(nextIndex);
    setTheme(quickThemes[nextIndex]);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={cycleTheme}
      className="relative overflow-hidden group"
      style={{
        background: currentTheme.gradients.primary,
        color: 'white'
      }}
    >
      <Palette className="w-4 h-4" />
      <div 
        className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: currentTheme.gradients.card }}
      />
    </Button>
  );
}