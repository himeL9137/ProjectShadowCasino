import { useCurrency } from "@/hooks/use-currency";

interface CurrencyDisplayProps {
  amount: number | string;
  className?: string;
}

export function CurrencyDisplay({ amount, className = "" }: CurrencyDisplayProps) {
  const { currency, getCurrencySymbol, formatAmount } = useCurrency();
  
  return (
    <span className={className}>
      {getCurrencySymbol(currency)}{formatAmount(amount, currency)}
    </span>
  );
}

interface CurrencySymbolProps {
  className?: string;
}

export function CurrencySymbol({ className = "" }: CurrencySymbolProps) {
  const { currency, getCurrencySymbol } = useCurrency();
  
  return (
    <span className={className}>
      {getCurrencySymbol(currency)}
    </span>
  );
}