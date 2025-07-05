import React, { useState, useEffect, Component, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemTab as SystemTabComponent } from '@/components/admin/SystemTab';
import { BalanceManagement } from '@/components/admin/BalanceManagement';
import { AdvertisementManagement } from '@/components/admin/AdvertisementManagement';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, UserPlus, Edit, Trash2, Ban, AlertTriangle, DollarSign, Play, Gamepad2, Shield } from 'lucide-react';
import { Currency } from '@shared/schema';
import { adminApiCall, get, post } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { CreateGameDialog } from '@/components/CreateGameDialog';
import { GameCodeViewer } from '@/components/GameCodeViewer';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Game Management Tab Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Fallback component for Game Management
function GameManagementFallback() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-md bg-red-50 border border-red-200">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Game Management Error
            </h3>
            <p className="text-red-700 mb-4">
              The Game Management tab encountered an error and needs to be reloaded.
            </p>
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reloading...
                </>
              ) : (
                'Reload Page'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Types for admin panel
interface AdminUser {
  id: number;
  username: string;
  email: string;
  password: string; // Raw password as per requirements
  phone: string;
  balance: string;
  currency: string;
  role: string;
  isMuted: boolean;
  isBanned: boolean;
  isOnline: boolean;
  createdAt: string;
  ipAddress?: string;
  lastLogin?: string;
  lastSeen?: string;
}

interface Transaction {
  id: number;
  userId: number;
  username?: string; // Populated on the server
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  mutedUsers: number;
  bannedUsers: number;
  lastLogins: Array<{ id: number, username: string, lastLogin: string }>;
}

// Helper function to format lastSeen time
function formatLastSeen(lastSeenStr?: string): string {
  if (!lastSeenStr) return "Never";
  
  const lastSeen = new Date(lastSeenStr);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return lastSeen.toLocaleDateString();
}

// User Management Tab Component
function UserManagementTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  

  
  // Load all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminApiCall<AdminUser[]>('GET', '/api/admin/users');
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  

  
  // Handle user kick (temporary mute)
  const handleKickUser = async (userId: number, username: string) => {
    try {
      const updatedUser = await adminApiCall<AdminUser>('POST', `/api/admin/users/${userId}/kick`, {
        notification: `You have been temporarily kicked from Shadow Casino. If you have any issues, please contact our support team.`
      });
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      // Show success message
      setError(null);
      console.log(`Successfully kicked user: ${username}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error kicking user');
      console.error('Error kicking user:', err);
    }
  };

  // Handle user ban (permanent block)
  const handleBanUser = async (userId: number, username: string) => {
    try {
      const updatedUser = await adminApiCall<AdminUser>('POST', `/api/admin/users/${userId}/ban`, {
        notification: `You have been permanently banned from Shadow Casino. If you have any issues, please contact our support team.`
      });
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      // Show success message
      setError(null);
      console.log(`Successfully banned user: ${username}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error banning user');
      console.error('Error banning user:', err);
    }
  };

  // Handle user unkick (remove temporary mute)
  const handleUnkickUser = async (userId: number, username: string) => {
    try {
      const updatedUser = await adminApiCall<AdminUser>('POST', `/api/admin/users/${userId}/unkick`, {
        notification: `Your kick has been lifted. Welcome back to Shadow Casino!`
      });
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      // Show success message
      setError(null);
      console.log(`Successfully unkicked user: ${username}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unkicking user');
      console.error('Error unkicking user:', err);
    }
  };

  // Handle user unban (remove permanent block)
  const handleUnbanUser = async (userId: number, username: string) => {
    try {
      const updatedUser = await adminApiCall<AdminUser>('POST', `/api/admin/users/${userId}/unban`, {
        notification: `Your ban has been lifted. Welcome back to Shadow Casino!`
      });
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      // Show success message
      setError(null);
      console.log(`Successfully unbanned user: ${username}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unbanning user');
      console.error('Error unbanning user:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-100 text-red-800 mt-4">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableCaption>All registered users</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{`${user.balance} ${user.currency}`}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {user.isBanned ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Banned
                      </span>
                    ) : user.isMuted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Muted
                      </span>
                    ) : user.isOnline ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {user.isOnline ? "Online now" : `Last seen: ${formatLastSeen(user.lastSeen)}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {user.isOnline ? (
                      <span className="text-green-600 font-medium">Online now</span>
                    ) : (
                      formatLastSeen(user.lastSeen)
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {user.isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user.id, user.username)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Unban
                      </Button>
                    ) : user.isMuted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnkickUser(user.id, user.username)}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        Unkick
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKickUser(user.id, user.username)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          Kick
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user.id, user.username)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Ban
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// System Tab Component
function SystemTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load system data
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        
        // Fetch transactions
        const transData = await adminApiCall<Transaction[]>('GET', '/api/admin/transactions');
        setTransactions(transData);
        
        // Fetch stats
        const statsData = await adminApiCall<UserStats>('GET', '/api/admin/stats');
        setStats(statsData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred fetching system data');
        console.error('Error fetching system data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystemData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-100 text-red-800 mt-4">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Muted Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats?.mutedUsers || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Banned Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats?.bannedUsers || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions */}
      <div className="border rounded-md">
        <Table>
          <TableCaption>All system transactions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell className="font-medium">{transaction.username || transaction.userId}</TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${transaction.type === 'deposit' ? 'bg-green-100 text-green-800' : 
                        transaction.type === 'withdrawal' ? 'bg-yellow-100 text-yellow-800' : 
                        transaction.type === 'bet' ? 'bg-blue-100 text-blue-800' :
                        transaction.type === 'win' ? 'bg-purple-100 text-purple-800' :
                        transaction.type === 'admin_adjustment' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`
                    }
                  >
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>{transaction.currency}</TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`
                    }
                  >
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Last Login Times */}
      <div className="border rounded-md">
        <Table>
          <TableCaption>User Last Login Times</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats?.lastLogins.map((login) => (
              <TableRow key={login.id}>
                <TableCell className="font-medium">{login.username}</TableCell>
                <TableCell>{login.lastLogin ? new Date(login.lastLogin).toLocaleString() : "Never"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Game Management Tab Component
function GameManagementTab() {
  const [gameSettings, setGameSettings] = useState<Record<string, { winChance: number; maxMultiplier: number }>>({
    slots: { winChance: 45, maxMultiplier: 2.5 },
    dice: { winChance: 49, maxMultiplier: 2 },
    plinko: { winChance: 40, maxMultiplier: 3 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [createGameDialogOpen, setCreateGameDialogOpen] = useState(false);
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [selectedGameForViewing, setSelectedGameForViewing] = useState<any>(null);
  
  // New game form state with HTML content
  const [newGameForm, setNewGameForm] = useState({
    name: '',
    type: 'html',
    htmlContent: '',  // Added for HTML game code
    winChance: 50,
    maxMultiplier: 2.0,
    minBet: 1,
    maxBet: 1000,
    description: ''
  });
  const [isAddingGame, setIsAddingGame] = useState(false);
  
  const handleSettingChange = (gameType: string, field: 'winChance' | 'maxMultiplier', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    // Validate value
    if (field === 'winChance' && (numValue < 1 || numValue > 90)) {
      setError('Win chance must be between 1% and 90%');
      return;
    }
    
    if (field === 'maxMultiplier' && (numValue < 1 || numValue > 100)) {
      setError('Max multiplier must be between 1x and 100x');
      return;
    }
    
    setGameSettings({
      ...gameSettings,
      [gameType]: {
        ...gameSettings[gameType],
        [field]: numValue
      }
    });
    
    setError(null);
  };
  
  const handleSaveSettings = async (gameType: string) => {
    try {
      setLoading(true);
      
      // Call API to update game settings
      await adminApiCall('POST', `/api/admin/games/${gameType}/settings`, {
        winChance: gameSettings[gameType].winChance,
        maxMultiplier: gameSettings[gameType].maxMultiplier
      });
      
      // Refresh game settings after successful update
      const updatedSettings = await post(`/api/admin/game-settings/${gameType}`, {
        winChance: gameSettings[gameType].winChance,
        maxMultiplier: gameSettings[gameType].maxMultiplier
      });
      
      // Update local state with server response
      setGameSettings({
        ...gameSettings,
        [gameType]: updatedSettings
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating game settings');
      console.error('Error updating game settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewGame = async () => {
    try {
      setIsAddingGame(true);
      
      // Validate form
      if (!newGameForm.name || !newGameForm.type || !newGameForm.htmlContent) {
        setError('Game name, type, and HTML code are required');
        return;
      }
      
      // Call API to add new game
      await post('/api/admin/games/add', newGameForm);
      
      // Reset form
      setNewGameForm({
        name: '',
        type: 'html',
        htmlContent: '',  // Reset HTML content
        winChance: 50,
        maxMultiplier: 2.0,
        minBet: 1,
        maxBet: 1000,
        description: ''
      });
      
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding new game');
      console.error('Error adding new game:', err);
    } finally {
      setIsAddingGame(false);
    }
  };

  // Fetch existing custom games
  const [customGames, setCustomGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  const fetchCustomGames = async () => {
    setLoadingGames(true);
    try {
      const response = await get('/api/admin/games');
      if (response.ok) {
        const games = await response.json();
        setCustomGames(games || []);
      } else {
        console.log('Failed to fetch games:', response.status);
        setCustomGames([]);
      }
    } catch (error) {
      console.error('Error fetching custom games:', error);
      setCustomGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleDeleteGame = async (gameId: number, gameName: string) => {
    if (!confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await post(`/api/admin/games/${gameId}`, {}, 'DELETE');
      
      toast({
        title: "Success",
        description: `Game "${gameName}" deleted successfully!`,
        duration: 3000,
      });

      // Refresh the games list
      await fetchCustomGames();
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deleting game';
      console.error('Error deleting game:', err);
      
      toast({
        title: "Error", 
        description: errorMsg,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleViewCode = (game: any) => {
    setSelectedGameForViewing(game);
    setCodeViewerOpen(true);
  };

  const handleSaveGameCode = async (gameId: number, updatedContent: string) => {
    try {
      await post(`/api/admin/games/${gameId}/update`, {
        htmlContent: updatedContent
      });
      
      toast({
        title: "Success",
        description: "Game code updated successfully!",
      });
      
      // Refresh games list
      await fetchCustomGames();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update game code",
        variant: "destructive",
      });
    }
  };

  // Load custom games when component mounts
  useEffect(() => {
    try {
      fetchCustomGames();
    } catch (err) {
      console.error('Error in useEffect fetchCustomGames:', err);
      setComponentError('Failed to initialize game management');
    }
  }, []);

  // Add this after handleAddNewGame and before the return statement
  useEffect(() => {
    // Refresh games list after adding a new game
    if (!isAddingGame && !error) {
      try {
        fetchCustomGames();
      } catch (err) {
        console.error('Error in useEffect refresh games:', err);
      }
    }
  }, [isAddingGame, error]);

  // Component error fallback
  if (componentError) {
    return (
      <div className="space-y-8">
        <div className="p-4 rounded-md bg-red-100 text-red-800">
          <h3 className="font-bold">Component Error</h3>
          <p>{componentError}</p>
          <Button 
            onClick={() => {
              setComponentError(null);
              setError(null);
              fetchCustomGames();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-md bg-red-100 text-red-800">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* Existing Game Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Game Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slots Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Slots Settings</CardTitle>
              <CardDescription>Configure win chance and multipliers for Slots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="slots-win-chance" className="text-right">
                    Win Chance %
                  </Label>
                  <Input
                    id="slots-win-chance"
                    type="number"
                    value={gameSettings.slots.winChance}
                    onChange={(e) => handleSettingChange('slots', 'winChance', e.target.value)}
                    min="1"
                    max="90"
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="slots-multiplier" className="text-right">
                    Max Multiplier
                  </Label>
                  <Input
                    id="slots-multiplier"
                    type="number"
                    value={gameSettings.slots.maxMultiplier}
                    onChange={(e) => handleSettingChange('slots', 'maxMultiplier', e.target.value)}
                    min="1"
                    max="100"
                    step="0.1"
                    className="col-span-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings('slots')} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Dice Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Dice Settings</CardTitle>
              <CardDescription>Configure win chance and multipliers for Dice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="dice-win-chance" className="text-right">
                    Win Chance %
                  </Label>
                  <Input
                    id="dice-win-chance"
                    type="number"
                    value={gameSettings.dice.winChance}
                    onChange={(e) => handleSettingChange('dice', 'winChance', e.target.value)}
                    min="1"
                    max="90"
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="dice-multiplier" className="text-right">
                    Max Multiplier
                  </Label>
                  <Input
                    id="dice-multiplier"
                    type="number"
                    value={gameSettings.dice.maxMultiplier}
                    onChange={(e) => handleSettingChange('dice', 'maxMultiplier', e.target.value)}
                    min="1"
                    max="100"
                    step="0.1"
                    className="col-span-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings('dice')} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Plinko Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Plinko Settings</CardTitle>
              <CardDescription>Configure win chance and multipliers for Plinko</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="plinko-win-chance" className="text-right">
                    Win Chance %
                  </Label>
                  <Input
                    id="plinko-win-chance"
                    type="number"
                    value={gameSettings.plinko.winChance}
                    onChange={(e) => handleSettingChange('plinko', 'winChance', e.target.value)}
                    min="1"
                    max="90"
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="plinko-multiplier" className="text-right">
                    Max Multiplier
                  </Label>
                  <Input
                    id="plinko-multiplier"
                    type="number"
                    value={gameSettings.plinko.maxMultiplier}
                    onChange={(e) => handleSettingChange('plinko', 'maxMultiplier', e.target.value)}
                    min="1"
                    max="100"
                    step="0.1"
                    className="col-span-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings('plinko')} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Add New Games Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Add New Games</h3>
        <Card>
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>Add a new game to the casino platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="game-name">Game Name</Label>
                  <Input
                    id="game-name"
                    type="text"
                    placeholder="Enter game name"
                    value={newGameForm.name}
                    onChange={(e) => setNewGameForm({ ...newGameForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="game-type">Game Type</Label>
                  <select
                    id="game-type"
                    className="w-full p-2 border rounded-md bg-background"
                    value={newGameForm.type}
                    onChange={(e) => setNewGameForm({ ...newGameForm, type: e.target.value })}
                  >
                    <option value="html">HTML Game</option>
                    <option value="card">Card Game</option>
                    <option value="roulette">Roulette</option>
                    <option value="blackjack">Blackjack</option>
                    <option value="baccarat">Baccarat</option>
                    <option value="wheel">Wheel of Fortune</option>
                    <option value="lottery">Lottery</option>
                    <option value="crash">Crash Game</option>
                    <option value="mines">Mines</option>
                    <option value="keno">Keno</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="game-html-content">HTML Game Code</Label>
                  <textarea
                    id="game-html-content"
                    className="w-full p-2 border rounded-md bg-background font-mono text-sm"
                    rows={8}
                    placeholder="Enter your complete HTML game code here..."
                    value={newGameForm.htmlContent}
                    onChange={(e) => setNewGameForm({ ...newGameForm, htmlContent: e.target.value })}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Paste your complete HTML game code including HTML, CSS, and JavaScript
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="game-description">Description</Label>
                  <Input
                    id="game-description"
                    type="text"
                    placeholder="Brief description of the game"
                    value={newGameForm.description}
                    onChange={(e) => setNewGameForm({ ...newGameForm, description: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-win-chance">Win Chance (%)</Label>
                  <Input
                    id="new-win-chance"
                    type="number"
                    min="1"
                    max="99"
                    value={newGameForm.winChance}
                    onChange={(e) => setNewGameForm({ ...newGameForm, winChance: parseFloat(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-max-multiplier">Max Multiplier</Label>
                  <Input
                    id="new-max-multiplier"
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={newGameForm.maxMultiplier}
                    onChange={(e) => setNewGameForm({ ...newGameForm, maxMultiplier: parseFloat(e.target.value) })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-bet">Min Bet</Label>
                    <Input
                      id="min-bet"
                      type="number"
                      min="0.01"
                      value={newGameForm.minBet}
                      onChange={(e) => setNewGameForm({ ...newGameForm, minBet: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-bet">Max Bet</Label>
                    <Input
                      id="max-bet"
                      type="number"
                      min="1"
                      value={newGameForm.maxBet}
                      onChange={(e) => setNewGameForm({ ...newGameForm, maxBet: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setNewGameForm({
                name: '',
                type: 'html',
                htmlContent: '',
                winChance: 50,
                maxMultiplier: 2.0,
                minBet: 1,
                maxBet: 1000,
                description: ''
              })}
            >
              Clear Form
            </Button>
            <Button onClick={handleAddNewGame} disabled={isAddingGame}>
              {isAddingGame ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Game...
                </>
              ) : (
                'Add New Game'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Custom Games List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Games Management</h3>
          <Button onClick={() => setCreateGameDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create New Game
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Custom Games</CardTitle>
            <CardDescription>Manage all custom HTML games created in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingGames ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading games...</span>
              </div>
            ) : customGames.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custom games created yet.</p>
                <p className="text-sm">Click "Create New Game" to add your first custom game.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Total Games: {customGames.length}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Win Chance</TableHead>
                      <TableHead>Max Multiplier</TableHead>
                      <TableHead>Bet Range</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customGames.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell className="font-medium">{game.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {game.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={game.description}>
                          {game.description || 'No description'}
                        </TableCell>
                        <TableCell>{game.winChance}%</TableCell>
                        <TableCell>{game.maxMultiplier}x</TableCell>
                        <TableCell>
                          {game.minBet} - {game.maxBet}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/games/${game.id}`, '_blank')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCode(game)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Code
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteGame(game.id, game.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Game Dialog */}
      <CreateGameDialog 
        open={createGameDialogOpen}
        onOpenChange={setCreateGameDialogOpen}
        onGameCreated={fetchCustomGames}
      />
      
      {/* Game Code Viewer */}
      <GameCodeViewer
        open={codeViewerOpen}
        onOpenChange={setCodeViewerOpen}
        game={selectedGameForViewing}
        onSave={handleSaveGameCode}
      />
    </div>
  );
}

// Main Admin Page Component
export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  
  // Check if user is admin
  const isAuthorizedAdmin = () => {
    const allowedAdmins = ["shadowHimel", "Albab AJ", "Aj Albab", "shadowHimel2"];
    
    if (!user) return false;
    if (user.role !== 'admin') return false;
    if (!allowedAdmins.includes(user.username)) return false;
    
    console.log("User is authorized admin, rendering component");
    return true;
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </MainLayout>
    );
  }
  
  // Check if user is admin and has access to the admin panel
  console.log("Admin protected route \"/admin\", user:", user, "isLoading:", isLoading);
  if (!isAuthorizedAdmin()) {
    return (
      <MainLayout>
        <div className="py-16 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access the admin panel. Please contact a system administrator.
          </p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="py-10 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/audit'}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              View Audit Trail
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="users" value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
          <TabsList className="mb-8 grid grid-cols-5 w-full max-w-4xl">
            <TabsTrigger value="users" className="text-xs sm:text-sm">User Management</TabsTrigger>
            <TabsTrigger value="balance" className="text-xs sm:text-sm">Balance</TabsTrigger>
            <TabsTrigger value="system" className="text-xs sm:text-sm">System</TabsTrigger>
            <TabsTrigger value="games" className="text-xs sm:text-sm">Game Management</TabsTrigger>
            <TabsTrigger value="links" className="text-xs sm:text-sm">Advertisement Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>
          
          <TabsContent value="balance">
            <BalanceManagement />
          </TabsContent>
          
          <TabsContent value="system">
            <SystemTabComponent />
          </TabsContent>
          
          <TabsContent value="games">
            <GameManagementTab />
          </TabsContent>
          
          <TabsContent value="links" className="w-full overflow-hidden">
            <div className="max-w-full">
              <AdvertisementManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}