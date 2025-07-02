
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/providers/CurrencyProvider';

interface AnimatedBalanceProps {
  balance: string;
  currency?: string;
  showAnimation?: boolean;
  className?: string;
}

export function AnimatedBalance({ 
  balance, 
  currency: propCurrency, 
  showAnimation = true,
  className = ""
}: AnimatedBalanceProps) {
  const { currency: defaultCurrency, formatAmount, getCurrencySymbol } = useCurrency();
  const currency = propCurrency || defaultCurrency;
  const [previousBalance, setPreviousBalance] = useState<string>(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (balance !== previousBalance && showAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPreviousBalance(balance);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [balance, previousBalance, showAnimation]);

  const balanceValue = parseFloat(balance);
  const previousValue = parseFloat(previousBalance);
  const isIncrease = balanceValue > previousValue;
  const isDecrease = balanceValue < previousValue;

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={balance}
          initial={showAnimation ? { opacity: 0, y: isIncrease ? 20 : -20, scale: 0.95 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isDecrease ? 20 : -20, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            ease: "easeOut",
            scale: { duration: 0.2 }
          }}
          className={`flex items-center font-bold ${
            isAnimating && isIncrease ? 'text-green-400' :
            isAnimating && isDecrease ? 'text-red-400' :
            'text-white'
          } transition-colors duration-500`}
        >
          <span className="mr-1">{getCurrencySymbol(currency)}</span>
          <span>{formatAmount(balanceValue)}</span>
          <span className="ml-1 text-sm opacity-80">{currency}</span>
        </motion.div>
      </AnimatePresence>

      {/* Floating effect for balance changes */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0], y: -30, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`absolute left-0 top-0 pointer-events-none font-bold text-sm ${
            isIncrease ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isIncrease ? '+' : ''}{getCurrencySymbol(currency)}{formatAmount(Math.abs(balanceValue - previousValue))}
        </motion.div>
      )}

      {/* Glow effect */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 1] }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 rounded-lg blur-sm pointer-events-none ${
            isIncrease ? 'bg-green-400/20' : 'bg-red-400/20'
          }`}
        />
      )}
    </div>
  );
}
