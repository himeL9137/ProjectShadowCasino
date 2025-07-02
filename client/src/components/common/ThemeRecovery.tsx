import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, RotateCcw, Download, Upload, Save, 
  AlertTriangle, CheckCircle, History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { themeManager } from "@/lib/theme-manager";
import { useTheme } from "@/hooks/use-theme";

export function ThemeRecovery() {
  const [isOpen, setIsOpen] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{ timestamp: number, version: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();
  const { currentTheme, setTheme, availableThemes } = useTheme();

  useEffect(() => {
    const info = themeManager.getBackupInfo();
    setBackupInfo(info);
  }, []);

  const handleQuickRestore = async () => {
    setIsRestoring(true);
    try {
      const backup = themeManager.restoreFromBackup();
      if (backup) {
        if (backup.activeThemeId) {
          setTheme(backup.activeThemeId);
        }
        toast({
          title: "Themes Restored",
          description: "Your previous theme settings have been recovered",
        });
      } else {
        toast({
          title: "No Backup Available",
          description: "No previous backup found to restore from",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Unable to restore themes from backup",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCreateProtectedBackup = () => {
    themeManager.createBackup(availableThemes, currentTheme.id);
    const info = themeManager.getBackupInfo();
    setBackupInfo(info);
    
    toast({
      title: "Protected Backup Created",
      description: "Your current theme settings are now safely backed up",
    });
  };

  const handleExportSecure = () => {
    const exportData = themeManager.exportThemes(availableThemes, currentTheme.id);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-casino-secure-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Secure Export Complete",
      description: "Your complete theme collection has been exported safely",
    });
  };

  const handleImportSecure = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = themeManager.importThemes(content);
        
        if (result.success) {
          if (result.activeThemeId) {
            setTheme(result.activeThemeId);
          }
          toast({
            title: "Import Successful",
            description: result.message,
          });
          setIsOpen(false);
        } else {
          toast({
            title: "Import Failed",
            description: result.message,
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="luxury-button">
          <Shield className="h-4 w-4 mr-2" />
          Theme Recovery
        </Button>
      </DialogTrigger>
      
      <DialogContent className="luxury-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-yellow-500 glow-text flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Theme Recovery Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Backup Status */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <History className="h-5 w-5 mr-2" />
                Backup Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backupInfo ? (
                <div className="space-y-3">
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Backup available from {formatDate(backupInfo.timestamp)}
                      <Badge variant="outline" className="ml-2">v{backupInfo.version}</Badge>
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleQuickRestore}
                    disabled={isRestoring}
                    className="w-full luxury-button"
                  >
                    <RotateCcw className={`h-4 w-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                    {isRestoring ? 'Restoring...' : 'Quick Restore Themes'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No backup found. Create one now to protect your themes.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleCreateProtectedBackup}
                    className="w-full luxury-button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Protected Backup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Recovery Options */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">Advanced Recovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={handleExportSecure}
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Secure Backup
                </Button>
                
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSecure}
                    className="hidden"
                    id="secure-import"
                  />
                  <label htmlFor="secure-import" className="cursor-pointer">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Backup File
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  These files contain your complete theme collection including custom themes, 
                  favorites, and preferences. Keep them safe for future recovery.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Prevention Tips */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg text-white">Prevention Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>Your themes are now automatically backed up when you switch themes</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>Export your themes regularly for external backup storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>Custom themes and favorites are preserved across sessions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>Use the Theme Recovery button if you experience any theme loss</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}