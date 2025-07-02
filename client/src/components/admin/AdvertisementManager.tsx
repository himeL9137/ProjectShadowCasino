import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Advertisement {
  id: number;
  script: string;
  createdAt: string;
  createdBy: number;
}

export function AdvertisementManager() {
  const { toast } = useToast();
  const [newAdScript, setNewAdScript] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteAdId, setDeleteAdId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: ads, isLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements"],
  });

  const createAdMutation = useMutation({
    mutationFn: async (script: string) => {
      const res = await apiRequest("POST", "/api/admin/advertisements", { script });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      setShowAddDialog(false);
      setNewAdScript("");
      toast({
        title: "Success",
        description: "Advertisement created successfully",
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

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      setShowDeleteDialog(false);
      toast({
        title: "Success",
        description: "Advertisement deleted successfully",
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

  const handleCreateAd = () => {
    if (!newAdScript.trim()) {
      toast({
        title: "Error",
        description: "Advertisement script cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    createAdMutation.mutate(newAdScript);
  };

  const handleDeleteAd = (id: number) => {
    setDeleteAdId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAd = () => {
    if (deleteAdId !== null) {
      deleteAdMutation.mutate(deleteAdId);
    }
  };

  return (
    <div className="bg-background-darker rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-white">Advertisement Manager</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Advertisement
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-background-light rounded-lg p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !ads || ads.length === 0 ? (
        <div className="bg-background-light rounded-lg p-8 text-center">
          <p className="text-gray-400">No advertisements found. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-background-light rounded-lg p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-white font-medium">Advertisement #{ad.id}</span>
                  <p className="text-gray-400 text-sm">Created: {formatDateTime(ad.createdAt)}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteAd(ad.id)}
                  disabled={deleteAdMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 bg-background-darker p-3 rounded-md overflow-x-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                  {ad.script}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Advertisement Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-background-light border-background-darker">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Advertisement</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter HTML or script code that will be displayed as a popup advertisement
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <label className="text-sm text-gray-400 block mb-2">Advertisement Code</label>
            <Textarea
              value={newAdScript}
              onChange={(e) => setNewAdScript(e.target.value)}
              className="bg-background-darker border-gray-800 text-white min-h-[150px]"
              placeholder="Enter HTML or script code here..."
            />
            <p className="text-gray-400 text-xs mt-1">
              This code will be displayed in a popup every 5 minutes. Make sure it's valid HTML or Javascript.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAd} 
              disabled={createAdMutation.isPending || !newAdScript.trim()}
            >
              {createAdMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Advertisement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Advertisement Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background-light border-background-darker">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background-darker text-white border-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAd}
              disabled={deleteAdMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAdMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
