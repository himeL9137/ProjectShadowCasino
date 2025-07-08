import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useRenderTime } from '@/hooks/use-performance';

interface FastBalanceDisplayProps {
  compact?: boolean;
  className?: string;
  showCurrency?: boolean;
  animated?: boolean;
}

/**
 * Ultra-optimized balance display component
 * - Memoized with strict prop comparison
 * - Minimal re-renders with useMemo
 * - Performance monitoring
 * - Optimized class name calculation
 */
export const FastBalanceDisplay = React.memo(function FastBalanceDisplay({
  compact = false,
  className = "",
  showCurrency = true,
  animated = true
}: FastBalanceDisplayProps) {
  
  // Performance monitoring
  const renderCount = useRenderTime('FastBalanceDisplay');
  
  const { formattedBalance, isBalanceRefreshing, currency } = useCurrency();
  
  // Memoized display value
  const displayValue = useMemo(() => {
    if (isBalanceRefreshing) return "Loading...";
    return showCurrency ? formattedBalance : formattedBalance.replace(/[^\d.,]/g, '');
  }, [isBalanceRefreshing, formattedBalance, showCurrency]);
  
  // Memoized CSS classes
  const displayClasses = useMemo(() => cn(
    "font-bold transition-all duration-200",
    compact ? "text-base" : "text-2xl",
    isBalanceRefreshing && "opacity-50",
    animated && "transform transition-transform hover:scale-105",
    className
  ), [compact, isBalanceRefreshing, animated, className]);
  
  // Stable currency symbol
  const currencySymbol = useMemo(() => {
    if (!showCurrency) return "";
    switch (currency) {
      case 'USD': return '$';
      case 'BDT': return '৳';
      case 'INR': return '₹';
      case 'BTC': return '₿';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '';
    }
  }, [currency, showCurrency]);
  
  return (
    <div className={displayClasses}>
      {process.env.NODE_ENV === 'development' && (
        <span className="text-xs opacity-50 mr-1">R{renderCount}</span>
      )}
      <span className="tabular-nums">
        {displayValue}
      </span>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if props actually changed
  return (
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className &&
    prevProps.showCurrency === nextProps.showCurrency &&
    prevProps.animated === nextProps.animated
  );
});