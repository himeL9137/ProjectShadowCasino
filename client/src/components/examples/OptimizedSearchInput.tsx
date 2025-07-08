import React, { memo, useCallback, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSimpleDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface OptimizedSearchInputProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * High-performance search input with debouncing and clear functionality
 */
export const OptimizedSearchInput = React.memo(function OptimizedSearchInput({
  onSearchChange,
  placeholder = "Search...",
  debounceMs = 300,
  className = "",
  autoFocus = false
}: OptimizedSearchInputProps) {
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useSimpleDebounce(inputValue, debounceMs);
  
  // Effect to trigger search when debounced value changes
  React.useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);
  
  // Optimized handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);
  
  const handleClear = useCallback(() => {
    setInputValue("");
    onSearchChange("");
  }, [onSearchChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);
  
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-10"
      />
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
});