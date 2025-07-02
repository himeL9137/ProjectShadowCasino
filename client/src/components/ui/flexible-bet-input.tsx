import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, DollarSign, Coins } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

interface FlexibleBetInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  currency?: string;
  balance?: number;
  minBet?: number;
  maxBet?: number;
  className?: string;
}

export function FlexibleBetInput({
  value,
  onChange,
  disabled = false,
  currency: propCurrency = 'USD',
  balance: propBalance = 0,
  minBet = 1,
  maxBet,
  className = ''
}: FlexibleBetInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [error, setError] = useState('');
  
  // Use global currency context for real-time updates
  const { currency, balance: contextBalance, formatAmount, getCurrencySymbol } = useCurrency();
  
  // Use context values for real-time currency switching
  const activeCurrency = currency || propCurrency;
  const activeBalance = parseFloat(contextBalance) || propBalance;

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  // Calculate effective max bet using real-time balance
  const effectiveMaxBet = maxBet ? Math.min(activeBalance, maxBet) : activeBalance;

  // Quick bet amounts based on real-time balance (10%, 25%, 50%, 100% of balance)
  const quickBets = [
    Math.max(minBet, Math.floor(activeBalance * 0.1)),
    Math.max(minBet, Math.floor(activeBalance * 0.25)),
    Math.max(minBet, Math.floor(activeBalance * 0.5)),
    Math.max(minBet, activeBalance)
  ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates

  const validateAndSetAmount = (amount: number) => {
    setError('');
    
    if (amount < minBet) {
      setError(`Minimum bet is ${minBet} ${activeCurrency}`);
      return false;
    }
    
    if (amount > effectiveMaxBet) {
      setError(`Maximum bet is ${effectiveMaxBet} ${activeCurrency}`);
      return false;
    }
    
    if (amount > activeBalance) {
      setError('Insufficient balance');
      return false;
    }
    
    onChange(amount);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only validate if it's a valid number
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      validateAndSetAmount(numValue);
    } else if (newValue === '') {
      setError('');
    }
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue <= 0) {
      setInputValue(minBet.toString());
      onChange(minBet);
    }
  };

  const adjustAmount = (delta: number) => {
    const newAmount = Math.max(0, value + delta);
    if (validateAndSetAmount(newAmount)) {
      setInputValue(newAmount.toString());
    }
  };

  const setQuickBet = (amount: number) => {
    if (validateAndSetAmount(amount)) {
      setInputValue(amount.toString());
    }
  };

  const setMaxBet = () => {
    setQuickBet(effectiveMaxBet);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Coins className="w-4 h-4" />
        Bet Amount ({currency})
      </Label>
      
      {/* Main Input with +/- Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustAmount(-10)}
          disabled={disabled || value <= minBet}
          className="h-10 w-10 flex-shrink-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            min={minBet}
            max={effectiveMaxBet}
            step="0.01"
            className={`text-center text-lg font-semibold h-10 ${error ? 'border-red-500' : ''}`}
            placeholder="0.00"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustAmount(10)}
          disabled={disabled || value >= effectiveMaxBet}
          className="h-10 w-10 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      {/* Quick Bet Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {quickBets.slice(0, 3).map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => setQuickBet(amount)}
            disabled={disabled}
            className="text-xs truncate min-w-0 px-2"
            title={`${formatCurrency(amount)} ${currency}`}
          >
            <span className="truncate">{amount >= 1000 ? `${(amount/1000).toFixed(1)}K` : amount.toLocaleString()} {activeCurrency}</span>
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={setMaxBet}
          disabled={disabled}
          className="text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white truncate min-w-0 px-2"
          title={`Max: ${formatCurrency(effectiveMaxBet)} ${currency}`}
        >
          <span className="truncate">Max: {effectiveMaxBet >= 1000 ? `${(effectiveMaxBet/1000).toFixed(1)}K` : effectiveMaxBet.toLocaleString()} {activeCurrency}</span>
        </Button>
      </div>

      {/* Balance Info */}
      <div className="flex items-center justify-between text-sm gap-2">
        <span className="text-muted-foreground flex-shrink-0">Balance:</span>
        <Badge variant="secondary" className="font-mono truncate min-w-0 max-w-[120px]" title={`${activeBalance.toLocaleString()} ${activeCurrency}`}>
          <span className="truncate">{activeBalance >= 1000 ? `${(activeBalance/1000).toFixed(1)}K` : activeBalance.toLocaleString()} {activeCurrency}</span>
        </Badge>
      </div>

      {/* Bet Percentage Indicator */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (value / activeBalance) * 100)}%`
          }}
        />
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Betting {((value / activeBalance) * 100).toFixed(1)}% of balance
      </div>
    </div>
  );
}