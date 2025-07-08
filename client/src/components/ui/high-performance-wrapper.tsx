import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRenderTime, useMemoryTracker, useExpensiveRenderDetector } from '@/hooks/use-performance';
import { cn } from '@/lib/utils';

interface HighPerformanceWrapperProps {
  children: React.ReactNode;
  componentName: string;
  enableProfiling?: boolean;
  memoryTracking?: boolean;
  renderTimeThreshold?: number;
  className?: string;
  lazyLoad?: boolean;
  intersectionThreshold?: number;
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * High-performance wrapper component that provides:
 * - Performance monitoring
 * - Memory tracking
 * - Lazy loading with intersection observer
 * - Render time profiling
 * - Expensive render detection
 */
export const HighPerformanceWrapper = React.memo(function HighPerformanceWrapper({
  children,
  componentName,
  enableProfiling = process.env.NODE_ENV === 'development',
  memoryTracking = process.env.NODE_ENV === 'development',
  renderTimeThreshold = 16,
  className = "",
  lazyLoad = false,
  intersectionThreshold = 0.1,
  onVisibilityChange
}: HighPerformanceWrapperProps) {
  
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Performance monitoring hooks
  const renderCount = useRenderTime(componentName);
  
  // Memory tracking
  if (memoryTracking) {
    useMemoryTracker(componentName);
  }
  
  // Expensive render detection
  if (enableProfiling) {
    useExpensiveRenderDetector(componentName, renderTimeThreshold);
  }
  
  // Intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        onVisibilityChange?.(visible);
        
        if (visible && !hasRendered) {
          setHasRendered(true);
        }
      },
      {
        threshold: intersectionThreshold,
        rootMargin: '50px'
      }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [lazyLoad, intersectionThreshold, onVisibilityChange, hasRendered]);
  
  // Stable visibility handler
  const handleVisibilityChange = useCallback((visible: boolean) => {
    onVisibilityChange?.(visible);
  }, [onVisibilityChange]);
  
  // Memoized container classes
  const containerClasses = useMemo(() => cn(
    "relative",
    className
  ), [className]);
  
  // Performance indicator (development only)
  const performanceIndicator = useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || !enableProfiling) return null;
    
    return (
      <div className="absolute top-0 right-0 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded-bl-md">
        <div className="flex items-center gap-1">
          <span>R:{renderCount}</span>
          {isVisible && <span className="text-green-400">👁</span>}
        </div>
      </div>
    );
  }, [enableProfiling, renderCount, isVisible]);
  
  // Lazy loading placeholder
  if (lazyLoad && !isVisible) {
    return (
      <div
        ref={containerRef}
        className={cn(containerClasses, "min-h-[200px] bg-muted/50 animate-pulse")}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
        {performanceIndicator}
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className={containerClasses}>
      {children}
      {performanceIndicator}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.componentName === nextProps.componentName &&
    prevProps.enableProfiling === nextProps.enableProfiling &&
    prevProps.memoryTracking === nextProps.memoryTracking &&
    prevProps.renderTimeThreshold === nextProps.renderTimeThreshold &&
    prevProps.className === nextProps.className &&
    prevProps.lazyLoad === nextProps.lazyLoad &&
    prevProps.intersectionThreshold === nextProps.intersectionThreshold &&
    prevProps.onVisibilityChange === nextProps.onVisibilityChange &&
    prevProps.children === nextProps.children
  );
});