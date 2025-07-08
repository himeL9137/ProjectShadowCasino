import React, { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimpleDebounce } from '@/hooks/use-debounce';
import { useRenderTime } from '@/hooks/use-performance';
import { cn } from '@/lib/utils';

interface OptimizedGameCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  playerCount?: number;
  rating?: number;
  isNew?: boolean;
  onPlay: (gameId: string) => void;
  onFavorite?: (gameId: string) => void;
  className?: string;
}

/**
 * Ultra-optimized game card component demonstrating all React performance techniques
 * - React.memo with custom comparison function
 * - useMemo for expensive calculations
 * - useCallback for stable event handlers
 * - Debounced hover effects
 * - Performance monitoring
 * - Lazy loading for images
 * - Intersection observer for viewport detection
 */
export const OptimizedGameCard = React.memo(function OptimizedGameCard({
  id,
  title,
  description,
  image,
  category,
  playerCount = 0,
  rating = 0,
  isNew = false,
  onPlay,
  onFavorite,
  className = ""
}: OptimizedGameCardProps) {
  
  // Performance monitoring in development
  const renderCount = useRenderTime('OptimizedGameCard');
  
  // State for hover effects
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Refs for intersection observer
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Debounced hover state to prevent excessive animations
  const debouncedHover = useSimpleDebounce(isHovered, 150);
  
  // Intersection observer for lazy loading
  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observer.observe(cardRef.current);
    
    return () => observer.disconnect();
  }, []);
  
  // Memoized calculations
  const formattedRating = useMemo(() => 
    rating > 0 ? `${rating.toFixed(1)} ⭐` : 'New',
    [rating]
  );
  
  const playerCountText = useMemo(() => 
    playerCount > 0 ? `${playerCount.toLocaleString()} players` : 'Single player',
    [playerCount]
  );
  
  const truncatedDescription = useMemo(() => 
    description.length > 100 ? `${description.substring(0, 97)}...` : description,
    [description]
  );
  
  // Memoized CSS classes
  const cardClasses = useMemo(() => cn(
    "relative overflow-hidden transition-all duration-300 cursor-pointer",
    "hover:shadow-lg hover:scale-[1.02]",
    debouncedHover && "ring-2 ring-primary/20",
    className
  ), [debouncedHover, className]);
  
  const imageClasses = useMemo(() => cn(
    "w-full h-48 object-cover transition-all duration-300",
    debouncedHover && "scale-110",
    !imageLoaded && "bg-muted animate-pulse"
  ), [debouncedHover, imageLoaded]);
  
  // Stable event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  const handlePlay = useCallback(() => {
    onPlay(id);
  }, [id, onPlay]);
  
  const handleFavorite = useCallback(() => {
    onFavorite?.(id);
  }, [id, onFavorite]);
  
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  const handleImageError = useCallback(() => {
    setImageLoaded(false);
  }, []);
  
  // Animation variants
  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }), []);
  
  // Don't render until visible (intersection observer)
  if (!isVisible) {
    return <div ref={cardRef} className="h-64 bg-muted rounded-lg animate-pulse" />;
  }
  
  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className={cardClasses}>
        {/* Performance indicator for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 left-2 z-10 text-xs bg-black/50 text-white px-1 rounded">
            R:{renderCount}
          </div>
        )}
        
        {/* New badge */}
        {isNew && (
          <Badge className="absolute top-2 right-2 z-10" variant="secondary">
            New
          </Badge>
        )}
        
        {/* Image with lazy loading */}
        <div className="relative overflow-hidden">
          {image && (
            <img
              src={image}
              alt={title}
              className={imageClasses}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Category badge */}
          <Badge 
            className="absolute bottom-2 left-2" 
            variant="outline"
          >
            {category}
          </Badge>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formattedRating}</span>
            <span>{playerCountText}</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {truncatedDescription}
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={handlePlay} 
              size="sm" 
              className="flex-1"
            >
              Play Now
            </Button>
            
            {onFavorite && (
              <Button 
                onClick={handleFavorite} 
                variant="outline" 
                size="sm"
              >
                ♡
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if essential props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.image === nextProps.image &&
    prevProps.playerCount === nextProps.playerCount &&
    prevProps.rating === nextProps.rating &&
    prevProps.isNew === nextProps.isNew &&
    prevProps.category === nextProps.category &&
    prevProps.onPlay === nextProps.onPlay &&
    prevProps.onFavorite === nextProps.onFavorite
  );
});