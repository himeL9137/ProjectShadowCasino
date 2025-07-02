import { useState, useEffect } from "react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, Save, RefreshCw, 
  Lock, Gamepad2, Dice5, Box
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { GameType } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { adminApiCall } from "@/lib/api";

type GameSetting = {
  id: number;
  gameType: GameType;
  winChance: number;
  maxMultiplier: number;
  updatedBy: number;
  updatedAt: string;
};

export function GameSettings() {
  const { toast } = useToast();
  const [gameSettings, setGameSettings] = useState<{
    slots?: GameSetting;
    dice?: GameSetting;
    plinko?: GameSetting;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<{
    [GameType.SLOTS]: { winChance: number; maxMultiplier: number };
    [GameType.DICE]: { winChance: number; maxMultiplier: number };
    [GameType.PLINKO]: { winChance: number; maxMultiplier: number };
  }>({
    [GameType.SLOTS]: { winChance: 45, maxMultiplier: 1.1 },
    [GameType.DICE]: { winChance: 45, maxMultiplier: 1.1 },
    [GameType.PLINKO]: { winChance: 45, maxMultiplier: 1.1 }
  });
  const [winLock, setWinLock] = useState({
    enabled: true,
    threshold: 150 // BDT
  });

  useEffect(() => {
    async function fetchGameSettings() {
      try {
        setLoading(true);
        const data = await adminApiCall<{
          slots?: GameSetting;
          dice?: GameSetting;
          plinko?: GameSetting;
        }>('GET', "/api/admin/game-settings");
        
        setGameSettings(data);
        
        // Initialize edited settings with current values
        setEditedSettings({
          [GameType.SLOTS]: { 
            winChance: data.slots?.winChance || 45, 
            maxMultiplier: data.slots?.maxMultiplier || 1.1 
          },
          [GameType.DICE]: { 
            winChance: data.dice?.winChance || 45, 
            maxMultiplier: data.dice?.maxMultiplier || 1.1 
          },
          [GameType.PLINKO]: { 
            winChance: data.plinko?.winChance || 45, 
            maxMultiplier: data.plinko?.maxMultiplier || 1.1 
          }
        });
      } catch (err) {
        console.error("Error fetching game settings:", err);
        setError(err instanceof Error ? err.message : "Failed to load game settings");
        
        toast({
          title: "Error Loading Game Settings",
          description: err instanceof Error ? err.message : "An error occurred while loading game settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchGameSettings();
  }, [toast]);

  const saveGameSettings = async (gameType: GameType) => {
    try {
      setIsSaving(true);
      const settings = editedSettings[gameType];
      
      const updatedSettings = await adminApiCall<GameSetting>(
        'POST', 
        `/api/admin/game-settings/${gameType}`,
        {
          winChance: settings.winChance.toString(),
          maxMultiplier: settings.maxMultiplier.toString()
        }
      );
      
      // Update local state
      setGameSettings({
        ...gameSettings,
        [gameType]: updatedSettings
      });
      
      toast({
        title: "Settings Updated",
        description: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} game settings have been updated successfully`,
      });
    } catch (err) {
      console.error(`Error updating ${gameType} settings:`, err);
      
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : `An error occurred while updating ${gameType} settings`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate house edge
  const calculateHouseEdge = (winChance: number, maxMultiplier: number) => {
    // House edge formula: 1 - (winChance / 100 * maxMultiplier)
    return ((1 - (winChance / 100 * maxMultiplier)) * 100).toFixed(2);
  };

  const getProfitColor = (houseEdge: number) => {
    if (houseEdge > 30) return "text-green-500";
    if (houseEdge > 20) return "text-lime-500";
    if (houseEdge > 10) return "text-amber-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading game settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 flex items-start">
        <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-red-500 font-medium mb-1">Error Loading Game Settings</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Win Lock Settings */}
      <Card className="border-amber-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle>Win Lock Mechanism</CardTitle>
          </div>
          <CardDescription>
            When enabled, players with balances above the threshold will have 0% chance of winning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="win-lock" 
                checked={winLock.enabled}
                onCheckedChange={(checked) => setWinLock({...winLock, enabled: checked})}
              />
              <Label htmlFor="win-lock">
                {winLock.enabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <div className="text-sm text-amber-500">
              {winLock.enabled 
                ? "Players cannot win once they reach the threshold" 
                : "All players have standard win chances"}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="win-lock-threshold">Win Lock Threshold (BDT)</Label>
              <span>{winLock.threshold} BDT</span>
            </div>
            <Slider
              id="win-lock-threshold"
              disabled={!winLock.enabled}
              value={[winLock.threshold]}
              max={1000}
              min={50}
              step={10}
              onValueChange={(value) => setWinLock({...winLock, threshold: value[0]})}
              className={!winLock.enabled ? "opacity-50" : ""}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>50 BDT</span>
              <span>1000 BDT</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            disabled={!winLock.enabled}
            className="w-full"
            onClick={() => {
              toast({
                title: "Win Lock Updated",
                description: `Win lock threshold has been set to ${winLock.threshold} BDT`,
              });
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Win Lock Settings
          </Button>
        </CardFooter>
      </Card>
      
      {/* Game-specific settings */}
      <Tabs defaultValue={GameType.SLOTS}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={GameType.SLOTS} className="flex items-center justify-center">
            <Gamepad2 className="h-4 w-4 mr-2" />
            <span>Slots</span>
          </TabsTrigger>
          <TabsTrigger value={GameType.DICE} className="flex items-center justify-center">
            <Dice5 className="h-4 w-4 mr-2" />
            <span>Dice</span>
          </TabsTrigger>
          <TabsTrigger value={GameType.PLINKO} className="flex items-center justify-center">
            <Box className="h-4 w-4 mr-2" />
            <span>Plinko</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Slots Settings */}
        <TabsContent value={GameType.SLOTS}>
          <Card>
            <CardHeader>
              <CardTitle>Slots Game Settings</CardTitle>
              <CardDescription>
                Configure win chances and multipliers for Slots game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Win Chance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Win Chance (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.SLOTS].winChance}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.SLOTS]: {
                          ...editedSettings[GameType.SLOTS],
                          winChance: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.SLOTS].winChance]}
                  max={100}
                  min={0}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.SLOTS]: {
                      ...editedSettings[GameType.SLOTS],
                      winChance: value[0]
                    }
                  })}
                />
                <Progress value={editedSettings[GameType.SLOTS].winChance} className="h-2" />
              </div>
              
              {/* Max Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Win Multiplier</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.SLOTS].maxMultiplier}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.SLOTS]: {
                          ...editedSettings[GameType.SLOTS],
                          maxMultiplier: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="1"
                      max="10"
                      step="0.1"
                      className="w-20 text-right"
                    />
                    <span>x</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.SLOTS].maxMultiplier * 10]}
                  max={50}
                  min={10}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.SLOTS]: {
                      ...editedSettings[GameType.SLOTS],
                      maxMultiplier: value[0] / 10
                    }
                  })}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1.0x</span>
                  <span>5.0x</span>
                </div>
              </div>
              
              {/* House Edge Calculation */}
              <Card className="border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">House Edge</h3>
                      <p className="text-sm text-gray-400">
                        Expected profit margin based on current settings
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${getProfitColor(
                      parseFloat(calculateHouseEdge(
                        editedSettings[GameType.SLOTS].winChance, 
                        editedSettings[GameType.SLOTS].maxMultiplier
                      ))
                    )}`}>
                      {calculateHouseEdge(
                        editedSettings[GameType.SLOTS].winChance, 
                        editedSettings[GameType.SLOTS].maxMultiplier
                      )}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setEditedSettings({
                  ...editedSettings,
                  [GameType.SLOTS]: { winChance: 45, maxMultiplier: 1.1 }
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button 
                onClick={() => saveGameSettings(GameType.SLOTS)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Dice Settings */}
        <TabsContent value={GameType.DICE}>
          <Card>
            <CardHeader>
              <CardTitle>Dice Game Settings</CardTitle>
              <CardDescription>
                Configure win chances and multipliers for Dice game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Win Chance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Win Chance (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.DICE].winChance}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.DICE]: {
                          ...editedSettings[GameType.DICE],
                          winChance: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.DICE].winChance]}
                  max={100}
                  min={0}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.DICE]: {
                      ...editedSettings[GameType.DICE],
                      winChance: value[0]
                    }
                  })}
                />
                <Progress value={editedSettings[GameType.DICE].winChance} className="h-2" />
              </div>
              
              {/* Max Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Win Multiplier</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.DICE].maxMultiplier}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.DICE]: {
                          ...editedSettings[GameType.DICE],
                          maxMultiplier: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="1"
                      max="10"
                      step="0.1"
                      className="w-20 text-right"
                    />
                    <span>x</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.DICE].maxMultiplier * 10]}
                  max={50}
                  min={10}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.DICE]: {
                      ...editedSettings[GameType.DICE],
                      maxMultiplier: value[0] / 10
                    }
                  })}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1.0x</span>
                  <span>5.0x</span>
                </div>
              </div>
              
              {/* House Edge Calculation */}
              <Card className="border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">House Edge</h3>
                      <p className="text-sm text-gray-400">
                        Expected profit margin based on current settings
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${getProfitColor(
                      parseFloat(calculateHouseEdge(
                        editedSettings[GameType.DICE].winChance, 
                        editedSettings[GameType.DICE].maxMultiplier
                      ))
                    )}`}>
                      {calculateHouseEdge(
                        editedSettings[GameType.DICE].winChance, 
                        editedSettings[GameType.DICE].maxMultiplier
                      )}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setEditedSettings({
                  ...editedSettings,
                  [GameType.DICE]: { winChance: 45, maxMultiplier: 1.1 }
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button 
                onClick={() => saveGameSettings(GameType.DICE)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Plinko Settings */}
        <TabsContent value={GameType.PLINKO}>
          <Card>
            <CardHeader>
              <CardTitle>Plinko Game Settings</CardTitle>
              <CardDescription>
                Configure win chances and multipliers for Plinko game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Win Chance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Win Chance (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.PLINKO].winChance}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.PLINKO]: {
                          ...editedSettings[GameType.PLINKO],
                          winChance: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="0"
                      max="100"
                      step="1"
                      className="w-20 text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.PLINKO].winChance]}
                  max={100}
                  min={0}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.PLINKO]: {
                      ...editedSettings[GameType.PLINKO],
                      winChance: value[0]
                    }
                  })}
                />
                <Progress value={editedSettings[GameType.PLINKO].winChance} className="h-2" />
              </div>
              
              {/* Max Multiplier */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Win Multiplier</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedSettings[GameType.PLINKO].maxMultiplier}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        [GameType.PLINKO]: {
                          ...editedSettings[GameType.PLINKO],
                          maxMultiplier: parseFloat(e.target.value) || 0
                        }
                      })}
                      min="1"
                      max="10"
                      step="0.1"
                      className="w-20 text-right"
                    />
                    <span>x</span>
                  </div>
                </div>
                <Slider
                  value={[editedSettings[GameType.PLINKO].maxMultiplier * 10]}
                  max={50}
                  min={10}
                  step={1}
                  onValueChange={(value) => setEditedSettings({
                    ...editedSettings,
                    [GameType.PLINKO]: {
                      ...editedSettings[GameType.PLINKO],
                      maxMultiplier: value[0] / 10
                    }
                  })}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1.0x</span>
                  <span>5.0x</span>
                </div>
              </div>
              
              {/* House Edge Calculation */}
              <Card className="border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">House Edge</h3>
                      <p className="text-sm text-gray-400">
                        Expected profit margin based on current settings
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${getProfitColor(
                      parseFloat(calculateHouseEdge(
                        editedSettings[GameType.PLINKO].winChance, 
                        editedSettings[GameType.PLINKO].maxMultiplier
                      ))
                    )}`}>
                      {calculateHouseEdge(
                        editedSettings[GameType.PLINKO].winChance, 
                        editedSettings[GameType.PLINKO].maxMultiplier
                      )}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setEditedSettings({
                  ...editedSettings,
                  [GameType.PLINKO]: { winChance: 45, maxMultiplier: 1.1 }
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button 
                onClick={() => saveGameSettings(GameType.PLINKO)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}