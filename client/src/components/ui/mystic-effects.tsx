import React from 'react';
import { cn } from '@/lib/utils';

interface MysticGlowProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function MysticGlow({ children, intensity = 'medium', color = 'primary', className }: MysticGlowProps) {
  const intensityClasses = {
    low: 'glow-low',
    medium: 'glow-primary', 
    high: 'glow-high'
  };

  const colorClasses = {
    primary: 'glow-primary',
    secondary: 'glow-secondary',
    accent: 'glow-accent'
  };

  return (
    <div className={cn(intensityClasses[intensity], colorClasses[color], className)}>
      {children}
    </div>
  );
}

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function AuroraBackground({ children, className, animate = true }: AuroraBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className={cn('aurora-effect absolute inset-0', animate && 'animate-aurora')} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export function FloatingParticles({ count = 20, className }: FloatingParticlesProps) {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <div
          key={particle}
          className="absolute w-1 h-1 bg-accent rounded-full animate-float opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

interface GradientTextProps {
  children: React.ReactNode;
  gradient?: 'primary' | 'secondary' | 'mystic';
  className?: string;
}

export function GradientText({ children, gradient = 'primary', className }: GradientTextProps) {
  const gradients = {
    primary: 'bg-gradient-to-r from-primary to-accent',
    secondary: 'bg-gradient-to-r from-secondary to-primary',
    mystic: 'bg-gradient-to-r from-violet-400 via-pink-500 to-purple-600'
  };

  return (
    <span className={cn(
      gradients[gradient],
      'bg-clip-text text-transparent font-semibold',
      className
    )}>
      {children}
    </span>
  );
}

interface PulsingOrbProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function PulsingOrb({ size = 'md', color = 'primary', className }: PulsingOrbProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colors = {
    primary: 'bg-primary/20 border-primary',
    secondary: 'bg-secondary/20 border-secondary',
    accent: 'bg-accent/20 border-accent'
  };

  return (
    <div className={cn(
      'relative rounded-full border-2 animate-pulse',
      sizes[size],
      colors[color],
      className
    )}>
      <div className="absolute inset-2 rounded-full bg-current opacity-60 animate-ping" />
      <div className="absolute inset-4 rounded-full bg-current" />
    </div>
  );
}

interface ShimmerEffectProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export function ShimmerEffect({ children, direction = 'horizontal', speed = 'normal', className }: ShimmerEffectProps) {
  const directions = {
    horizontal: 'bg-gradient-to-r',
    vertical: 'bg-gradient-to-b', 
    diagonal: 'bg-gradient-to-br'
  };

  const speeds = {
    slow: 'animate-shimmer-slow',
    normal: 'animate-shimmer',
    fast: 'animate-shimmer-fast'
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className={cn(
        'absolute inset-0 -translate-x-full',
        directions[direction],
        speeds[speed],
        'from-transparent via-white/10 to-transparent'
      )} />
      {children}
    </div>
  );
}

// Hook for theme-aware animations
export function useMysticAnimations() {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}