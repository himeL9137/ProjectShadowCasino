import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { EnhancedLoadingScreen } from '@/components/enhanced-loading-screen';

type LoadingContextType = {
  showLoading: (duration?: number) => void;
  hideLoading: () => void;
  isLoading: boolean;
};

// Used to avoid showing loading screen on first render
// by tracking if the user has interacted with the site
let hasUserInteracted = false;
// Once user interacts we can show loading screen with sound effects
const markInteracted = () => {
  hasUserInteracted = true;
};

// Add global event listeners for user interaction
if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown'].forEach(event => {
    window.addEventListener(event, markInteracted, { once: true });
  });
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = React.memo(function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(4000);

  const showLoading = useCallback((customDuration?: number) => {
    if (customDuration) setDuration(customDuration);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        ['click', 'touchstart', 'keydown'].forEach(event => {
          window.removeEventListener(event, markInteracted);
        });
      }
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    showLoading,
    hideLoading,
    isLoading
  }), [showLoading, hideLoading, isLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && hasUserInteracted && 
        <EnhancedLoadingScreen onLoadingComplete={hideLoading} duration={duration} />
      }
      {children}
    </LoadingContext.Provider>
  );
});

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}