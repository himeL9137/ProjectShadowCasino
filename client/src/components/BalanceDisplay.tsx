import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency-utils";
import "./balance-display.css";
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  compact?: boolean;
  showCurrency?: boolean;
  className?: string;
}

/**
 * Displays the user's balance with proper animation effects for changes
 * Automatically updates when the balance or currency changes
 */
export function BalanceDisplay({ 
  compact = false, 
  showCurrency = false,
  className = ""
}: BalanceDisplayProps = {}) {
  const { user } = useAuth();
  const { 
    currency, 
    balance, 
    isChangingCurrency,
    isBalanceRefreshing 
  } = useCurrency();
  
  const [displayAmount, setDisplayAmount] = useState<string>(user?.balance || "0");
  const [animationClass, setAnimationClass] = useState<string>("");
  const previousBalance = useRef<string | null>(null);
  const previousCurrency = useRef<string | null>(null);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Use nice spring animation when balance changes
  useEffect(() => {
    // Make sure we always have a valid balance to display
    const safeBalance = balance || user?.balance || "0";
    
    // If it's the first time setting the balance, just set it without animation
    if (previousBalance.current === null) {
      previousBalance.current = safeBalance;
      previousCurrency.current = currency;
      setDisplayAmount(safeBalance);
      return;
    }
    
    // Skip animation if balance hasn't changed
    if (previousBalance.current === safeBalance && previousCurrency.current === currency) {
      return;
    }
    
    try {
      // Determine if balance increased or decreased
      const oldBalance = parseFloat(previousBalance.current || "0");
      const newBalance = parseFloat(safeBalance);
      
      let animClass = "";
      
      // Same currency, compare values
      if (previousCurrency.current === currency) {
        if (newBalance > oldBalance) {
          animClass = "balance-increase";
        } else if (newBalance < oldBalance) {
          animClass = "balance-decrease";
        }
      } 
      // Currency changed - always apply the currency-change animation
      else {
        animClass = "currency-change";
      }
      
      if (animClass) {
        // Clear any existing animation timer
        if (animationTimer.current) {
          clearTimeout(animationTimer.current);
        }
        
        setAnimationClass(animClass);
        
        // Remove animation class after animation completes
        animationTimer.current = setTimeout(() => {
          setAnimationClass("");
          animationTimer.current = null;
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating balance display:', error);
      // Don't apply animation if there's an error
    } finally {
      // Always update state for next comparison
      previousBalance.current = safeBalance;
      previousCurrency.current = currency;
      setDisplayAmount(safeBalance);
    }
  }, [balance, currency, user]);
  
  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, []);
  
  // Handle initial loading state
  if (!user && !balance) {
    return (
      <div className="text-2xl font-bold text-muted-foreground">
        {getCurrencySymbol(currency)}0.00
      </div>
    );
  }
  
  // Format balance with the new utility
  const formattedBalance = !isBalanceRefreshing
    ? formatCurrency(displayAmount || "0", currency)
    : "Loading...";
  
  // Show currency loading state
  if (isChangingCurrency) {
    return (
      <div className="text-xl font-semibold flex items-center space-x-2">
        <div className="h-5 w-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <span className="text-muted-foreground">Converting currency...</span>
      </div>
    );
  }
  
  return (
    <div className={cn(
      compact ? "text-base" : "text-2xl", 
      "font-bold", 
      animationClass,
      className
    )}>
      {formattedBalance}
      {showCurrency && !formattedBalance.includes(currency) && ` (${currency})`}
    </div>
  );
}