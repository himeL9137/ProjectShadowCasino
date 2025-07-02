// Enhanced Theme Management System with Persistence
import { Theme } from './themes';

interface ThemeBackup {
  themes: Theme[];
  activeThemeId: string;
  timestamp: number;
  version: string;
}

interface ThemePreferences {
  activeThemeId: string;
  customThemes: Theme[];
  favoriteThemes: string[];
  lastUsedThemes: string[];
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'manual';
}

class ThemeManager {
  private static instance: ThemeManager;
  private readonly STORAGE_KEY = 'shadow-casino-themes';
  private readonly BACKUP_KEY = 'shadow-casino-theme-backup';
  private readonly PREFERENCES_KEY = 'shadow-casino-theme-preferences';
  private readonly VERSION = '2.0.0';

  private constructor() {}

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Load theme preferences from localStorage
  getThemePreferences(): ThemePreferences {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        return {
          activeThemeId: preferences.activeThemeId || 'mystic-twilight',
          customThemes: preferences.customThemes || [],
          favoriteThemes: preferences.favoriteThemes || [],
          lastUsedThemes: preferences.lastUsedThemes || [],
          autoBackup: preferences.autoBackup !== false,
          backupFrequency: preferences.backupFrequency || 'weekly'
        };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }

    // Return default preferences
    return {
      activeThemeId: 'mystic-twilight',
      customThemes: [],
      favoriteThemes: [],
      lastUsedThemes: [],
      autoBackup: true,
      backupFrequency: 'weekly'
    };
  }

  // Save theme preferences to localStorage
  saveThemePreferences(preferences: ThemePreferences): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }

  // Get active theme ID with fallback
  getActiveThemeId(): string {
    const preferences = this.getThemePreferences();
    return preferences.activeThemeId;
  }

  // Set active theme with automatic backup
  setActiveTheme(themeId: string, availableThemes: Theme[]): void {
    const preferences = this.getThemePreferences();
    
    // Update last used themes list
    preferences.lastUsedThemes = [
      themeId,
      ...preferences.lastUsedThemes.filter(id => id !== themeId)
    ].slice(0, 10); // Keep last 10 themes

    preferences.activeThemeId = themeId;
    
    // Auto-backup if enabled
    if (preferences.autoBackup) {
      this.createBackup(availableThemes, themeId);
    }

    this.saveThemePreferences(preferences);
  }

  // Add custom theme
  addCustomTheme(theme: any): void {
    const preferences = this.getThemePreferences();
    
    // Mark as custom theme
    theme.isCustom = true;
    
    // Remove existing theme with same ID
    preferences.customThemes = preferences.customThemes.filter(t => t.id !== theme.id);
    
    // Add new theme
    preferences.customThemes.push(theme);
    
    this.saveThemePreferences(preferences);
  }

  // Remove custom theme
  removeCustomTheme(themeId: string): boolean {
    const preferences = this.getThemePreferences();
    const initialLength = preferences.customThemes.length;
    
    preferences.customThemes = preferences.customThemes.filter(t => t.id !== themeId);
    
    // If this was the active theme, switch to default
    if (preferences.activeThemeId === themeId) {
      preferences.activeThemeId = 'mystic-twilight';
    }

    // Remove from favorites and recent
    preferences.favoriteThemes = preferences.favoriteThemes.filter(id => id !== themeId);
    preferences.lastUsedThemes = preferences.lastUsedThemes.filter(id => id !== themeId);
    
    this.saveThemePreferences(preferences);
    
    return preferences.customThemes.length < initialLength;
  }

  // Toggle theme favorite status
  toggleFavorite(themeId: string): boolean {
    const preferences = this.getThemePreferences();
    
    if (preferences.favoriteThemes.includes(themeId)) {
      preferences.favoriteThemes = preferences.favoriteThemes.filter(id => id !== themeId);
      this.saveThemePreferences(preferences);
      return false;
    } else {
      preferences.favoriteThemes.push(themeId);
      this.saveThemePreferences(preferences);
      return true;
    }
  }

  // Check if theme is favorite
  isFavorite(themeId: string): boolean {
    const preferences = this.getThemePreferences();
    return preferences.favoriteThemes.includes(themeId);
  }

  // Create backup of all themes
  createBackup(allThemes: Theme[], activeThemeId: string): void {
    try {
      const backup: ThemeBackup = {
        themes: allThemes,
        activeThemeId,
        timestamp: Date.now(),
        version: this.VERSION
      };

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to create theme backup:', error);
    }
  }

  // Restore from backup
  restoreFromBackup(): { themes: Theme[], activeThemeId: string } | null {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (stored) {
        const backup: ThemeBackup = JSON.parse(stored);
        
        // Validate backup version compatibility
        if (backup.version && backup.themes && backup.activeThemeId) {
          return {
            themes: backup.themes,
            activeThemeId: backup.activeThemeId
          };
        }
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
    }
    
    return null;
  }

  // Get backup info
  getBackupInfo(): { timestamp: number, version: string } | null {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (stored) {
        const backup: ThemeBackup = JSON.parse(stored);
        return {
          timestamp: backup.timestamp,
          version: backup.version
        };
      }
    } catch (error) {
      console.error('Failed to get backup info:', error);
    }
    
    return null;
  }

  // Export themes for external backup
  exportThemes(allThemes: Theme[], activeThemeId: string): string {
    const exportData = {
      themes: allThemes,
      activeThemeId,
      preferences: this.getThemePreferences(),
      timestamp: Date.now(),
      version: this.VERSION
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import themes from external backup
  importThemes(importData: string): { success: boolean, message: string, themes?: Theme[], activeThemeId?: string } {
    try {
      const data = JSON.parse(importData);
      
      // Validate import data structure
      if (!data.themes || !Array.isArray(data.themes) || !data.activeThemeId) {
        return { success: false, message: 'Invalid import data format' };
      }

      // Validate theme structure
      const validThemes = data.themes.filter(theme => 
        theme.id && theme.name && theme.colors && theme.gradients
      );

      if (validThemes.length === 0) {
        return { success: false, message: 'No valid themes found in import data' };
      }

      // Import preferences if available
      if (data.preferences) {
        this.saveThemePreferences(data.preferences);
      }

      return {
        success: true,
        message: `Successfully imported ${validThemes.length} themes`,
        themes: validThemes,
        activeThemeId: data.activeThemeId
      };

    } catch (error) {
      return { success: false, message: 'Failed to parse import data' };
    }
  }

  // Reset to default themes
  resetToDefaults(): void {
    localStorage.removeItem(this.PREFERENCES_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
  }

  // Get theme usage statistics
  getThemeStats(): { mostUsed: string[], totalCustom: number, totalFavorites: number } {
    const preferences = this.getThemePreferences();
    
    return {
      mostUsed: preferences.lastUsedThemes.slice(0, 5),
      totalCustom: preferences.customThemes.length,
      totalFavorites: preferences.favoriteThemes.length
    };
  }

  // Merge custom themes with default themes
  mergeThemes(defaultThemes: Theme[]): Theme[] {
    const preferences = this.getThemePreferences();
    const customThemes = preferences.customThemes;
    
    // Filter out any default themes that might be duplicated in custom
    const validCustomThemes = customThemes.filter(customTheme => 
      !defaultThemes.some(defaultTheme => defaultTheme.id === customTheme.id)
    );

    return [...defaultThemes, ...validCustomThemes];
  }

  // Validate theme integrity
  validateTheme(theme: any): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!theme.id) errors.push('Theme ID is required');
    if (!theme.name) errors.push('Theme name is required');
    if (!theme.colors) errors.push('Theme colors are required');
    if (!theme.gradients) errors.push('Theme gradients are required');

    // Validate required color properties
    const requiredColors = ['primary', 'secondary', 'accent', 'background', 'card', 'text'] as const;
    requiredColors.forEach(color => {
      if (!theme.colors || !theme.colors[color]) {
        errors.push(`Color '${color}' is required`);
      }
    });

    // Validate required gradient properties
    const requiredGradients = ['primary', 'background', 'card'] as const;
    requiredGradients.forEach(gradient => {
      if (!theme.gradients || !theme.gradients[gradient]) {
        errors.push(`Gradient '${gradient}' is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const themeManager = ThemeManager.getInstance();
export type { ThemePreferences, ThemeBackup };