import React, { memo, useMemo, useCallback } from 'react';
import { useDebug } from '@/hooks/use-debug';
import { cn } from '@/lib/utils';

/**
 * Enhanced debug-aware utilities for optimal performance
 */

// Debug-aware class name utility with performance optimization
export function useDebugClasses(baseClasses: string, fancyClasses: string = '') {
  const { debugMode, shouldDisableAnimation, shouldDisableGradient, shouldDisableShadow } = useDebug();
  
  return useMemo(() => {
    if (!debugMode) {
      return cn(baseClasses, fancyClasses);
    }
    
    // Strip fancy classes in debug mode
    let debugClasses = baseClasses;
    
    // Remove animation classes if disabled
    if (shouldDisableAnimation()) {
      debugClasses = debugClasses.replace(/animate-\S+/g, '').replace(/transition-\S+/g, '');
    }
    
    // Remove gradient classes if disabled
    if (shouldDisableGradient()) {
      debugClasses = debugClasses.replace(/bg-gradient-\S+/g, 'bg-background');
    }
    
    // Remove shadow classes if disabled
    if (shouldDisableShadow()) {
      debugClasses = debugClasses.replace(/shadow-\S+/g, '').replace(/drop-shadow-\S+/g, '');
    }
    
    return cn(debugClasses);
  }, [baseClasses, fancyClasses, debugMode, shouldDisableAnimation, shouldDisableGradient, shouldDisableShadow]);
}

// Performance-optimized conditional class application
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string {
  return condition ? trueClass : falseClass;
}

// Debug-aware animation wrapper
export const DebugAnimationWrapper = memo(({ 
  children, 
  className = '', 
  animationClass = '',
  fallbackClass = ''
}: {
  children: React.ReactNode;
  className?: string;
  animationClass?: string;
  fallbackClass?: string;
}) => {
  const { shouldDisableAnimation } = useDebug();
  
  const wrapperClass = useMemo(() => {
    const finalAnimationClass = shouldDisableAnimation() ? fallbackClass : animationClass;
    return cn(className, finalAnimationClass);
  }, [className, animationClass, fallbackClass, shouldDisableAnimation]);
  
  return <div className={wrapperClass}>{children}</div>;
});

DebugAnimationWrapper.displayName = 'DebugAnimationWrapper';

// High-performance debug-aware component wrapper
export const DebugOptimizedWrapper = memo(({ 
  children, 
  baseClass = '',
  fancyClass = '',
  tag: Tag = 'div',
  ...props 
}: {
  children: React.ReactNode;
  baseClass?: string;
  fancyClass?: string;
  tag?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}) => {
  const finalClass = useDebugClasses(baseClass, fancyClass);
  
  return React.createElement(Tag, { 
    ...props, 
    className: cn(finalClass, props.className) 
  }, children);
});

DebugOptimizedWrapper.displayName = 'DebugOptimizedWrapper';

// Debug-aware gradient component
export const DebugGradient = memo(({ 
  from, 
  to, 
  direction = 'to-r',
  fallback = 'bg-background',
  className = '',
  children 
}: {
  from: string;
  to: string;
  direction?: string;
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  const { shouldDisableGradient } = useDebug();
  
  const gradientClass = useMemo(() => {
    if (shouldDisableGradient()) {
      return fallback;
    }
    return `bg-gradient-${direction} ${from} ${to}`;
  }, [shouldDisableGradient, from, to, direction, fallback]);
  
  return <div className={cn(gradientClass, className)}>{children}</div>;
});

DebugGradient.displayName = 'DebugGradient';

// Debug-aware shadow wrapper
export const DebugShadow = memo(({ 
  shadowSize = 'md',
  fallback = '',
  className = '',
  children 
}: {
  shadowSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const { shouldDisableShadow } = useDebug();
  
  const shadowClass = useMemo(() => {
    if (shouldDisableShadow()) {
      return fallback;
    }
    return `shadow-${shadowSize}`;
  }, [shouldDisableShadow, shadowSize, fallback]);
  
  return <div className={cn(shadowClass, className)}>{children}</div>;
});

DebugShadow.displayName = 'DebugShadow';

// Debug performance indicator
export const DebugPerformanceIndicator = memo(() => {
  const { debugMode, getPerformanceLevel, estimatedPerformanceGain } = useDebug();
  
  if (!debugMode) return null;
  
  const performanceLevel = getPerformanceLevel();
  const levelColors = {
    off: 'bg-gray-500',
    balanced: 'bg-yellow-500',
    maximum: 'bg-red-500'
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${levelColors[performanceLevel]} animate-pulse`}></div>
          <span>Debug: {performanceLevel}</span>
          <span className="text-green-400">+{estimatedPerformanceGain.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
});

DebugPerformanceIndicator.displayName = 'DebugPerformanceIndicator';

// Enhanced debug hook for component-level optimizations
export function useDebugOptimization() {
  const debug = useDebug();
  
  const optimizedProps = useCallback((props: Record<string, any>) => {
    if (!debug.debugMode) return props;
    
    const optimized = { ...props };
    
    // Remove animation props in debug mode
    if (debug.shouldDisableAnimation()) {
      delete optimized.animate;
      delete optimized.transition;
      delete optimized.whileHover;
      delete optimized.whileTap;
    }
    
    return optimized;
  }, [debug]);
  
  const shouldRender = useCallback((condition: boolean = true) => {
    // In maximum performance mode, allow conditional rendering to be more aggressive
    if (debug.isMaxPerformance && !condition) {
      return false;
    }
    return condition;
  }, [debug.isMaxPerformance]);
  
  return {
    ...debug,
    optimizedProps,
    shouldRender,
    isDebugMode: debug.debugMode,
    performanceLevel: debug.getPerformanceLevel()
  };
}

// Debug-aware image component with quality controls
export const DebugImage = memo(({ 
  src, 
  alt, 
  className = '',
  lowQualitySrc,
  ...props 
}: {
  src: string;
  alt: string;
  className?: string;
  lowQualitySrc?: string;
  [key: string]: any;
}) => {
  const { settings } = useDebug();
  
  const imageSrc = useMemo(() => {
    if (settings.lowQualityImages && lowQualitySrc) {
      return lowQualitySrc;
    }
    return src;
  }, [src, lowQualitySrc, settings.lowQualityImages]);
  
  const imageClass = useMemo(() => {
    let classes = className;
    if (settings.lowQualityImages) {
      classes += ' debug-low-quality';
    }
    return classes;
  }, [className, settings.lowQualityImages]);
  
  return <img src={imageSrc} alt={alt} className={imageClass} {...props} />;
});

DebugImage.displayName = 'DebugImage';

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart;
    
    if (renderTime > 16) { // More than one frame
      console.warn(`[Debug] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  });
  
  return { renderStart };
}