import { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Users, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useIntersectionObserver } from '@/utils/performance-optimizations';
import { cn } from '@/lib/utils';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  playerCount: number;
  rating: number;
  category: string;
  isPopular?: boolean;
  isNew?: boolean;
  onPlay: (gameId: string) => void;
  onFavorite: (gameId: string) => void;
  className?: string;
}

/**
 * Optimized Game Card component demonstrating all performance optimization techniques:
 * - React.memo to prevent unnecessary re-renders
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - useDebounce for input handling
 * - Intersection Observer for lazy loading
 * - Performance monitoring in development
 */
export const OptimizedGameCard = memo(function OptimizedGameCard({
  id,
  title,
  description,
  thumbnail,
  playerCount,
  rating,
  category,
  isPopular = false,
  isNew = false,
  onPlay,
  onFavorite,
  className = ""
}: GameCardProps) {
  
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });
  
  // Memoize expensive calculations
  const formattedPlayerCount = useMemo(() => {
    if (playerCount < 1000) return playerCount.toString();
    if (playerCount < 1000000) return `${(playerCount / 1000).toFixed(1)}K`;
    return `${(playerCount / 1000000).toFixed(1)}M`;
  }, [playerCount]);
  
  const ratingStars = useMemo(() => {
    return Math.round(rating * 2) / 2; // Round to nearest 0.5
  }, [rating]);
  
  const truncatedDescription = useMemo(() => {
    return description.length > 120 ? `${description.substring(0, 120)}...` : description;
  }, [description]);
  
  // Memoize CSS classes to prevent recalculation
  const cardClasses = useMemo(() => {
    return cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-xl",
      "hover:scale-[1.02] cursor-pointer",
      {
        "ring-2 ring-yellow-400": isPopular,
        "ring-2 ring-green-400": isNew,
      },
      className
    );
  }, [isPopular, isNew, className]);
  
  const badgeVariant = useMemo(() => {
    if (isPopular) return "default";
    if (isNew) return "secondary";
    return "outline";
  }, [isPopular, isNew]);
  
  // Stable callback references to prevent child re-renders
  const handlePlay = useCallback(() => {
    onPlay(id);
  }, [id, onPlay]);
  
  const handleFavorite = useCallback(() => {
    onFavorite(id);
  }, [id, onFavorite]);
  
  // Debounced hover effect for better performance
  const [isHovered, setIsHovered] = useState(false);
  const debouncedHover = useDebounce(isHovered, 100);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now();
      console.log(`🎮 GameCard ${id} rendered in ${renderTime.toFixed(2)}ms`);
    }
  });
  
  // Lazy loading: only render full content when visible
  if (!isVisible) {
    return (
      <div 
        ref={cardRef}
        className={cn("h-80 bg-muted animate-pulse rounded-lg", className)}
        style={{ minHeight: '320px' }}
      />
    );
  }
  
  return (
    <motion.div
      ref={cardRef}
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="h-full border-0 shadow-none">
        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Overlay with play button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                onClick={handlePlay}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <Play className="w-6 h-6 mr-2" />
                Play Now
              </Button>
            </div>
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {isPopular && (
                <Badge variant={badgeVariant} className="bg-yellow-500 text-black">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {isNew && (
                <Badge variant={badgeVariant} className="bg-green-500 text-white">
                  New
                </Badge>
              )}
            </div>
            
            {/* Rating */}
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-sm font-medium">
              {ratingStars}★
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold truncate">{title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className="shrink-0 ml-2"
              >
                <Star className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {truncatedDescription}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formattedPlayerCount}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {category}
              </div>
            </div>
            
            <Button
              onClick={handlePlay}
              size="sm"
              className="shrink-0"
            >
              Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});