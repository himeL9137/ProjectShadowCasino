import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GameType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GameSettings {
  id: number;
  gameType: GameType;
  winChance: number;
  maxMultiplier: number;
  lastUpdated: string;
  updatedBy: number | null;
}

interface AllGameSettings {
  slots: GameSettings;
  dice: GameSettings;
  plinko: GameSettings;
}

export function GameControls() {
  const { toast } = useToast();
  const [riggedMode, setRiggedMode] = useState(true);
  const [maxWinLimit, setMaxWinLimit] = useState("150");

  const { data: gameSettings, isLoading } = useQuery<AllGameSettings>({
    queryKey: ["/api/admin/game-settings"],
  });

  const [slotsSettings, setSlotsSettings] = useState({
    winChance: 10,
    maxMultiplier: 1.1,
  });

  const [diceSettings, setDiceSettings] = useState({
    winChance: 10,
    maxMultiplier: 1.1,
  });

  const [plinkoSettings, setPlinkoSettings] = useState({
    winChance: 10,
    maxMultiplier: 1.1,
  });

  // Update local state when we get data from the server
  useState(() => {
    if (gameSettings) {
      setSlotsSettings({
        winChance: gameSettings.slots.winChance,
        maxMultiplier: gameSettings.slots.maxMultiplier,
      });
      setDiceSettings({
        winChance: gameSettings.dice.winChance,
        maxMultiplier: gameSettings.dice.maxMultiplier,
      });
      setPlinkoSettings({
        winChance: gameSettings.plinko.winChance,
        maxMultiplier: gameSettings.plinko.maxMultiplier,
      });
    }
  });

  const updateGameSettingsMutation = useMutation({
    mutationFn: async ({
      gameType,
      winChance,
      maxMultiplier,
    }: {
      gameType: GameType;
      winChance: number;
      maxMultiplier: number;
    }) => {
      const res = await apiRequest("POST", `/api/admin/game-settings/${gameType}`, {
        winChance,
        maxMultiplier,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-settings"] });
      toast({
        title: "Success",
        description: "Game settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (gameType: GameType) => {
    let settings;
    
    switch (gameType) {
      case GameType.SLOTS:
        settings = slotsSettings;
        break;
      case GameType.DICE:
        settings = diceSettings;
        break;
      case GameType.PLINKO:
        settings = plinkoSettings;
        break;
      default:
        return;
    }
    
    updateGameSettingsMutation.mutate({
      gameType,
      winChance: settings.winChance,
      maxMultiplier: settings.maxMultiplier,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background-darker rounded-xl p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background-darker rounded-xl p-4 mb-6">
      <h3 className="font-medium text-white mb-4">Game Control Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slots Settings */}
        <div className="bg-background-light p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Slots Settings</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Win Chance (%)</Label>
                <span className="text-white text-sm">{slotsSettings.winChance}%</span>
              </div>
              <Slider
                value={[slotsSettings.winChance]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setSlotsSettings({ ...slotsSettings, winChance: value[0] })}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Max Multiplier</Label>
                <span className="text-white text-sm">{slotsSettings.maxMultiplier}x</span>
              </div>
              <Input
                type="number"
                value={slotsSettings.maxMultiplier}
                onChange={(e) => setSlotsSettings({
                  ...slotsSettings,
                  maxMultiplier: parseFloat(e.target.value) || 1.1,
                })}
                step="0.1"
                min="1.0"
                max="150"
                className="w-full bg-background-darker border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              className="w-full mt-2" 
              onClick={() => handleSaveSettings(GameType.SLOTS)}
              disabled={updateGameSettingsMutation.isPending}
            >
              {updateGameSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Slots Settings
            </Button>
          </div>
        </div>
        
        {/* Dice Settings */}
        <div className="bg-background-light p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Dice Settings</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Win Chance (%)</Label>
                <span className="text-white text-sm">{diceSettings.winChance}%</span>
              </div>
              <Slider
                value={[diceSettings.winChance]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setDiceSettings({ ...diceSettings, winChance: value[0] })}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Max Multiplier</Label>
                <span className="text-white text-sm">{diceSettings.maxMultiplier}x</span>
              </div>
              <Input
                type="number"
                value={diceSettings.maxMultiplier}
                onChange={(e) => setDiceSettings({
                  ...diceSettings,
                  maxMultiplier: parseFloat(e.target.value) || 1.1,
                })}
                step="0.1"
                min="1.0"
                max="150"
                className="w-full bg-background-darker border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              className="w-full mt-2" 
              onClick={() => handleSaveSettings(GameType.DICE)}
              disabled={updateGameSettingsMutation.isPending}
            >
              {updateGameSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Dice Settings
            </Button>
          </div>
        </div>
        
        {/* Plinko Settings */}
        <div className="bg-background-light p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Plinko Settings</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Win Chance (%)</Label>
                <span className="text-white text-sm">{plinkoSettings.winChance}%</span>
              </div>
              <Slider
                value={[plinkoSettings.winChance]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setPlinkoSettings({ ...plinkoSettings, winChance: value[0] })}
                className="my-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="block text-gray-400 text-sm mb-1">Max Multiplier</Label>
                <span className="text-white text-sm">{plinkoSettings.maxMultiplier}x</span>
              </div>
              <Input
                type="number"
                value={plinkoSettings.maxMultiplier}
                onChange={(e) => setPlinkoSettings({
                  ...plinkoSettings,
                  maxMultiplier: parseFloat(e.target.value) || 1.1,
                })}
                step="0.1"
                min="1.0"
                max="150"
                className="w-full bg-background-darker border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              className="w-full mt-2" 
              onClick={() => handleSaveSettings(GameType.PLINKO)}
              disabled={updateGameSettingsMutation.isPending}
            >
              {updateGameSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Plinko Settings
            </Button>
          </div>
        </div>
        
        {/* Global Settings */}
        <div className="bg-background-light p-4 rounded-lg">
          <h4 className="font-medium text-white mb-2">Global Settings</h4>
          <div className="space-y-3">
            <div>
              <Label className="block text-gray-400 text-sm mb-1">Maximum Win Limit (BDT)</Label>
              <Input
                type="number"
                value={maxWinLimit}
                onChange={(e) => setMaxWinLimit(e.target.value)}
                className="w-full bg-background-darker border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-400 text-xs mt-1">This is enforced at the API level, no changes needed here.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="rigged"
                checked={riggedMode}
                onCheckedChange={setRiggedMode}
              />
              <Label htmlFor="rigged" className="text-white text-sm">Enable rigged mode</Label>
            </div>
            <p className="text-gray-400 text-xs mt-1">Rigged mode is always enforced in the backend code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
