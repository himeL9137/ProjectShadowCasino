import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { VirtualList } from '@/components/ui/virtual-list';
import { OptimizedSearchInput } from '@/components/examples/OptimizedSearchInput';
import { useSimpleDebounce } from '@/hooks/use-debounce';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FastListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  searchEnabled?: boolean;
  searchKeys?: (keyof T)[];
  filterFunction?: (item: T, searchTerm: string) => boolean;
  virtual?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  loading?: boolean;
  emptyComponent?: React.ReactNode;
  className?: string;
  searchPlaceholder?: string;
}

/**
 * High-performance list component with search, filtering, and virtual scrolling
 */
export const FastList = React.memo(function FastList<T extends Record<string, any>>({
  items,
  renderItem,
  keyExtractor,
  searchEnabled = true,
  searchKeys = [],
  filterFunction,
  virtual = false,
  itemHeight = 60,
  containerHeight = 400,
  loading = false,
  emptyComponent,
  className = "",
  searchPlaceholder = "Search items..."
}: FastListProps<T>) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useSimpleDebounce(searchTerm, 300);
  
  // Memoized filtered items
  const filteredItems = useMemo(() => {
    if (!searchEnabled || !debouncedSearchTerm.trim()) {
      return items;
    }
    
    if (filterFunction) {
      return items.filter(item => filterFunction(item, debouncedSearchTerm));
    }
    
    // Default search function
    const searchLower = debouncedSearchTerm.toLowerCase();
    return items.filter(item => {
      if (searchKeys.length > 0) {
        return searchKeys.some(key => 
          String(item[key]).toLowerCase().includes(searchLower)
        );
      }
      
      // Search all string properties
      return Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
    });
  }, [items, debouncedSearchTerm, searchEnabled, filterFunction, searchKeys]);
  
  // Stable search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Empty state
  if (filteredItems.length === 0) {
    const isEmpty = items.length === 0;
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        {searchEnabled && (
          <div className="w-full max-w-md mb-4">
            <OptimizedSearchInput
              onSearchChange={handleSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">
              {isEmpty ? "No items found" : "No matches found"}
            </p>
            {!isEmpty && (
              <p className="text-sm">
                Try adjusting your search criteria
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Search input */}
      {searchEnabled && (
        <OptimizedSearchInput
          onSearchChange={handleSearchChange}
          placeholder={searchPlaceholder}
        />
      )}
      
      {/* List content */}
      {virtual ? (
        <VirtualList
          items={filteredItems}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          className="border rounded-lg"
        />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => (
            <div key={keyExtractor(item, index)}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
      
      {/* Results count */}
      {searchEnabled && debouncedSearchTerm && (
        <p className="text-sm text-muted-foreground text-center">
          Found {filteredItems.length} of {items.length} items
        </p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.items.every((item, index) => item === nextProps.items[index]) &&
    prevProps.loading === nextProps.loading &&
    prevProps.searchEnabled === nextProps.searchEnabled &&
    prevProps.virtual === nextProps.virtual &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight
  );
});