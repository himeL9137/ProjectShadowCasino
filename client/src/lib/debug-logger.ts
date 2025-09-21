/**
 * Centralized Debug Logger
 * Reduces console spam while preserving important logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogConfig {
  level: LogLevel;
  enabledCategories: Set<string>;
  throttledMessages: Map<string, number>;
  throttleDelay: number;
}

class DebugLogger {
  private config: LogConfig = {
    level: LogLevel.WARN, // Default to WARN in production
    enabledCategories: new Set(['auth', 'api', 'websocket', 'theme']),
    throttledMessages: new Map(),
    throttleDelay: 5000 // 5 seconds
  };

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.config.level = LogLevel.INFO;
    } else {
      this.config.level = LogLevel.WARN;
    }

    // Check for user debug preference
    const userDebugMode = localStorage.getItem('debug-mode');
    if (userDebugMode === 'true') {
      this.config.level = LogLevel.DEBUG;
    } else if (userDebugMode === 'false') {
      this.config.level = LogLevel.WARN;
    }

    // Check for environment override
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL;
    if (envLogLevel) {
      switch (envLogLevel.toUpperCase()) {
        case 'ERROR':
          this.config.level = LogLevel.ERROR;
          break;
        case 'WARN':
          this.config.level = LogLevel.WARN;
          break;
        case 'INFO':
          this.config.level = LogLevel.INFO;
          break;
        case 'DEBUG':
          this.config.level = LogLevel.DEBUG;
          break;
      }
    }
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    // Check log level
    if (level > this.config.level) {
      return false;
    }

    // Check category filtering
    if (category && !this.config.enabledCategories.has(category)) {
      return false;
    }

    return true;
  }

  private shouldThrottle(message: string): boolean {
    const now = Date.now();
    const lastLogged = this.config.throttledMessages.get(message);
    
    if (lastLogged && (now - lastLogged) < this.config.throttleDelay) {
      return true;
    }

    this.config.throttledMessages.set(message, now);
    return false;
  }

  private formatMessage(category: string | undefined, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = category ? `[${timestamp}] [${category.toUpperCase()}]` : `[${timestamp}]`;
    return [`${prefix} ${message}`, ...args];
  }

  error(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(...this.formatMessage(category, message, ...args));
    }
  }

  warn(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(...this.formatMessage(category, message, ...args));
    }
  }

  info(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.info(...this.formatMessage(category, message, ...args));
    }
  }

  debug(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.debug(...this.formatMessage(category, message, ...args));
    }
  }

  // Throttled logging for repetitive messages
  throttledInfo(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, category) && !this.shouldThrottle(message)) {
      console.info(...this.formatMessage(category, `[THROTTLED] ${message}`, ...args));
    }
  }

  throttledDebug(message: string, category?: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, category) && !this.shouldThrottle(message)) {
      console.debug(...this.formatMessage(category, `[THROTTLED] ${message}`, ...args));
    }
  }

  // Configuration methods
  setLogLevel(level: LogLevel) {
    this.config.level = level;
    localStorage.setItem('debug-mode', level >= LogLevel.DEBUG ? 'true' : 'false');
  }

  enableCategory(category: string) {
    this.config.enabledCategories.add(category);
  }

  disableCategory(category: string) {
    this.config.enabledCategories.delete(category);
  }

  getConfig() {
    return {
      level: this.config.level,
      categories: Array.from(this.config.enabledCategories),
      isDevelopment: import.meta.env.DEV
    };
  }

  // Method to clear throttle cache (useful for testing)
  clearThrottleCache() {
    this.config.throttledMessages.clear();
  }
}

// Create singleton instance
export const logger = new DebugLogger();

// Convenience functions for common categories
export const authLogger = {
  error: (message: string, ...args: any[]) => logger.error(message, 'auth', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'auth', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'auth', ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, 'auth', ...args),
};

export const apiLogger = {
  error: (message: string, ...args: any[]) => logger.error(message, 'api', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'api', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'api', ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, 'api', ...args),
  throttledDebug: (message: string, ...args: any[]) => logger.throttledDebug(message, 'api', ...args),
};

export const wsLogger = {
  error: (message: string, ...args: any[]) => logger.error(message, 'websocket', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'websocket', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'websocket', ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, 'websocket', ...args),
  throttledInfo: (message: string, ...args: any[]) => logger.throttledInfo(message, 'websocket', ...args),
};

export const themeLogger = {
  error: (message: string, ...args: any[]) => logger.error(message, 'theme', ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, 'theme', ...args),
  info: (message: string, ...args: any[]) => logger.info(message, 'theme', ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, 'theme', ...args),
};