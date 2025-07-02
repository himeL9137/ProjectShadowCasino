import { createContext, ReactNode, useEffect, useState } from "react";
import { getThemeById, initializeTheme, setActiveTheme, allThemes, themes, Theme } from "@/lib/themes";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isTransitioning?: boolean;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    // Initialize theme from localStorage on component mount
    const savedThemeId = localStorage.getItem("shadow-casino-theme") || "shiny-black-white";
    const theme = getThemeById(savedThemeId);
    setCurrentTheme(theme);
    
    // Apply theme with smooth transition
    applyThemeWithTransition(theme, false);
    
    initializeTheme(); // Set CSS variables
  }, []);

  const applyThemeWithTransition = (theme: Theme, withTransition = true) => {
    if (withTransition) {
      setIsTransitioning(true);
      
      // Enhanced transition properties for ultra-smooth theme changes
      const transitionProperties = [
        'background-color',
        'background-image',
        'color',
        'border-color',
        'box-shadow',
        'backdrop-filter',
        'opacity',
        'transform'
      ].join(', ');
      
      // Apply smooth transition to body
      document.body.style.transition = `${transitionProperties} ${theme.animations.duration} ${theme.animations.easing}`;
      
      // Create enhanced transition styles for all elements
      const style = document.createElement('style');
      style.id = 'theme-transition-style';
      style.textContent = `
        *, *::before, *::after {
          transition: ${transitionProperties} ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Enhanced card transitions */
        .card, [class*="card"] {
          transition: all ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Smooth button transitions */
        button, [role="button"] {
          transition: all ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Input field transitions */
        input, textarea, select {
          transition: all ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Enhanced navigation transitions */
        nav, .nav-item, .sidebar {
          transition: all ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Gradient transitions */
        [style*="gradient"], [class*="gradient"] {
          transition: background ${theme.animations.duration} ${theme.animations.easing} !important;
        }
        
        /* Prevent jarring layout shifts during transition */
        .theme-transitioning * {
          will-change: background-color, color, border-color, box-shadow;
        }
      `;
      document.head.appendChild(style);
      
      // Add subtle fade effect during transition
      document.body.style.filter = 'brightness(0.95)';
      
      // Remove transition styles and effects after animation
      setTimeout(() => {
        const transitionStyle = document.getElementById('theme-transition-style');
        if (transitionStyle) {
          transitionStyle.remove();
        }
        document.body.style.filter = '';
      }, parseFloat(theme.animations.duration) * 1000);
    }
    
    // Apply theme class to body element
    document.body.className = document.body.className
      .replace(/theme-[\w-]+/g, '') // Remove any existing theme classes
      .trim();
    document.body.classList.add(theme.class);
    
    // Set CSS custom properties for the theme with enhanced coverage
    const root = document.documentElement;
    
    // Primary theme colors
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-card', theme.colors.card);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    root.style.setProperty('--theme-error', theme.colors.error);
    root.style.setProperty('--theme-muted', theme.colors.muted);
    
    // Gradient backgrounds
    root.style.setProperty('--theme-gradient-primary', theme.gradients.primary);
    root.style.setProperty('--theme-gradient-background', theme.gradients.background);
    root.style.setProperty('--theme-gradient-card', theme.gradients.card);
    
    // Animation properties
    root.style.setProperty('--theme-animation-duration', theme.animations.duration);
    root.style.setProperty('--theme-animation-easing', theme.animations.easing);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    root.style.setProperty('--theme-error', theme.colors.error);
    root.style.setProperty('--theme-muted', theme.colors.muted);
    root.style.setProperty('--theme-gradient-primary', theme.gradients.primary);
    root.style.setProperty('--theme-gradient-background', theme.gradients.background);
    root.style.setProperty('--theme-gradient-card', theme.gradients.card);
    
    if (withTransition) {
      // Remove transition after animation completes
      setTimeout(() => {
        document.body.style.transition = '';
        setIsTransitioning(false);
      }, parseFloat(theme.animations.duration) * 1000);
    }
  };
  
  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
    
    // Save to localStorage
    localStorage.setItem("shadow-casino-theme", themeId);
    
    // Apply theme with smooth transition
    applyThemeWithTransition(theme, true);
    
    // Log theme change for debugging
    console.log(`Theme changed to: ${theme.name}`);
    
    setActiveTheme(themeId);
  };
  
  // Apply the theme class to the main wrapper for proper scoping
  return (
    <ThemeContext.Provider 
      value={{ 
        currentTheme, 
        setTheme,
        availableThemes: allThemes,
        isTransitioning
      }}
    >
      <div 
        className={`app-wrapper ${currentTheme.class} ${isTransitioning ? 'theme-transitioning' : ''}`}
        style={{
          background: currentTheme.gradients.background,
          transition: isTransitioning ? `all ${currentTheme.animations.duration} ${currentTheme.animations.easing}` : 'none'
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}