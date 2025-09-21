import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger, LogLevel } from '@/lib/debug-logger';
import { Badge } from '@/components/ui/badge';
import { Settings, Bug, Eye, EyeOff } from 'lucide-react';

export function DebugModeToggle() {
  const [debugMode, setDebugMode] = useState(false);
  const [logLevel, setLogLevel] = useState<LogLevel>(LogLevel.WARN);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load current debug settings
    const savedDebugMode = localStorage.getItem('debug-mode') === 'true';
    const config = logger.getConfig();
    
    setDebugMode(savedDebugMode);
    setLogLevel(config.level);
  }, []);

  const handleDebugModeChange = (enabled: boolean) => {
    setDebugMode(enabled);
    
    if (enabled) {
      logger.setLogLevel(LogLevel.DEBUG);
      setLogLevel(LogLevel.DEBUG);
      logger.info('Debug mode enabled - All logging categories active', 'debug');
    } else {
      logger.setLogLevel(LogLevel.WARN);
      setLogLevel(LogLevel.WARN);
      logger.info('Debug mode disabled - Only warnings and errors will be shown', 'debug');
    }
  };

  const handleLogLevelChange = (level: string) => {
    const logLevel = parseInt(level) as LogLevel;
    setLogLevel(logLevel);
    logger.setLogLevel(logLevel);
    
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    logger.info(`Log level changed to: ${levelNames[logLevel]}`, 'debug');
  };

  const getLogLevelName = (level: LogLevel): string => {
    const names = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    return names[level] || 'UNKNOWN';
  };

  const getLogLevelColor = (level: LogLevel): string => {
    const colors = ['destructive', 'secondary', 'default', 'outline'];
    return colors[level] || 'default';
  };

  const clearDebugCache = () => {
    logger.clearThrottleCache();
    logger.info('Debug throttle cache cleared', 'debug');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-background/80 backdrop-blur-sm border rounded-full hover:bg-background/90 transition-colors"
        title="Show Debug Controls"
        data-testid="button-show-debug-controls"
      >
        <Settings className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80" data-testid="debug-mode-toggle-container">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              <CardTitle className="text-sm">Debug Controls</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getLogLevelColor(logLevel) as any} className="text-xs">
                {getLogLevelName(logLevel)}
              </Badge>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-muted rounded-sm"
                title="Hide Debug Controls"
                data-testid="button-hide-debug-controls"
              >
                <EyeOff className="h-3 w-3" />
              </button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Control application logging levels and debug output
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Debug Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="debug-mode" className="text-sm font-medium">
                Debug Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable verbose logging for all categories
              </p>
            </div>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={handleDebugModeChange}
              data-testid="switch-debug-mode"
            />
          </div>

          {/* Log Level Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Log Level</Label>
            <Select 
              value={logLevel.toString()} 
              onValueChange={handleLogLevelChange}
              disabled={debugMode}
            >
              <SelectTrigger className="h-8 text-sm" data-testid="select-log-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" data-testid="option-error">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    ERROR
                  </div>
                </SelectItem>
                <SelectItem value="1" data-testid="option-warn">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    WARN
                  </div>
                </SelectItem>
                <SelectItem value="2" data-testid="option-info">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    INFO
                  </div>
                </SelectItem>
                <SelectItem value="3" data-testid="option-debug">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    DEBUG
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {debugMode ? 'Locked to DEBUG while debug mode is enabled' : 'Set minimum log level to display'}
            </p>
          </div>

          {/* Debug Info */}
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Environment</p>
                <p className="font-medium">
                  {import.meta.env.DEV ? 'Development' : 'Production'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Categories</p>
                <p className="font-medium">API, Auth, WebSocket, Theme</p>
              </div>
            </div>
            
            <button
              onClick={clearDebugCache}
              className="mt-2 w-full text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
              data-testid="button-clear-debug-cache"
            >
              Clear Throttle Cache
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}