/**
 * Performance optimization utilities for React applications
 */

// Stable object references to prevent unnecessary re-renders
export const EMPTY_ARRAY = Object.freeze([]);
export const EMPTY_OBJECT = Object.freeze({});

// Memoization utility for expensive computations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks with large caches
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Request animation frame utility
export function rafSchedule(callback: () => void): () => void {
  let rafId: number;
  
  const schedule = () => {
    rafId = requestAnimationFrame(callback);
  };
  
  const cancel = () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
  
  schedule();
  return cancel;
}

// Batch DOM updates
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Performance measurement utility
export function measurePerformance<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development' && duration > 16) {
    console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (> 16ms)`);
  }
  
  return { result, duration };
}

// Memory usage tracker
export function trackMemoryUsage(componentName?: string): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576);
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
    const percentage = Math.round((used / limit) * 100);
    
    console.log(
      `🧠 Memory: ${used}MB / ${limit}MB (${percentage}%)`,
      componentName ? `- ${componentName}` : ''
    );
    
    if (percentage > 90) {
      console.warn(`🚨 High memory usage detected: ${percentage}%`);
    }
  }
}

// Deep equality check (use sparingly)
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// Shallow equality check (preferred)
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a == null || b == null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  
  return true;
}

// Create stable callback references
export function createStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  // This would typically be used inside a useMemo hook
  return callback;
}

// Optimize class name concatenation
export function optimizeClassNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Image lazy loading utility
export function createImageLoader() {
  const imageCache = new Set<string>();
  
  return {
    preload: (src: string): Promise<void> => {
      if (imageCache.has(src)) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.add(src);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    
    isLoaded: (src: string): boolean => imageCache.has(src)
  };
}

// Virtual scrolling utilities
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
): { startIndex: number; endIndex: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return { startIndex, endIndex };
}

// Component performance profiler
export function createPerformanceProfiler(componentName: string) {
  let renderCount = 0;
  let totalRenderTime = 0;
  let maxRenderTime = 0;
  
  return {
    start: (): (() => void) => {
      const startTime = performance.now();
      renderCount++;
      
      return () => {
        const renderTime = performance.now() - startTime;
        totalRenderTime += renderTime;
        maxRenderTime = Math.max(maxRenderTime, renderTime);
        
        if (process.env.NODE_ENV === 'development') {
          if (renderTime > 16) {
            console.warn(
              `🐌 ${componentName} render #${renderCount} took ${renderTime.toFixed(2)}ms`
            );
          }
          
          if (renderCount % 10 === 0) {
            const avgRenderTime = totalRenderTime / renderCount;
            console.log(
              `📊 ${componentName} stats:`,
              `Renders: ${renderCount},`,
              `Avg: ${avgRenderTime.toFixed(2)}ms,`,
              `Max: ${maxRenderTime.toFixed(2)}ms`
            );
          }
        }
      };
    }
  };
}