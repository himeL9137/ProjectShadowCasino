import { useEffect, useState, useRef, useMemo, memo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency-utils";
import { useDebugClasses } from "@/components/ui/debug-wrapper";
import "./balance-display.css";
import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  compact?: boolean;
  showCurrency?: boolean;
  className?: string;
}

function animateBalance(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void
): () => void {
  const start = performance.now();
  let rafId: number;

  function step(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    onUpdate(parseFloat(current.toFixed(8)));
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      onUpdate(to);
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

/**
 * Displays the user's balance with smooth animated roll on change.
 * Single source of truth: balance from CurrencyProvider only.
 * No layout shake: tabular-nums, fixed min-width, GPU compositing.
 */
export const BalanceDisplay = memo(function BalanceDisplay({
  compact = false,
  showCurrency = false,
  className = "",
}: BalanceDisplayProps) {
  const { user } = useAuth();
  const {
    currency,
    balance,
    isChangingCurrency,
    isBalanceRefreshing,
  } = useCurrency();

  // Single source of truth: one ref (always-current), one display state
  const balanceRef = useRef<number>(parseFloat(balance || "0"));
  const [displayBalance, setDisplayBalance] = useState<number>(balanceRef.current);

  const [animationClass, setAnimationClass] = useState<string>("");
  const previousCurrency = useRef<string>(currency);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelAnimation = useRef<(() => void) | null>(null);
  const pendingRequest = useRef<number>(0);

  useEffect(() => {
    const incoming = parseFloat(balance || "0");
    const isCurrencyChange = previousCurrency.current !== currency;

    // Determine animation class
    let animClass = "";
    if (isCurrencyChange) {
      animClass = "currency-change";
    } else if (incoming > balanceRef.current) {
      animClass = "balance-increase";
    } else if (incoming < balanceRef.current) {
      animClass = "balance-decrease";
    }

    const from = balanceRef.current;
    balanceRef.current = incoming;
    previousCurrency.current = currency;

    // Cancel any in-flight animation
    if (cancelAnimation.current) {
      cancelAnimation.current();
      cancelAnimation.current = null;
    }

    // Lock to latest request so stale async frames don't win
    const reqId = ++pendingRequest.current;

    if (animClass) {
      if (animationTimer.current) clearTimeout(animationTimer.current);
      setAnimationClass(animClass);
      animationTimer.current = setTimeout(() => {
        setAnimationClass("");
        animationTimer.current = null;
      }, 1500);
    }

    // Animate from old to new
    cancelAnimation.current = animateBalance(from, incoming, 400, (val) => {
      if (pendingRequest.current === reqId) {
        setDisplayBalance(val);
      }
    });
  }, [balance, currency]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
      if (cancelAnimation.current) cancelAnimation.current();
    };
  }, []);

  if (!user && !balance) {
    return (
      <div className="text-2xl font-bold text-muted-foreground">
        {getCurrencySymbol(currency)}0.00
      </div>
    );
  }

  const formattedBalance = useMemo(() => {
    if (isBalanceRefreshing) return "Loading...";
    return formatCurrency(displayBalance.toString(), currency);
  }, [displayBalance, currency, isBalanceRefreshing]);

  const baseClasses = cn(
    compact ? "text-base" : "text-2xl",
    "font-bold",
    className
  );

  const fancyClasses = cn(
    animationClass,
    "balance-display-value"
  );

  const displayClasses = useDebugClasses(baseClasses, fancyClasses);

  const showCurrencyText = useMemo(() => {
    return showCurrency && !formattedBalance.includes(currency) && ` (${currency})`;
  }, [showCurrency, formattedBalance, currency]);

  if (isChangingCurrency) {
    return (
      <div className="text-xl font-semibold flex items-center space-x-2">
        <div className="h-5 w-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <span className="text-muted-foreground">Converting currency...</span>
      </div>
    );
  }

  return (
    <div className={displayClasses}>
      {formattedBalance}
      {showCurrencyText}
    </div>
  );
});
