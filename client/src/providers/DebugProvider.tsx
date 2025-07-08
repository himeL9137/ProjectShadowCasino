import { useEffect } from 'react';
import { useDebug } from '@/hooks/use-debug';

/**
 * DebugProvider manages the global debug mode state and applies CSS classes
 * to strip visual effects when debug mode is enabled
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  const { debugMode } = useDebug();

  useEffect(() => {
    // Apply debug-mode class to body when debug mode is active
    document.body.classList.toggle('debug-mode', debugMode);
    
    // Also apply to document element for broader CSS targeting
    document.documentElement.classList.toggle('debug-mode', debugMode);

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('debug-mode');
      document.documentElement.classList.remove('debug-mode');
    };
  }, [debugMode]);

  return <>{children}</>;
}