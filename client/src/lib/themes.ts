// Advanced Theme System for Project Shadow Casino

export interface Theme {
  id: string;
  name: string;
  class: string;
  description: string;
  category: 'dark' | 'vibrant' | 'elegant' | 'neon' | 'nature' | 'custom';
  mood: 'mysterious' | 'energetic' | 'sophisticated' | 'futuristic' | 'calming' | 'intense';
  popularity: number; // 1-5 stars
  isCustom?: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    muted: string;
  };
  gradients: {
    primary: string;
    background: string;
    card: string;
  };
  animations: {
    duration: string;
    easing: string;
    hover?: string;
    transition?: string;
  };
  gameSpecific?: {
    slots?: { reelGlow: string; symbolHighlight: string; };
    dice?: { dotColor: string; faceGlow: string; };
    plinko?: { ballGlow: string; pegHighlight: string; };
  };
}

// Available themes
export const themes: Theme[] = [
  // Default Theme - Mystic Twilight (Enhanced)
  {
    id: 'mystic-twilight',
    name: 'Mystic Twilight',
    class: 'theme-mystic-twilight',
    description: 'An enchanting purple theme with cosmic gradients and mystical aurora effects',
    category: 'dark',
    mood: 'mysterious',
    popularity: 5,
    colors: {
      primary: '#a855f7',
      secondary: '#8b5cf6',
      accent: '#06ffa5',
      background: '#030014',
      card: '#0f0a1f',
      text: '#f0f9ff',
      success: '#00ff87',
      warning: '#ffd700',
      error: '#ff6b9d',
      muted: '#8b94a8'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 25%, #c084fc 50%, #ec4899 75%, #a855f7 100%)',
      background: 'radial-gradient(ellipse at center, #0f0a1f 0%, #030014 50%, #000000 100%)',
      card: 'linear-gradient(145deg, #0f0a1f 0%, #1e1b4b 30%, #312e81 60%, #0f0a1f 100%)'
    },
    animations: {
      duration: '0.4s',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      hover: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    gameSpecific: {
      slots: { reelGlow: '#8b5cf6', symbolHighlight: '#c084fc' },
      dice: { dotColor: '#f8fafc', faceGlow: '#8b5cf6' },
      plinko: { ballGlow: '#c084fc', pegHighlight: '#8b5cf6' }
    }
  },
  // Emerald Sunset
  {
    id: 'emerald-sunset',
    name: 'Emerald Sunset',
    class: 'theme-emerald-sunset',
    description: 'Nature-inspired emerald theme with warm sunset vibes',
    category: 'nature',
    mood: 'calming',
    popularity: 4,
    colors: {
      primary: '#00ff87',
      secondary: '#10b981',
      accent: '#ffd700',
      background: '#020a08',
      card: '#051512',
      text: '#f0fff4',
      success: '#00ff87',
      warning: '#ffb347',
      error: '#ff6b9d',
      muted: '#6b8068'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #00ff87 0%, #10b981 50%, #065f46 100%)',
      background: 'radial-gradient(ellipse at bottom, #051512 0%, #020a08 70%, #000000 100%)',
      card: 'linear-gradient(145deg, #051512 0%, #0f2922 40%, #134e4a 80%, #051512 100%)'
    },
    animations: {
      duration: '0.4s',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      hover: 'transform 0.25s ease-out',
      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    gameSpecific: {
      slots: { reelGlow: '#10b981', symbolHighlight: '#34d399' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#10b981' },
      plinko: { ballGlow: '#34d399', pegHighlight: '#10b981' }
    }
  },
  // Crimson Noir
  {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    class: 'theme-crimson-noir',
    description: 'Bold red theme with dark noir aesthetics for high-stakes gaming',
    category: 'dark',
    mood: 'intense',
    popularity: 4,
    colors: {
      primary: '#dc2626', // Red
      secondary: '#991b1b',
      accent: '#f87171',
      background: '#190a0a',
      card: '#251111',
      text: '#f5f5f5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      muted: '#6b7280'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
      background: 'linear-gradient(180deg, #190a0a 0%, #251111 100%)',
      card: 'linear-gradient(145deg, #251111 0%, #3f1d1d 100%)'
    },
    animations: {
      duration: '0.2s',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      hover: 'transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      transition: 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    gameSpecific: {
      slots: { reelGlow: '#dc2626', symbolHighlight: '#f87171' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#dc2626' },
      plinko: { ballGlow: '#f87171', pegHighlight: '#dc2626' }
    }
  },
  // Cyber Ice
  {
    id: 'cyber-ice',
    name: 'Cyber Ice',
    class: 'theme-cyber-ice',
    description: 'Futuristic cyan theme with cool ice-blue tones',
    category: 'neon',
    mood: 'futuristic',
    popularity: 5,
    colors: {
      primary: '#00ffff',
      secondary: '#06b6d4',
      accent: '#7dd3fc',
      background: '#020712',
      card: '#0a1420',
      text: '#f0fdff',
      success: '#00ff87',
      warning: '#ffb347',
      error: '#ff6b9d',
      muted: '#64748b'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #00ffff 0%, #06b6d4 50%, #0e7490 100%)',
      background: 'radial-gradient(ellipse at center, #0a1420 0%, #020712 70%, #000000 100%)',
      card: 'linear-gradient(145deg, #0a1420 0%, #164454 40%, #0f3460 80%, #0a1420 100%)'
    },
    animations: {
      duration: '0.3s',
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      hover: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    gameSpecific: {
      slots: { reelGlow: '#06b6d4', symbolHighlight: '#22d3ee' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#06b6d4' },
      plinko: { ballGlow: '#22d3ee', pegHighlight: '#06b6d4' }
    }
  },
  // Solar Dusk
  {
    id: 'solar-dusk',
    name: 'Solar Dusk',
    class: 'theme-solar-dusk',
    description: 'Warm amber theme inspired by golden hour sunsets',
    category: 'vibrant',
    mood: 'energetic',
    popularity: 4,
    colors: {
      primary: '#ffa500',
      secondary: '#f59e0b',
      accent: '#ffeb3b',
      background: '#0a0702',
      card: '#1a1208',
      text: '#fff8e1',
      success: '#00ff87',
      warning: '#ffb347',
      error: '#ff6b9d',
      muted: '#92844a'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ffa500 0%, #f59e0b 50%, #b45309 100%)',
      background: 'radial-gradient(ellipse at bottom, #1a1208 0%, #0a0702 70%, #000000 100%)',
      card: 'linear-gradient(145deg, #1a1208 0%, #251e13 40%, #3d2f1f 80%, #1a1208 100%)'
    },
    animations: {
      duration: '0.35s',
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
    },
    gameSpecific: {
      slots: { reelGlow: '#f59e0b', symbolHighlight: '#fbbf24' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#f59e0b' },
      plinko: { ballGlow: '#fbbf24', pegHighlight: '#f59e0b' }
    }
  },
  // Obsidian Rose
  {
    id: 'obsidian-rose',
    name: 'Obsidian Rose',
    class: 'theme-obsidian-rose',
    description: 'Elegant pink theme with dark obsidian undertones',
    category: 'elegant',
    mood: 'sophisticated',
    popularity: 3,
    colors: {
      primary: '#ec4899', // Pink
      secondary: '#be185d',
      accent: '#f472b6',
      background: '#18020f',
      card: '#3f0d2b',
      text: '#f5f5f5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      muted: '#6b7280'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      background: 'linear-gradient(180deg, #18020f 0%, #3f0d2b 100%)',
      card: 'linear-gradient(145deg, #3f0d2b 0%, #5d1a3f 100%)'
    },
    animations: {
      duration: '0.4s',
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    },
    gameSpecific: {
      slots: { reelGlow: '#ec4899', symbolHighlight: '#f472b6' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#ec4899' },
      plinko: { ballGlow: '#f472b6', pegHighlight: '#ec4899' }
    }
  },
  // Neo Tokyo
  {
    id: 'neo-tokyo',
    name: 'Neo Tokyo',
    class: 'theme-neo-tokyo',
    description: 'Cyberpunk blue theme inspired by neon-lit Tokyo nights',
    category: 'neon',
    mood: 'futuristic',
    popularity: 5,
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#1e40af',
      accent: '#60a5fa',
      background: '#0a1019',
      card: '#111827',
      text: '#f5f5f5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      muted: '#6b7280'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
      background: 'linear-gradient(180deg, #0a1019 0%, #111827 100%)',
      card: 'linear-gradient(145deg, #111827 0%, #1e293b 100%)'
    },
    animations: {
      duration: '0.25s',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    gameSpecific: {
      slots: { reelGlow: '#2563eb', symbolHighlight: '#60a5fa' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#2563eb' },
      plinko: { ballGlow: '#60a5fa', pegHighlight: '#2563eb' }
    }
  },
  // Ocean Fade
  {
    id: 'ocean-fade',
    name: 'Ocean Fade',
    class: 'theme-ocean-fade',
    description: 'Tranquil teal theme reminiscent of deep ocean waters',
    category: 'nature',
    mood: 'calming',
    popularity: 4,
    colors: {
      primary: '#14b8a6', // Teal
      secondary: '#0f766e',
      accent: '#5eead4',
      background: '#042f2e',
      card: '#134e4a',
      text: '#f5f5f5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      muted: '#6b7280'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #14b8a6 0%, #5eead4 100%)',
      background: 'linear-gradient(180deg, #042f2e 0%, #134e4a 100%)',
      card: 'linear-gradient(145deg, #134e4a 0%, #0f5132 100%)'
    },
    animations: {
      duration: '0.5s',
      easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
    },
    gameSpecific: {
      slots: { reelGlow: '#14b8a6', symbolHighlight: '#5eead4' },
      dice: { dotColor: '#f5f5f5', faceGlow: '#14b8a6' },
      plinko: { ballGlow: '#5eead4', pegHighlight: '#14b8a6' }
    }
  }
];

// Additional free themes
export const additionalThemes: Theme[] = [
  // Galaxy Storm
  {
    id: 'galaxy-storm',
    name: 'Galaxy Storm',
    class: 'theme-galaxy-storm',
    description: 'Epic space theme with cosmic teal and electric blue highlights',
    category: 'neon',
    mood: 'futuristic',
    popularity: 5,
    colors: {
      primary: '#00d4ff',
      secondary: '#0891b2',
      accent: '#7dd3fc',
      background: '#001420',
      card: '#0c2a35',
      text: '#e0f7ff',
      success: '#00ff87',
      warning: '#ffd700',
      error: '#ff6b9d',
      muted: '#64a3b8'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #00d4ff 0%, #0891b2 50%, #155e75 100%)',
      background: 'radial-gradient(ellipse at top, #0c2a35 0%, #001420 70%, #000000 100%)',
      card: 'linear-gradient(145deg, #0c2a35 0%, #164e63 40%, #0e7490 80%, #0c2a35 100%)'
    },
    animations: {
      duration: '0.6s',
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    gameSpecific: {
      slots: { reelGlow: '#00d4ff', symbolHighlight: '#7dd3fc' },
      dice: { dotColor: '#f8fafc', faceGlow: '#00d4ff' },
      plinko: { ballGlow: '#7dd3fc', pegHighlight: '#00d4ff' }
    }
  },
  // Neon Arcade
  {
    id: 'neon-arcade',
    name: 'Neon Arcade',
    class: 'theme-neon-arcade',
    description: 'Retro 80s arcade theme with vibrant neon colors',
    category: 'neon',
    mood: 'energetic',
    popularity: 4,
    colors: {
      primary: '#ff0080',
      secondary: '#c71585',
      accent: '#00ff7f',
      background: '#050005',
      card: '#1a001a',
      text: '#ffffff',
      success: '#00ff87',
      warning: '#ffd700',
      error: '#ff6b9d',
      muted: '#8a2be2'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff0080 0%, #c71585 25%, #8b008b 50%, #4b0082 75%, #ff0080 100%)',
      background: 'radial-gradient(ellipse at center, #1a001a 0%, #050005 70%, #000000 100%)',
      card: 'linear-gradient(145deg, #1a001a 0%, #330066 40%, #4b0082 80%, #1a001a 100%)'
    },
    animations: {
      duration: '0.3s',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    gameSpecific: {
      slots: { reelGlow: '#ff0080', symbolHighlight: '#00ff80' },
      dice: { dotColor: '#ffffff', faceGlow: '#ff0080' },
      plinko: { ballGlow: '#00ff80', pegHighlight: '#8000ff' }
    }
  }
];

// Combine all themes
export const allThemes = [...themes, ...additionalThemes];

// Theme utilities and advanced features
export interface ThemePreferences {
  autoTheme: boolean;
  favoriteThemes: string[];
  scheduledThemes: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  gameSpecificThemes: {
    slots: string;
    dice: string;
    plinko: string;
  };
}

export const defaultThemePreferences: ThemePreferences = {
  autoTheme: false,
  favoriteThemes: ['mystic-twilight'],
  scheduledThemes: {
    morning: 'solar-dusk',
    afternoon: 'emerald-sunset',
    evening: 'mystic-twilight',
    night: 'neo-tokyo'
  },
  gameSpecificThemes: {
    slots: 'mystic-twilight',
    dice: 'crimson-noir',
    plinko: 'cyber-ice'
  }
};

/**
 * Get theme by ID from all available themes
 * @param id Theme ID
 * @returns Theme object or default theme if not found
 */
export function getThemeById(id: string): Theme {
  const theme = allThemes.find(theme => theme.id === id);
  return theme || themes[0]; // Return default theme if not found
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: Theme['category']): Theme[] {
  return allThemes.filter(theme => theme.category === category);
}

/**
 * Get themes by mood
 */
export function getThemesByMood(mood: Theme['mood']): Theme[] {
  return allThemes.filter(theme => theme.mood === mood);
}

/**
 * Get popular themes (4+ stars)
 */
export function getPopularThemes(): Theme[] {
  return allThemes.filter(theme => theme.popularity >= 4).sort((a, b) => b.popularity - a.popularity);
}



/**
 * Get recommended theme based on time of day
 */
export function getTimeBasedTheme(): Theme {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return getThemeById('solar-dusk'); // Morning
  } else if (hour >= 12 && hour < 18) {
    return getThemeById('emerald-sunset'); // Afternoon
  } else if (hour >= 18 && hour < 22) {
    return getThemeById('mystic-twilight'); // Evening
  } else {
    return getThemeById('neo-tokyo'); // Night
  }
}

/**
 * Get recommended theme for specific game
 */
export function getGameRecommendedTheme(gameType: 'slots' | 'dice' | 'plinko'): Theme {
  const recommendations = {
    slots: 'galaxy-storm',
    dice: 'crimson-noir',
    plinko: 'cyber-ice'
  };
  
  return getThemeById(recommendations[gameType]);
}

/**
 * Search themes by name or description
 */
export function searchThemes(query: string): Theme[] {
  const lowercaseQuery = query.toLowerCase();
  return allThemes.filter(theme => 
    theme.name.toLowerCase().includes(lowercaseQuery) ||
    theme.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Set the active theme by updating CSS variables
 * @param themeId Theme ID to activate
 */
export function setActiveTheme(themeId: string): void {
  const theme = getThemeById(themeId);
  
  // Apply theme class to body element - this is the main approach now
  // The CSS in index.css uses this class to style elements
  document.body.className = document.body.className
    .replace(/theme-[\w-]+/g, '') // Remove any existing theme classes
    .trim();
  document.body.classList.add(theme.class);
  
  // For backwards compatibility and components that still use the older CSS vars directly
  // we'll also set the legacy variables
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-card', theme.colors.card);
  root.style.setProperty('--color-text', theme.colors.text);
  
  // Debugging info to help identify theme changes
  console.log(`Theme changed to: ${theme.name}`);
  
  // Save to localStorage
  localStorage.setItem('project-shadow-casino-theme', themeId);
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values to get r, g, and b
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  }

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  let h = 0, s = 0, l = (max + min) / 2;

  // Calculate saturation
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    // Calculate hue
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l };
}

/**
 * Adjust lightness of an HSL color
 */
function adjustLightness(hsl: { h: number; s: number; l: number }, factor: number): { h: number; s: number; l: number } {
  return {
    h: hsl.h,
    s: hsl.s,
    l: Math.min(Math.max(hsl.l * factor, 0), 100) // Ensure lightness is between 0-100
  };
}

/**
 * Initialize theme from localStorage or use default
 */
export function initializeTheme(): void {
  const savedTheme = localStorage.getItem('project-shadow-casino-theme') || localStorage.getItem('shadow-casino-theme');
  // Set the active theme (or default to Mystic Twilight)
  // This function will handle applying the theme class and variables
  setActiveTheme(savedTheme || 'mystic-twilight');
  
  // Make sure document has a theme class on the body
  if (!document.body.className.includes('theme-')) {
    const themeId = savedTheme || 'mystic-twilight';
    const theme = getThemeById(themeId);
    document.body.classList.add(theme.class);
  }
}