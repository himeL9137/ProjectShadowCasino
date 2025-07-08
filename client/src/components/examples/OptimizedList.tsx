import React, { memo, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  onItemClick?: (item: T, index: number) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

/**
 * High-performance list component with memoization
 */
export const OptimizedList = React.memo(function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  onItemClick,
  loading = false,
  empty = null,
  className = "",
  itemClassName = ""
}: OptimizedListProps<T>) {
  
  // Memoize rendered items to prevent unnecessary re-renders
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      const content = renderItem(item, index);
      
      return (
        <OptimizedListItem
          key={key}
          onClick={onItemClick ? () => onItemClick(item, index) : undefined}
          className={itemClassName}
        >
          {content}
        </OptimizedListItem>
      );
    });
  }, [items, renderItem, keyExtractor, onItemClick, itemClassName]);
  
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {empty || <p className="text-muted-foreground">No items found</p>}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {renderedItems}
    </div>
  );
});

// Optimized list item component
interface OptimizedListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const OptimizedListItem = React.memo(function OptimizedListItem({
  children,
  onClick,
  className = ""
}: OptimizedListItemProps) {
  
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);
  
  const itemClassName = useMemo(() => 
    cn(
      "rounded-lg transition-colors",
      onClick && "cursor-pointer hover:bg-accent hover:text-accent-foreground",
      className
    ),
    [onClick, className]
  );
  
  if (onClick) {
    return (
      <div 
        className={itemClassName}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {children}
      </div>
    );
  }
  
  return (
    <div className={itemClassName}>
      {children}
    </div>
  );
});