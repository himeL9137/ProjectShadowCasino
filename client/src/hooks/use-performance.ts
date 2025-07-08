import { useEffect, useRef, useState } from 'react';

/**
 * Hook to track component render times for performance monitoring
 */
export function useRenderTime(componentName: string): number {
  const renderCount = useRef(0);
  const startTime = useRef(0);
  
  // Record start time
  startTime.current = performance.now();
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    renderCount.current++;
    
    // Only log in development and if render is slow
    if (process.env.NODE_ENV === 'development') {
      if (renderTime > 16) {
        console.warn(`🐌 ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
      }
      
      // Log performance stats every 10 renders
      if (renderCount.current % 10 === 0) {
        console.log(`📊 ${componentName} rendered ${renderCount.current} times`);
      }
    }
  });
  
  return renderCount.current;
}

/**
 * Hook to track memory usage
 */
export function useMemoryTracker(componentName: string): void {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576);
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
      const percentage = Math.round((used / limit) * 100);
      
      if (percentage > 80) {
        console.warn(`🚨 ${componentName} - High memory usage: ${used}MB (${percentage}%)`);
      }
    }
  }, [componentName]);
}

/**
 * Hook to track re-render causes
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>): void {
  const previous = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log(`🔄 ${name} re-rendered due to:`, changedProps);
      }
    }
    
    previous.current = props;
  });
}

/**
 * Hook to measure component lifecycle performance
 */
export function usePerformanceProfiler(componentName: string) {
  const mountTime = useRef(0);
  const updateCount = useRef(0);
  
  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${componentName} lifetime: ${totalLifetime.toFixed(2)}ms, updates: ${updateCount.current}`);
      }
    };
  }, [componentName]);
  
  useEffect(() => {
    updateCount.current++;
  });
}

/**
 * Hook to detect expensive renders
 */
export function useExpensiveRenderDetector(componentName: string, threshold = 16): void {
  const renderStart = useRef(0);
  
  renderStart.current = performance.now();
  
  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    
    if (renderTime > threshold && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${componentName} expensive render: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  });
}

/**
 * Hook to track state changes
 */
export function useStateChangeTracker<T>(name: string, value: T): void {
  const previous = useRef<T>();
  
  useEffect(() => {
    if (previous.current !== undefined && previous.current !== value) {
      console.log(`📝 ${name} state changed:`, {
        from: previous.current,
        to: value
      });
    }
    previous.current = value;
  }, [name, value]);
}