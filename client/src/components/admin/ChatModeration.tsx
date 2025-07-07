import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useChat } from "@/hooks/use-chat";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Volume2, Ban, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, timeAgo, getUserAvatarColor } from "@/lib/utils";

interface User {
  id: number;
  username: string;
}

export function ChatModeration() {
  const { messages, isLoading } = useChat();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  
  const muteUserMutation = useMutation({
    mutationFn: async ({ userId, isMuted }: { userId: number; isMuted: boolean }) => {
      const endpoint = isMuted ? `/api/admin/users/${userId}/mute` : `/api/admin/users/${userId}/unmute`;
      await apiRequest("POST", endpoint, { reason: isMuted ? "Chat moderation" : "Unmuted by admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowMuteDialog(false);
      toast({
        title: "Success",
        description: `User ${selectedUser?.username} has been ${selectedUser ? 'muted' : 'unmuted'}`,
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

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: number; isBanned: boolean }) => {
      const endpoint = isBanned ? `/api/admin/users/${userId}/ban` : `/api/admin/users/${userId}/unban`;
      await apiRequest("POST", endpoint, { reason: isBanned ? "Chat moderation" : "Unbanned by admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowBanDialog(false);
      toast({
        title: "Success",
        description: `User ${selectedUser?.username} has been ${selectedUser ? 'banned' : 'unbanned'}`,
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
  
  const handleMuteUser = (userId: number, username: string) => {
    setSelectedUser({ id: userId, username });
    setShowMuteDialog(true);
  };
  
  const handleBanUser = (userId: number, username: string) => {
    setSelectedUser({ id: userId, username });
    setShowBanDialog(true);
  };
  
  const confirmMuteUser = () => {
    if (!selectedUser) return;
    muteUserMutation.mutate({ userId: selectedUser.id, isMuted: true });
  };
  
  const confirmBanUser = () => {
    if (!selectedUser) return;
    banUserMutation.mutate({ userId: selectedUser.id, isBanned: true });
  };
  
  return (
    <div className="bg-background-darker rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-white">Chat Moderation</h3>
      </div>
      
      <div className="rounded-lg border border-gray-800 bg-background-light p-4 h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No chat messages yet
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2 group">
                <Avatar className={`w-8 h-8 ${getUserAvatarColor(message.username)}`}>
                  {message.profilePictureUrl ? (
                    <AvatarImage 
                      src={`${message.profilePictureUrl}?t=${Date.now()}`} 
                      alt={`${message.username}'s profile`}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback>{getInitials(message.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <span className={`font-medium ${message.isAdmin ? 'text-accent-gold' : 'text-white'}`}>
                      {message.username}
                    </span>
                    {message.isAdmin && (
                      <span className="text-xs bg-primary px-1 rounded text-white">ADMIN</span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
                  </div>
                  <p className="text-gray-300 text-sm break-words">{message.message}</p>
                </div>
                
                {!message.isAdmin && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-400"
                      onClick={() => handleMuteUser(message.userId, message.username)}
                    >
                      <span className="sr-only">Mute User</span>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                      onClick={() => handleBanUser(message.userId, message.username)}
                    >
                      <span className="sr-only">Ban User</span>
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Mute User Dialog */}
      <AlertDialog open={showMuteDialog} onOpenChange={setShowMuteDialog}>
        <AlertDialogContent className="bg-background-light border-background-darker">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Mute User</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to mute {selectedUser?.username}? They will not be able to send messages in the chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background-darker text-white border-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMuteUser}
              disabled={muteUserMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {muteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Muting...
                </>
              ) : (
                "Mute User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Ban User Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent className="bg-background-light border-background-darker">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ban User</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to ban {selectedUser?.username}? They will not be able to log in to the site anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background-darker text-white border-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBanUser}
              disabled={banUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {banUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                "Ban User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
