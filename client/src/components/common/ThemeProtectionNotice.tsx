import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, X, CheckCircle, Download, 
  RotateCcw, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { themeManager } from "@/lib/theme-manager";
import { ThemeRecovery } from "./ThemeRecovery";

export function ThemeProtectionNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has seen this notice before
    const hasSeenNotice = localStorage.getItem("theme-protection-notice-seen");
    const backupInfo = themeManager.getBackupInfo();
    
    setHasBackup(!!backupInfo);
    
    // Show notice if user hasn't seen it or if there's no backup
    if (!hasSeenNotice || !backupInfo) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("theme-protection-notice-seen", "true");
  };

  const handleCreateBackup = () => {
    try {
      // Get current theme preferences
      const preferences = themeManager.getThemePreferences();
      const allThemes = themeManager.mergeThemes([]);
      
      // Create backup
      themeManager.createBackup(allThemes, preferences.activeThemeId);
      
      setHasBackup(true);
      toast({
        title: "Backup Created Successfully",
        description: "Your themes are now protected from loss",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Unable to create theme backup",
        variant: "destructive",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-slide-in">
      <Card className="luxury-card border-yellow-500/50 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-yellow-500 glow-text flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Theme Protection Active
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Enhanced theme management system is now active. Your theme preferences 
              will be automatically preserved and protected from unexpected changes.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Automatic theme backup on changes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Custom theme preservation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Favorites and recent themes saved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>One-click theme recovery</span>
              </div>
            </div>

            {!hasBackup && (
              <div className="pt-2">
                <Button 
                  onClick={handleCreateBackup}
                  className="w-full luxury-button"
                  size="sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Create Initial Backup
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <ThemeRecovery />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Got It
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}