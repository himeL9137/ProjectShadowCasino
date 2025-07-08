import React from 'react';
import { useDebug } from '@/hooks/use-debug';
import { conditionalClass, debugAwareClass } from '@/utils/classNames';

interface DebugWrapperProps {
  children: React.ReactNode;
  className?: string;
  baseClasses: string;
  fancyClasses?: {
    animations?: string;
    gradients?: string;
    shadows?: string;
    effects?: string;
  };
}

/**
 * DebugWrapper component that conditionally applies fancy styling based on debug mode
 * When debug mode is enabled, only base classes are applied for maximum performance
 */
export function DebugWrapper({
  children,
  className = '',
  baseClasses,
  fancyClasses = {}
}: DebugWrapperProps) {
  const { debugMode } = useDebug();

  const finalClassName = [
    debugAwareClass(baseClasses, debugMode, fancyClasses),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={finalClassName}>
      {children}
    </div>
  );
}

/**
 * Hook for getting debug-aware classes without wrapping components
 */
export function useDebugClasses(
  baseClasses: string,
  fancyClasses: string = ''
) {
  const { debugMode } = useDebug();
  return conditionalClass(baseClasses, debugMode, fancyClasses);
}

/**
 * Higher-order component for wrapping existing components with debug awareness
 */
export function withDebugMode<T extends object>(
  Component: React.ComponentType<T>,
  baseClasses: string,
  fancyClasses: string = ''
) {
  return function DebugAwareComponent(props: T) {
    const className = useDebugClasses(baseClasses, fancyClasses);
    
    return (
      <div className={className}>
        <Component {...props} />
      </div>
    );
  };
}