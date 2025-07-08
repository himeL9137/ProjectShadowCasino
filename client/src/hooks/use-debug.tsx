import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { 
  setDebugMode, 
  toggleDebugMode, 
  updateDebugSettings, 
  setPerformanceMode, 
  updatePerformanceMetrics,
  initializeDebugMode
} from '@/lib/store/slices/debugSlice';
import { useEffect, useCallback, useMemo } from 'react';

export function useDebug() {
  const debugState = useAppSelector((state) => state.debug);
  const dispatch = useAppDispatch();

  // Performance monitoring
  const startTime = useMemo(() => performance.now(), []);
  
  useEffect(() => {
    if (!debugState.isInitialized) {
      dispatch(initializeDebugMode());
    }
  }, [debugState.isInitialized, dispatch]);

  // Monitor performance impact
  useEffect(() => {
    if (debugState.debugMode) {
      const measurePerformance = () => {
        const now = performance.now();
        const gain = ((now - startTime) / startTime) * 100;
        
        // Estimate memory usage (simplified)
        const memoryInfo = (performance as any).memory;
        const memory = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
        
        dispatch(updatePerformanceMetrics({ gain: Math.max(0, 100 - gain), memory }));
      };

      const interval = setInterval(measurePerformance, 5000);
      return () => clearInterval(interval);
    }
  }, [debugState.debugMode, startTime, dispatch]);

  const setDebug = useCallback((enabled: boolean) => {
    dispatch(setDebugMode(enabled));
  }, [dispatch]);

  const toggleDebug = useCallback(() => {
    dispatch(toggleDebugMode());
  }, [dispatch]);

  const updateSettings = useCallback((settings: Partial<typeof debugState.settings>) => {
    dispatch(updateDebugSettings(settings));
  }, [dispatch]);

  const setMode = useCallback((mode: 'off' | 'balanced' | 'maximum') => {
    dispatch(setPerformanceMode(mode));
  }, [dispatch]);

  // Helper functions for component usage
  const shouldDisableAnimation = useCallback(() => {
    return debugState.debugMode && debugState.settings.disableAnimations;
  }, [debugState.debugMode, debugState.settings.disableAnimations]);

  const shouldDisableGradient = useCallback(() => {
    return debugState.debugMode && debugState.settings.disableGradients;
  }, [debugState.debugMode, debugState.settings.disableGradients]);

  const shouldDisableShadow = useCallback(() => {
    return debugState.debugMode && debugState.settings.disableShadows;
  }, [debugState.debugMode, debugState.settings.disableShadows]);

  const shouldDisableBlur = useCallback(() => {
    return debugState.debugMode && debugState.settings.disableBlurEffects;
  }, [debugState.debugMode, debugState.settings.disableBlurEffects]);

  const getPerformanceLevel = useCallback(() => {
    if (!debugState.debugMode) return 'off';
    return debugState.settings.performanceMode;
  }, [debugState.debugMode, debugState.settings.performanceMode]);

  return {
    debugMode: debugState.debugMode,
    settings: debugState.settings,
    metrics: debugState.metrics,
    setDebugMode: setDebug,
    toggleDebugMode: toggleDebug,
    updateSettings,
    setPerformanceMode: setMode,
    
    // Helper functions
    shouldDisableAnimation,
    shouldDisableGradient,
    shouldDisableShadow,
    shouldDisableBlur,
    getPerformanceLevel,
    
    // Computed values
    isMaxPerformance: debugState.settings.performanceMode === 'maximum',
    isBalanced: debugState.settings.performanceMode === 'balanced',
    estimatedPerformanceGain: debugState.metrics.performanceGain,
    memoryUsage: debugState.metrics.memoryUsage
  };
}