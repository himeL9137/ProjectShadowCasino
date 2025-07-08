import { useEffect } from 'react';
import { useDebug } from '@/hooks/use-debug';

/**
 * Enhanced DebugProvider manages granular debug mode state and applies specific CSS classes
 * for different performance optimizations when debug mode is enabled
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  const { debugMode, settings } = useDebug();

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // List of all possible debug classes
    const debugClasses = [
      'debug-mode',
      'disable-animations',
      'disable-gradients', 
      'disable-shadows',
      'disable-blur',
      'disable-hover',
      'simplify-borders',
      'reduced-motion',
      'low-quality',
      'disable-particles',
      'performance-off',
      'performance-balanced',
      'performance-maximum'
    ];

    // Remove all debug classes first
    debugClasses.forEach(className => {
      htmlElement.classList.remove(className);
      bodyElement.classList.remove(className);
    });

    if (debugMode) {
      // Apply base debug-mode class
      htmlElement.classList.add('debug-mode');
      bodyElement.classList.add('debug-mode');

      // Apply specific optimization classes based on settings
      if (settings.disableAnimations) {
        htmlElement.classList.add('disable-animations');
        bodyElement.classList.add('disable-animations');
      }

      if (settings.disableGradients) {
        htmlElement.classList.add('disable-gradients');
        bodyElement.classList.add('disable-gradients');
      }

      if (settings.disableShadows) {
        htmlElement.classList.add('disable-shadows');
        bodyElement.classList.add('disable-shadows');
      }

      if (settings.disableBlurEffects) {
        htmlElement.classList.add('disable-blur');
        bodyElement.classList.add('disable-blur');
      }

      if (settings.disableHoverEffects) {
        htmlElement.classList.add('disable-hover');
        bodyElement.classList.add('disable-hover');
      }

      if (settings.simplifyBorders) {
        htmlElement.classList.add('simplify-borders');
        bodyElement.classList.add('simplify-borders');
      }

      if (settings.reducedMotion) {
        htmlElement.classList.add('reduced-motion');
        bodyElement.classList.add('reduced-motion');
      }

      if (settings.lowQualityImages) {
        htmlElement.classList.add('low-quality');
        bodyElement.classList.add('low-quality');
      }

      if (settings.disableParticles) {
        htmlElement.classList.add('disable-particles');
        bodyElement.classList.add('disable-particles');
      }

      // Apply performance mode classes
      const performanceClass = `performance-${settings.performanceMode}`;
      htmlElement.classList.add(performanceClass);
      bodyElement.classList.add(performanceClass);

      console.log(`🔧 Debug mode enabled - ${settings.performanceMode} performance mode active`);
      console.log('🎯 Active optimizations:', {
        animations: settings.disableAnimations,
        gradients: settings.disableGradients,
        shadows: settings.disableShadows,
        blur: settings.disableBlurEffects,
        hover: settings.disableHoverEffects,
        particles: settings.disableParticles
      });
    } else {
      console.log('✨ Debug mode disabled - all visual effects restored');
    }

    // Cleanup on unmount
    return () => {
      debugClasses.forEach(className => {
        htmlElement.classList.remove(className);
        bodyElement.classList.remove(className);
      });
    };
  }, [debugMode, settings]);

  return <>{children}</>;
}