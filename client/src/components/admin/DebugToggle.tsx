import { useDebug } from "@/hooks/use-debug";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bug, Zap } from "lucide-react";

export default function DebugToggle() {
  const { debugMode, setDebugMode } = useDebug();
  const { user } = useAuth();

  // Only show to shadowHimel
  if (!user || user.username !== "shadowHimel") {
    return null;
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="h-5 w-5 text-amber-600" />
          Debug Mode
          <Badge variant={debugMode ? "destructive" : "secondary"} className="ml-auto">
            {debugMode ? "ON" : "OFF"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label 
              htmlFor="debug-toggle" 
              className="text-sm font-medium flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Performance Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              {debugMode 
                ? "Visuals stripped for maximum performance" 
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
          <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              ⚡ Debug mode active - animations, gradients, and effects disabled for optimal performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}