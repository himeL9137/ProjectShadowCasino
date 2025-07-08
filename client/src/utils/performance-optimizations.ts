import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Performance optimization utilities for React components
 * Based on the patterns from the uploaded optimization guide
 */

// Utility to check if an object has changed (shallow comparison)
export function hasChanged(prev: any, next: any): boolean {
  if (prev === next) return false;
  
  if (typeof prev !== 'object' || typeof next !== 'object') {
    return prev !== next;
  }
  
  if (prev === null || next === null) {
    return prev !== next;
  }
  
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  
  if (prevKeys.length !== nextKeys.length) {
    return true;
  }
  
  for (let key of prevKeys) {
    if (prev[key] !== next[key]) {
      return true;
    }
  }
  
  return false;
}

// Custom memo with deep comparison option
export function deepMemo<P extends {}>(
  Component: React.ComponentType<P>,
  compare?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, compare || ((prevProps, nextProps) => {
    return !hasChanged(prevProps, nextProps);
  }));
}

// Hook for preventing excessive re-renders of expensive calculations
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | null>(null);
  
  const depsChanged = !ref.current || 
    deps.length !== ref.current.deps.length ||
    deps.some((dep, index) => dep !== ref.current!.deps[index]);
  
  if (depsChanged) {
    const newValue = factory();
    
    if (!ref.current || !isEqual || !isEqual(ref.current.value, newValue)) {
      ref.current = { deps: [...deps], value: newValue };
    }
  }
  
  return ref.current.value;
}

// Hook for stable callback references
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>(callback);
  
  useEffect(() => {
    ref.current = callback;
  }, deps);
  
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

// Hook for preventing unnecessary state updates
export function useStableState<T>(
  initialState: T | (() => T),
  isEqual?: (a: T, b: T) => boolean
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  
  const setStableState = useCallback((newState: T | ((prevState: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(prevState)
        : newState;
      
      if (isEqual ? isEqual(prevState, nextState) : prevState === nextState) {
        return prevState; // Prevent unnecessary re-render
      }
      
      return nextState;
    });
  }, [isEqual]);
  
  return [state, setStableState];
}

// Component wrapper for lazy loading with Suspense
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunction);
  
  return memo(function LazyWrapper(props: React.ComponentProps<T>) {
    const FallbackComponent = fallback || (() => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ));
    
    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  });
}

// Utility for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTime = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime.current >= delay) {
      lastCallTime.current = now;
      return func(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now();
        func(...args);
      }, delay - (now - lastCallTime.current));
    }
  }, [func, delay]) as T;
}

// Hook for intersection observer (lazy loading images/components)
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [elementRef, options]);
  
  return isIntersecting;
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>();
  
  useEffect(() => {
    renderCount.current++;
    
    if (process.env.NODE_ENV === 'development') {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
        }
      }
    }
  });
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startTime.current = performance.now();
    }
  });
  
  return {
    renderCount: renderCount.current,
    logRenderInfo: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 ${componentName} has rendered ${renderCount.current} times`);
      }
    }
  };
}