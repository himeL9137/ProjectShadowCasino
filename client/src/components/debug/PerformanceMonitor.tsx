import React, { useEffect, useState, useRef } from 'react';
import { useDebug } from '@/hooks/use-debug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, HardDrive, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  jsHeapSize: number;
  timestamp: number;
  componentCount: number;
}

interface FPSCalculator {
  frames: number;
  lastTime: number;
  fps: number;
}

export function PerformanceMonitor() {
  const { debugMode, estimatedPerformanceGain } = useDebug();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    jsHeapSize: 0,
    timestamp: Date.now(),
    componentCount: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const fpsRef = useRef<FPSCalculator>({ frames: 0, lastTime: performance.now(), fps: 0 });
  const animationFrameRef = useRef<number>();

  // Count React components on page
  const countComponents = () => {
    // Estimate based on React fiber nodes
    const reactRoots = document.querySelectorAll('[data-reactroot], #root, .react-component');
    const allElements = document.querySelectorAll('*');
    const estimatedComponents = Math.floor(allElements.length / 8); // Rough estimate
    return estimatedComponents;
  };

  // FPS measurement using requestAnimationFrame
  const measureFPS = () => {
    const now = performance.now();
    const delta = now - fpsRef.current.lastTime;
    fpsRef.current.frames++;

    if (delta >= 1000) { // Update FPS every second
      fpsRef.current.fps = Math.round((fpsRef.current.frames * 1000) / delta);
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;
    }

    if (isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }
  };

  // Collect performance metrics
  const collectMetrics = () => {
    const now = performance.now();
    
    // Memory information (if available)
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
    const jsHeapSize = memoryInfo ? memoryInfo.totalJSHeapSize / 1024 / 1024 : 0;

    // Render time estimation
    const renderStart = performance.now();
    setTimeout(() => {
      const renderTime = performance.now() - renderStart;
      
      setMetrics(prev => ({
        ...prev,
        fps: fpsRef.current.fps,
        renderTime,
        memoryUsage,
        jsHeapSize,
        timestamp: now,
        componentCount: countComponents()
      }));
    }, 0);
  };

  useEffect(() => {
    if (debugMode) {
      setIsMonitoring(true);
      animationFrameRef.current = requestAnimationFrame(measureFPS);
      
      const interval = setInterval(collectMetrics, 2000); // Update every 2 seconds
      
      return () => {
        setIsMonitoring(false);
        clearInterval(interval);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setIsMonitoring(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [debugMode]);

  if (!debugMode) return null;

  const getPerformanceColor = (value: number, type: 'fps' | 'memory' | 'render') => {
    switch (type) {
      case 'fps':
        if (value >= 55) return 'text-green-600';
        if (value >= 30) return 'text-yellow-600';
        return 'text-red-600';
      case 'memory':
        if (value <= 50) return 'text-green-600';
        if (value <= 100) return 'text-yellow-600';
        return 'text-red-600';
      case 'render':
        if (value <= 16) return 'text-green-600';
        if (value <= 32) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPerformanceIcon = (value: number, type: 'fps' | 'memory' | 'render') => {
    const isGood = (type === 'fps' && value >= 55) || 
                   (type === 'memory' && value <= 50) || 
                   (type === 'render' && value <= 16);
    return isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-blue-600" />
          Performance Monitor
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FPS Monitor */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              FPS (Target: 60)
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${getPerformanceColor(metrics.fps, 'fps')}`}>
              {getPerformanceIcon(metrics.fps, 'fps')}
              {metrics.fps} fps
            </div>
          </div>
          <div className="w-24">
            <Progress value={Math.min((metrics.fps / 60) * 100, 100)} className="h-2" />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              Memory Usage
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${getPerformanceColor(metrics.memoryUsage, 'memory')}`}>
              {getPerformanceIcon(metrics.memoryUsage, 'memory')}
              {metrics.memoryUsage.toFixed(1)} MB
            </div>
          </div>
          <div className="w-24">
            <Progress value={Math.min((metrics.memoryUsage / 100) * 100, 100)} className="h-2" />
          </div>
        </div>

        {/* Render Time */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Render Time
            </div>
            <div className={`text-sm font-medium flex items-center gap-1 ${getPerformanceColor(metrics.renderTime, 'render')}`}>
              {getPerformanceIcon(metrics.renderTime, 'render')}
              {metrics.renderTime.toFixed(1)}ms
            </div>
          </div>
          <div className="w-24">
            <Progress value={Math.min((metrics.renderTime / 50) * 100, 100)} className="h-2" />
          </div>
        </div>

        {/* Performance Gain */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Debug Mode Gain</div>
            <div className="text-sm font-medium text-green-600">
              +{estimatedPerformanceGain.toFixed(1)}% Performance
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.componentCount} Components
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-2 bg-background rounded-md">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-muted-foreground">
              {isMonitoring ? 'Actively monitoring performance' : 'Performance monitoring paused'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}