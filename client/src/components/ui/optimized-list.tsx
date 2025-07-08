import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingCount?: number;
  onItemClick?: (item: T, index: number) => void;
}

/**
 * Optimized list component with React.memo and virtualization-ready structure
 * Prevents unnecessary re-renders of list items
 */
export const OptimizedList = React.memo(function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  emptyMessage = "No items to display",
  isLoading = false,
  loadingCount = 5,
  onItemClick
}: OptimizedListProps<T>) {
  
  // Memoize the loading skeleton
  const loadingSkeleton = useMemo(() => {
    return Array.from({ length: loadingCount }, (_, index) => (
      <div key={`loading-${index}`} className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    ));
  }, [loadingCount]);

  // Memoize the item click handler
  const handleItemClick = useCallback((item: T, index: number) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [onItemClick]);

  // Memoize the rendered items
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return (
        <div
          key={key}
          onClick={() => handleItemClick(item, index)}
          className={onItemClick ? "cursor-pointer" : ""}
        >
          {renderItem(item, index)}
        </div>
      );
    });
  }, [items, renderItem, keyExtractor, handleItemClick, onItemClick]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {loadingSkeleton}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {renderedItems}
    </div>
  );
});

// Memoized List Item wrapper to prevent unnecessary re-renders
interface OptimizedListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

export const OptimizedListItem = React.memo(function OptimizedListItem({
  children,
  className = "",
  onClick,
  isActive = false,
  isDisabled = false
}: OptimizedListItemProps) {
  
  const itemClasses = useMemo(() => {
    return cn(
      "p-3 rounded-lg transition-colors duration-200",
      {
        "bg-primary/10 border-primary/20": isActive,
        "hover:bg-muted cursor-pointer": onClick && !isDisabled,
        "opacity-50 cursor-not-allowed": isDisabled,
        "border border-transparent": !isActive
      },
      className
    );
  }, [isActive, onClick, isDisabled, className]);

  return (
    <div 
      className={itemClasses}
      onClick={!isDisabled ? onClick : undefined}
    >
      {children}
    </div>
  );
});