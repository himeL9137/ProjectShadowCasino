import { useDebug } from "@/hooks/use-debug";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bug, 
  Zap, 
  Settings, 
  Monitor, 
  Gauge, 
  ChevronDown, 
  ChevronUp,
  Activity,
  MemoryStick,
  Timer,
  Eye,
  Palette,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { PerformanceMonitor } from "../debug/PerformanceMonitor";

export default function DebugToggle() {
  const { 
    debugMode, 
    settings, 
    metrics,
    setDebugMode, 
    setPerformanceMode,
    updateSettings,
    getPerformanceLevel,
    estimatedPerformanceGain,
    memoryUsage
  } = useDebug();
  const { user } = useAuth();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Only show to shadowHimel
  if (!user || user.username !== "shadowHimel") {
    return null;
  }

  const performanceLevel = getPerformanceLevel();

  const performanceModeOptions = [
    { value: 'off', label: 'Off', description: 'All effects enabled', color: 'text-green-600' },
    { value: 'balanced', label: 'Balanced', description: 'Some effects disabled', color: 'text-yellow-600' },
    { value: 'maximum', label: 'Maximum', description: 'All effects disabled', color: 'text-red-600' }
  ];

  const currentModeOption = performanceModeOptions.find(option => option.value === performanceLevel);

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="h-5 w-5 text-amber-600" />
          Debug & Performance Mode
          <Badge variant={debugMode ? "destructive" : "secondary"} className="ml-auto">
            {debugMode ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label 
              htmlFor="debug-toggle" 
              className="text-sm font-medium flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Enable Debug Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              {debugMode 
                ? "Performance optimizations active" 
                : "All visual effects enabled"
              }
            </p>
          </div>
          <Switch
            id="debug-toggle"
            checked={debugMode}
            onCheckedChange={setDebugMode}
            className="data-[state=checked]:bg-amber-600"
          />
        </div>

        {debugMode && (
          <>
            <Separator />
            
            {/* Performance Mode Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Performance Level
              </Label>
              <Select value={performanceLevel} onValueChange={setPerformanceMode}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className={currentModeOption?.color}>
                        {currentModeOption?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        - {currentModeOption?.description}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {performanceModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className={option.color}>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          - {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Performance Gain
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={estimatedPerformanceGain} className="flex-1" />
                  <span className="text-xs font-medium text-green-600">
                    {estimatedPerformanceGain.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MemoryStick className="h-3 w-3" />
                  Memory Usage
                </div>
                <div className="text-sm font-medium">
                  {memoryUsage > 0 ? `${memoryUsage.toFixed(1)} MB` : 'Monitoring...'}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Advanced Settings</span>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {/* Individual Setting Toggles */}
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      Disable Animations
                    </Label>
                    <Switch
                      checked={settings.disableAnimations}
                      onCheckedChange={(checked) => updateSettings({ disableAnimations: checked })}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Palette className="h-3 w-3" />
                      Disable Gradients
                    </Label>
                    <Switch
                      checked={settings.disableGradients}
                      onCheckedChange={(checked) => updateSettings({ disableGradients: checked })}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Disable Shadows
                    </Label>
                    <Switch
                      checked={settings.disableShadows}
                      onCheckedChange={(checked) => updateSettings({ disableShadows: checked })}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Monitor className="h-3 w-3" />
                      Disable Blur Effects
                    </Label>
                    <Switch
                      checked={settings.disableBlurEffects}
                      onCheckedChange={(checked) => updateSettings({ disableBlurEffects: checked })}
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Timer className="h-3 w-3" />
                      Reduced Motion
                    </Label>
                    <Switch
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
                      size="sm"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Status Info */}
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Debug Mode Active - {currentModeOption?.label} Performance
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {settings.disableAnimations && "🚫 Animations disabled"} {" "}
                    {settings.disableGradients && "🎨 Gradients disabled"} {" "}
                    {settings.disableShadows && "👁️ Shadows disabled"} {" "}
                    {settings.disableBlurEffects && "🌫️ Blur disabled"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Performance Monitor */}
        {debugMode && (
          <div className="mt-4">
            <PerformanceMonitor />
          </div>
        )}
      </CardContent>
    </Card>
  );
}