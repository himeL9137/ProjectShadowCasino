import React, { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { calculateVisibleRange } from '@/utils/performance-optimizations';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
}

/**
 * High-performance virtual list component for rendering large datasets
 */
export const VirtualList = React.memo(function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className = ""
}: VirtualListProps<T>) {
  
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => 
    calculateVisibleRange(scrollTop, containerHeight, itemHeight, items.length, overscan),
    [scrollTop, containerHeight, itemHeight, items.length, overscan]
  );
  
  // Calculate total height
  const totalHeight = useMemo(() => 
    items.length * itemHeight,
    [items.length, itemHeight]
  );
  
  // Get visible items
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );
  
  // Calculate offset for visible items
  const offsetY = useMemo(() => 
    startIndex * itemHeight,
    [startIndex, itemHeight]
  );
  
  // Optimized scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);
  
  // Scroll to index function
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);
  
  // Expose scroll function via ref
  useEffect(() => {
    if (scrollElementRef.current) {
      (scrollElementRef.current as any).scrollToIndex = scrollToIndex;
    }
  }, [scrollToIndex]);
  
  return (
    <div
      ref={scrollElementRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = keyExtractor(item, actualIndex);
            
            return (
              <div
                key={key}
                style={{
                  height: itemHeight,
                  overflow: 'hidden',
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.overscan === nextProps.overscan &&
    prevProps.items.every((item, index) => item === nextProps.items[index])
  );
});