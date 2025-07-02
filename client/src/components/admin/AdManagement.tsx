import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Search, AlertCircle, Trash, Plus, Edit, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Advertisement = {
  id: number;
  html: string;
  frequency: number;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
  createdBy: number;
};

export function AdManagement() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAd, setNewAd] = useState({
    html: "",
    frequency: 5,
    isEnabled: true,
    isDefault: false
  });

  useEffect(() => {
    async function fetchAds() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/advertisements");
        
        if (!response.ok) {
          throw new Error("Failed to fetch advertisements");
        }
        
        const data = await response.json();
        setAds(data);
      } catch (err) {
        console.error("Error fetching advertisements:", err);
        setError(err instanceof Error ? err.message : "Failed to load advertisements");
        
        toast({
          title: "Error Loading Advertisements",
          description: err instanceof Error ? err.message : "An error occurred while loading advertisements",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchAds();
  }, [toast]);

  const toggleAdStatus = async (adId: number, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/advertisement/${adId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEnabled }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update advertisement status");
      }
      
      // Update local state
      setAds(ads.map(ad => 
        ad.id === adId ? { ...ad, isEnabled } : ad
      ));
      
      toast({
        title: `Advertisement ${isEnabled ? "Enabled" : "Disabled"}`,
        description: `Advertisement has been ${isEnabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (err) {
      console.error("Error toggling advertisement status:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while updating advertisement",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (adId: number) => {
    try {
      const response = await fetch(`/api/admin/advertisement/${adId}/set-default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to set advertisement as default");
      }
      
      const updatedAd = await response.json();
      
      // Update local state - set the selected ad as default and remove default status from others
      setAds(ads.map(ad => {
        if (ad.id === adId) {
          return { ...ad, isDefault: true };
        } else if (ad.isDefault) {
          return { ...ad, isDefault: false };
        }
        return ad;
      }));
      
      toast({
        title: "Default Advertisement Set",
        description: "This advertisement has been set as the default permanent advertisement.",
      });
    } catch (err) {
      console.error("Error setting default advertisement:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while setting default advertisement",
        variant: "destructive",
      });
    }
  };

  const deleteAd = async (adId: number) => {
    if (!confirm("Are you sure you want to delete this advertisement? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/advertisement/${adId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete advertisement");
      }
      
      // Update local state
      setAds(ads.filter(ad => ad.id !== adId));
      
      toast({
        title: "Advertisement Deleted",
        description: "Advertisement has been deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting advertisement:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while deleting advertisement",
        variant: "destructive",
      });
    }
  };

  const createAd = async () => {
    try {
      const response = await fetch("/api/admin/advertisement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAd),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create advertisement");
      }
      
      const createdAd = await response.json();
      
      // Update local state
      setAds([...ads, createdAd]);
      
      toast({
        title: "Advertisement Created",
        description: "New advertisement has been created successfully",
      });
      
      // Reset form and close dialog
      setNewAd({
        html: "",
        frequency: 5,
        isEnabled: true,
        isDefault: false
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error creating advertisement:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while creating advertisement",
        variant: "destructive",
      });
    }
  };

  // Filter ads based on search query
  const filteredAds = ads.filter(ad => {
    const searchLower = searchQuery.toLowerCase();
    return (
      ad.html.toLowerCase().includes(searchLower) ||
      ad.id.toString().includes(searchQuery)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading advertisements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 flex items-start">
        <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-red-500 font-medium mb-1">Error Loading Advertisements</h3>
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search advertisements..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add New Advertisement</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Advertisement</DialogTitle>
              <DialogDescription>
                Create a popup advertisement that will be shown to casino users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="html">HTML Content</Label>
                <Textarea
                  id="html"
                  placeholder="Enter HTML content for the advertisement..."
                  value={newAd.html}
                  onChange={(e) => setNewAd({...newAd, html: e.target.value})}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-gray-400">
                  Use HTML to create your advertisement. You can include images, text, and links.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Display Frequency (%)</Label>
                <Input
                  id="frequency"
                  type="number"
                  min="1"
                  max="100"
                  value={newAd.frequency}
                  onChange={(e) => setNewAd({...newAd, frequency: parseInt(e.target.value) || 5})}
                />
                <p className="text-xs text-gray-400">
                  The percentage chance this ad will be shown on page load.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAd.isEnabled}
                  onCheckedChange={(checked) => setNewAd({...newAd, isEnabled: checked})}
                  id="enabled"
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAd.isDefault}
                  onCheckedChange={(checked) => setNewAd({...newAd, isDefault: checked})}
                  id="default"
                />
                <Label htmlFor="default">Set as Default (Permanent Advertisement)</Label>
                {newAd.isDefault && (
                  <p className="text-xs text-amber-500 ml-2">
                    This will replace any existing default advertisement.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={createAd}>Create Advertisement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-card rounded-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>HTML Preview</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                    {searchQuery ? "No advertisements found matching your search" : "No advertisements found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAds.map((ad) => (
                  <TableRow key={ad.id} className={ad.isDefault ? "bg-purple-500/5" : undefined}>
                    <TableCell className="font-mono text-gray-400">
                      {ad.id}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {ad.html}
                      </div>
                    </TableCell>
                    <TableCell>{ad.frequency}%</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={ad.isEnabled}
                          onCheckedChange={(checked) => toggleAdStatus(ad.id, checked)}
                        />
                        <span className={`text-xs ${ad.isEnabled ? "text-green-500" : "text-red-500"}`}>
                          {ad.isEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ad.isDefault ? (
                        <span className="text-xs bg-purple-500/20 text-purple-500 px-2 py-1 rounded-full">
                          Permanent
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full">
                          Standard
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-400 text-sm">
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        {!ad.isDefault && (
                          <button 
                            className="p-1.5 bg-purple-500/10 text-purple-500 rounded-md hover:bg-purple-500/20 transition-colors"
                            onClick={() => setAsDefault(ad.id)}
                            title="Set as default permanent advertisement"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="m12 15 2 2 4-4"></path>
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                            </svg>
                          </button>
                        )}
                        <button className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md hover:bg-amber-500/20 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                          onClick={() => deleteAd(ad.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}