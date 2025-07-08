import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../lib/store';
import { fetchBalance } from '../../lib/store/thunks/walletThunks';
import { motion, AnimatePresence } from 'framer-motion';

const BalanceDisplay: React.FC = React.memo(() => {
  const dispatch = useDispatch();
  const { balance, currency, isLoading } = useSelector((state: RootState) => state.wallet);
  const [prevBalance, setPrevBalance] = useState(balance);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for balance updates - optimized fallback mechanism (reduced frequency)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      dispatch(fetchBalance());
    }, 60000); // Poll every 60 seconds as a backup (reduced from 10s to prevent excessive calls)

    return () => clearInterval(pollInterval);
  }, [dispatch]);

  // Handle balance change animations
  useEffect(() => {
    if (balance !== prevBalance) {
      // Determine if balance is increasing or decreasing
      const numBalance = parseFloat(balance);
      const numPrevBalance = parseFloat(prevBalance);

      if (numBalance > numPrevBalance) {
        setIsIncreasing(true);
        setIsDecreasing(false);
      } else if (numBalance < numPrevBalance) {
        setIsIncreasing(false);
        setIsDecreasing(true);
      }

      // Clear previous timeout if exists
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Reset animation states after a delay
      updateTimeoutRef.current = setTimeout(() => {
        setIsIncreasing(false);
        setIsDecreasing(false);
        setPrevBalance(balance);
      }, 1500);
    }
  }, [balance, prevBalance]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Memoize balance class calculation to prevent unnecessary re-renders
  const balanceClassName = useMemo(() => {
    return `balance ${isIncreasing ? 'text-green-500' : ''} ${isDecreasing ? 'text-red-500' : ''}`;
  }, [isIncreasing, isDecreasing]);

  // Memoize motion animation properties
  const motionProps = useMemo(() => ({
    initial: { opacity: 0.8, y: isIncreasing ? 20 : (isDecreasing ? -20 : 0) },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  }), [isIncreasing, isDecreasing]);

  return (
    <div className="balance-display relative">
      {isLoading ? (
        <div className="loading">Updating...</div>
      ) : (
        <AnimatePresence>
          <motion.div 
            className={balanceClassName}
            {...motionProps}
          >
            <span className="amount font-bold">{balance}</span>
            <span className="currency ml-2">{currency}</span>

            {/* Visual indicator for balance changes */}
            {isIncreasing && (
              <motion.span 
                className="absolute -right-6 text-green-500" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ↑
              </motion.span>
            )}
            {isDecreasing && (
              <motion.span 
                className="absolute -right-6 text-red-500" 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ↓
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
});

export default BalanceDisplay;