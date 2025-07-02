import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentTheme.id === theme.id && "bg-accent"
            )}
          >
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <span>{theme.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// More detailed theme selector with preview
export function ThemeSelectorAdvanced() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Theme</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current:</span>
          <span className="text-sm font-medium">{currentTheme.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {availableThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={cn(
              "group relative flex flex-col items-center rounded-md p-2 border-2 border-transparent hover:border-primary transition-all",
              currentTheme.id === theme.id && "border-primary"
            )}
          >
            <div className="mb-2 flex items-center justify-center h-12 w-full rounded-md relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: theme.colors.background }}
              />
              <div
                className="absolute top-1 left-1 right-1 h-3 rounded"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="absolute bottom-1 left-1 w-6 h-4 rounded"
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <div
                className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
            <span className="text-xs font-medium">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}