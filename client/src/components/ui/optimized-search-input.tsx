import { useState, memo, useCallback } from 'react';
import { Input } from './input';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, X } from 'lucide-react';
import { Button } from './button';

interface OptimizedSearchInputProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  showClearButton?: boolean;
  value?: string;
}

/**
 * Optimized search input with debouncing to prevent excessive API calls
 * Uses React.memo to prevent unnecessary re-renders
 */
export const OptimizedSearchInput = memo(function OptimizedSearchInput({
  onSearchChange,
  placeholder = "Search...",
  delay = 300,
  className = "",
  showClearButton = true,
  value: controlledValue
}: OptimizedSearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debouncedValue = useDebounce(internalValue, delay);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  // Memoized callback to prevent unnecessary re-renders of parent components
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    // For controlled components, the parent should handle the change
    if (controlledValue !== undefined) {
      onSearchChange(newValue);
    }
  }, [controlledValue, onSearchChange]);

  // Clear button handler
  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onSearchChange('');
  }, [controlledValue, onSearchChange]);

  // Call onSearchChange when debounced value changes (for uncontrolled mode)
  React.useEffect(() => {
    if (controlledValue === undefined) {
      onSearchChange(debouncedValue);
    }
  }, [debouncedValue, onSearchChange, controlledValue]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={currentValue}
        onChange={handleInputChange}
        className="pl-10 pr-10"
      />
      {showClearButton && currentValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});