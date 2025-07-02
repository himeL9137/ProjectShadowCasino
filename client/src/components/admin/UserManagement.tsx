import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Search, User, AlertCircle,
  Trash, Eye, Ban, EyeOff, Volume, VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApiCall } from "@/lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  balance: string;
  currency: string;
  role: string;
  isMuted: boolean;
  isBanned: boolean;
  createdAt: string;
};

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        // Mock data while database is bypassed
        const mockUsers = [
          {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            balance: "10000",
            currency: "USD",
            role: "admin",
            isMuted: false,
            isBanned: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            username: "shadowHimel",
            email: "shadowhimel@example.com",
            balance: "10000",
            currency: "USD",
            role: "admin",
            isMuted: false,
            isBanned: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            username: "Albab AJ",
            email: "albabaj@example.com",
            balance: "10000",
            currency: "USD",
            role: "admin",
            isMuted: false,
            isBanned: false,
            createdAt: new Date().toISOString()
          }
        ];
        setUsers(mockUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
        
        toast({
          title: "Error Loading Users",
          description: err instanceof Error ? err.message : "An error occurred while loading users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [toast]);

  const toggleUserBan = async (userId: number, isBanned: boolean) => {
    try {
      await adminApiCall('POST', `/api/admin/user/${userId}/ban`, { isBanned });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isBanned } : user
      ));
      
      toast({
        title: `User ${isBanned ? "Banned" : "Unbanned"}`,
        description: `User has been ${isBanned ? "banned" : "unbanned"} successfully`,
      });
    } catch (err) {
      console.error("Error toggling user ban:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while updating user",
        variant: "destructive",
      });
    }
  };

  const toggleUserMute = async (userId: number, isMuted: boolean) => {
    try {
      await adminApiCall('POST', `/api/admin/user/${userId}/mute`, { isMuted });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isMuted } : user
      ));
      
      toast({
        title: `User ${isMuted ? "Muted" : "Unmuted"}`,
        description: `User has been ${isMuted ? "muted" : "unmuted"} successfully`,
      });
    } catch (err) {
      console.error("Error toggling user mute:", err);
      
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "An error occurred while updating user",
        variant: "destructive",
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 flex items-start">
        <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-red-500 font-medium mb-1">Error Loading Users</h3>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="h-4 w-4" />
          <span>Total users: {users.length}</span>
        </div>
      </div>
      
      <div className="bg-card rounded-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-gray-400">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="inline-block bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-md mr-2">
                          {user.currency}
                        </span>
                        {user.balance}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                        user.role === "admin" 
                          ? "bg-red-500/20 text-red-500" 
                          : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col justify-center items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={!user.isBanned}
                            onCheckedChange={(checked) => toggleUserBan(user.id, !checked)}
                          />
                          <span className={`text-xs ${user.isBanned ? "text-red-500" : "text-green-500"}`}>
                            {user.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={!user.isMuted}
                            onCheckedChange={(checked) => toggleUserMute(user.id, !checked)}
                          />
                          <span className={`text-xs ${user.isMuted ? "text-amber-500" : "text-green-500"}`}>
                            {user.isMuted ? 'Muted' : 'Can Chat'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className={`p-1.5 rounded-md hover:bg-red-500/20 transition-colors ${
                            user.isBanned 
                              ? "bg-green-500/10 text-green-500" 
                              : "bg-red-500/10 text-red-500"
                          }`}
                          onClick={() => toggleUserBan(user.id, !user.isBanned)}
                        >
                          {user.isBanned ? <Eye className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button 
                          className={`p-1.5 rounded-md hover:bg-amber-500/20 transition-colors ${
                            user.isMuted 
                              ? "bg-green-500/10 text-green-500" 
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                          onClick={() => toggleUserMute(user.id, !user.isMuted)}
                        >
                          {user.isMuted ? <Volume className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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