/**
 * Universal Currency Display Component
 * 
 * This component ensures consistent currency formatting and display
 * across all parts of the casino app, including games.
 */

import { useCurrency } from '../../providers/CurrencyProvider';
import { Currency } from '@shared/schema';

interface CurrencyDisplayProps {
  amount: string | number;
  currency?: Currency;
  compact?: boolean;
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  amount, 
  currency, 
  compact = false, 
  showSymbol = true,
  className = ""
}: CurrencyDisplayProps) {
  const { currency: currentCurrency, formatAmount } = useCurrency();
  
  // Always use the current currency unless specifically overridden
  const activeCurrency = currency || currentCurrency;
  
  // Use formatAmount with compact option for better display of large numbers
  const formattedAmount = formatAmount(amount, activeCurrency);

  return (
    <span className={`currency-display break-words ${className}`}>
      {formattedAmount}
      {!showSymbol && ` ${activeCurrency}`}
    </span>
  );
}

export default CurrencyDisplay;