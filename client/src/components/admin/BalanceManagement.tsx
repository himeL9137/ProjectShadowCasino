import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { adminApiCall, get } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Loader2, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Currency } from '@shared/schema';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  balance: string;
  currency: string;
  role: string;
  isBanned: boolean;
  isMuted: boolean;
  createdAt: string;
  ipAddress?: string;
  lastLogin?: string;
}

interface Transaction {
  id: number;
  userId: number;
  username?: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface BalanceAdjustment {
  userId: number;
  amount: string;
  currency: string;
  action: 'add' | 'remove';
  reason: string;
}

export function BalanceManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState('manual_adjustment');
  const [adjustmentCurrency, setAdjustmentCurrency] = useState('USD');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchExchangeRates();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<AdminUser[]>('GET', '/api/admin/users');
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  interface ExchangeRateResponse {
    base: string;
    rates: Record<string, number>;
    lastUpdated: string;
    ageInMinutes: number;
  }

  const fetchExchangeRates = async () => {
    try {
      // Properly type the get function for this specific endpoint
      const response: ExchangeRateResponse = await get('/api/exchange-rates');
      
      if (response && response.rates) {
        setExchangeRates(response.rates);
      } else {
        console.error('Invalid exchange rate response format');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminApiCall<Transaction[]>('GET', '/api/admin/transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: number) => {
    try {
      setUserLoading(true);
      const data = await adminApiCall<Transaction[]>('GET', `/api/admin/users/${userId}/transactions`);
      setUserTransactions(data);
    } catch (error) {
      console.error(`Failed to fetch transactions for user ${userId}:`, error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserSelect = (user: AdminUser) => {
    setSelectedUser(user);
    fetchUserTransactions(user.id);
  };

  const handleAdjustmentOpen = (user: AdminUser) => {
    setSelectedUser(user);
    setAmount('');
    setReason('manual_adjustment');
    setAdjustmentCurrency(user.currency);
    setErrorMessage('');
    setSuccessMessage('');
    setIsAdjustmentModalOpen(true);
  }

  // Handle user ban/unban
  const handleUserBanToggle = async (user: AdminUser) => {
    try {
      const action = user.isBanned ? 'unban' : 'ban';
      const reason = prompt(`Please provide a reason for ${action}ing ${user.username}:`);
      
      if (reason === null) return; // User cancelled
      
      const response = await adminApiCall<{user: AdminUser, message: string}>(
        'POST',
        `/api/admin/users/${user.id}/${action}`,
        { reason: reason || `Admin ${action} action` }
      );
      
      // Update user in the list
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, isBanned: !user.isBanned } : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => 
        searchTerm ? (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) : true
      ));
      
      toast.success(`User ${user.username} successfully ${action}ned`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${user.isBanned ? 'unban' : 'ban'} user`);
    }
  };

  // Handle user mute/unmute
  const handleUserMuteToggle = async (user: AdminUser) => {
    try {
      const action = user.isMuted ? 'unmute' : 'mute';
      const reason = prompt(`Please provide a reason for ${action}ing ${user.username}:`);
      
      if (reason === null) return; // User cancelled
      
      const response = await adminApiCall<{user: AdminUser, message: string}>(
        'POST',
        `/api/admin/users/${user.id}/${action}`,
        { reason: reason || `Admin ${action} action` }
      );
      
      // Update user in the list
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, isMuted: !user.isMuted } : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => 
        searchTerm ? (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) : true
      ));
      
      toast.success(`User ${user.username} successfully ${action}d`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${user.isMuted ? 'unmute' : 'mute'} user`);
    }
  };

  // Handle view user details
  const handleViewUserDetails = async (user: AdminUser) => {
    try {
      const response = await adminApiCall<{
        user: AdminUser, 
        transactions: any[], 
        gameHistory: any[], 
        message: string
      }>(
        'GET',
        `/api/admin/users/${user.id}/details`,
        undefined
      );
      
      // Show detailed user information
      const detailsMessage = `
User Details for ${user.username}:
- Email: ${user.email}
- Balance: ${user.balance} ${user.currency}
- Role: ${user.role}
- Status: ${user.isBanned ? 'Banned' : 'Active'} ${user.isMuted ? '(Muted)' : ''}
- Total Transactions: ${response.transactions.length}
- Total Games Played: ${response.gameHistory.length}
- Joined: ${new Date(user.createdAt).toLocaleDateString()}
      `;
      
      alert(detailsMessage);
      toast.success('User details accessed and logged for audit');
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user details');
    }
  };;

  const convertAmount = (amount: string, fromCurrency: string, toCurrency: string): string => {
    if (!exchangeRates || !amount) return '0';
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return '0';
    
    // Convert to USD first (our base currency)
    const valueInUSD = fromCurrency === 'USD' ? amountValue : amountValue / exchangeRates[fromCurrency];
    
    // Then convert from USD to target currency
    const convertedValue = toCurrency === 'USD' ? valueInUSD : valueInUSD * exchangeRates[toCurrency];
    
    return convertedValue.toFixed(2);
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !amount) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      
      // Keep the amount in the selected currency - backend will handle conversion
      const adjustmentAmount = parseFloat(amount);
      
      const endpoint = actionType === 'add' 
        ? `/api/admin/users/${selectedUser.id}/add-funds`
        : `/api/admin/users/${selectedUser.id}/remove-funds`;
      
      const response = await adminApiCall<{newBalance: string, message: string}>(
        'POST', 
        endpoint, 
        {
          amount: adjustmentAmount.toString(),
          currency: adjustmentCurrency, // Send the selected currency, not user's currency
          reason
        }
      );
      
      const successMessage = `Successfully ${actionType === 'add' ? 'added' : 'removed'} ${amount} ${adjustmentCurrency} to/from ${selectedUser.username}'s balance`;
      setSuccessMessage(successMessage);
      
      // Show toast notification
      toast.success(
        <div className="flex flex-col">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            <span className="font-medium">Balance Adjustment Complete</span>
          </div>
          <div className="mt-1 text-sm">
            {actionType === 'add' ? 'Added' : 'Removed'} {amount} {adjustmentCurrency} 
            {adjustmentCurrency !== selectedUser.currency ? 
              ` (${convertAmount(amount, adjustmentCurrency, selectedUser.currency)} ${selectedUser.currency})` : 
              ''
            }
          </div>
          <div className="mt-1 text-sm">
            New balance: {response.newBalance} {selectedUser.currency}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Reason: {adjustmentReasons.find(r => r.value === reason)?.label || reason}
          </div>
        </div>
      );
      
      // Update the user in the list with new balance
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return { ...user, balance: response.newBalance };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => 
        searchTerm ? (
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) : true
      ));
      
      // Update selected user with new balance
      if (selectedUser && response && 'newBalance' in response) {
        setSelectedUser({ ...selectedUser, balance: response.newBalance });
      }
      
      // Refresh transactions
      fetchTransactions();
      if (selectedUser) {
        fetchUserTransactions(selectedUser.id);
      }
      
      // Close dialog after successful operation
      setTimeout(() => {
        setIsAdjustmentModalOpen(false);
        setSuccessMessage('');
      }, 2000);
      
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to adjust balance. Please try again.';
      setErrorMessage(errorMsg);
      
      // Show error toast
      toast.error(
        <div className="flex items-center">
          <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
          <div>
            <div className="font-medium">Balance Adjustment Failed</div>
            <div className="text-sm">{errorMsg}</div>
          </div>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'win':
      case 'add':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
      case 'bet':
      case 'remove':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // List of predefined reasons for balance adjustments
  const adjustmentReasons = [
    { value: "bonus", label: "Bonus" },
    { value: "promotion", label: "Promotion" },
    { value: "refund", label: "Refund" },
    { value: "correction", label: "Correction" },
    { value: "penalty", label: "Penalty" },
    { value: "fraud_prevention", label: "Fraud Prevention" },
    { value: "compensation", label: "Compensation" },
    { value: "manual_adjustment", label: "Manual Adjustment" },
    { value: "other", label: "Other" }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `$${transactions
                  .filter(t => t.type.toLowerCase() === 'deposit')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `$${transactions
                  .filter(t => t.type.toLowerCase() === 'withdrawal')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `$${transactions
                  .filter(t => t.type.toLowerCase() === 'bet')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `$${transactions
                  .reduce((sum, t) => {
                    if (['deposit', 'win'].includes(t.type.toLowerCase())) {
                      return sum - parseFloat(t.amount);
                    } else if (['withdrawal', 'bet'].includes(t.type.toLowerCase())) {
                      return sum + parseFloat(t.amount);
                    }
                    return sum;
                  }, 0)
                  .toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Search and List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>User Balance Management</CardTitle>
            <CardDescription>Search and manage user balances</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              fetchUsers();
              fetchTransactions();
              fetchExchangeRates();
            }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id} className={user.isBanned ? 'opacity-60' : ''}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{`${user.balance} ${user.currency}`}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserSelect(user)}
                          >
                            View Transactions
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAdjustmentOpen(user)}
                          >
                            Adjust Balance
                          </Button>
                          
                          {/* Ban/Unban Button */}
                          <Button
                            size="sm"
                            variant={user.isBanned ? "outline" : "destructive"}
                            onClick={() => handleUserBanToggle(user)}
                            disabled={user.role === 'admin'} // Prevent banning admins
                          >
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                          
                          {/* Mute/Unmute Button */}
                          <Button
                            size="sm"
                            variant={user.isMuted ? "outline" : "secondary"}
                            onClick={() => handleUserMuteToggle(user)}
                            disabled={user.role === 'admin'} // Prevent muting admins
                          >
                            {user.isMuted ? 'Unmute' : 'Mute'}
                          </Button>
                          
                          {/* View Details Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Transactions */}
      {selectedUser && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Transactions for {selectedUser.username}</CardTitle>
              <CardDescription>Current balance: {selectedUser.balance} {selectedUser.currency}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchUserTransactions(selectedUser.id)}
              disabled={userLoading}
            >
              <RefreshCw className={`h-4 w-4 ${userLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Transaction History Chart */}
            {userTransactions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Balance History</h3>
                <div className="h-[200px]">
                  {/* We'll use a simplified bar chart for transaction visualization */}
                  <div className="flex h-full items-end space-x-2">
                    {userTransactions.slice(-10).map((transaction, index) => {
                      const isPositive = ['deposit', 'win', 'add'].includes(transaction.type.toLowerCase());
                      const amount = parseFloat(transaction.amount);
                      // Calculate height based on amount relative to max amount
                      const maxAmount = Math.max(...userTransactions.map(t => parseFloat(t.amount)));
                      const height = Math.max(10, (amount / maxAmount) * 100);
                      
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className={`w-10 rounded-t-md ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} 
                            style={{ height: `${height}%` }}
                            title={`${transaction.type}: ${transaction.amount} ${transaction.currency}`}
                          />
                          <div className="text-xs mt-1 w-10 overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {transaction.type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Transaction Analysis */}
            {userTransactions.length > 0 && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium text-sm mb-2">Most Common Transaction</h4>
                  <div className="text-lg font-bold">
                    {(() => {
                      const types = userTransactions.map(t => t.type.toLowerCase());
                      const counts = types.reduce((acc, type) => {
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                      return mostCommon ? mostCommon[0] : 'No data';
                    })()}
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium text-sm mb-2">Avg. Transaction Amount</h4>
                  <div className="text-lg font-bold">
                    {userTransactions.length > 0 
                      ? `${(userTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / userTransactions.length).toFixed(2)} ${userTransactions[0].currency}`
                      : 'No data'
                    }
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium text-sm mb-2">Balance Trend</h4>
                  <div className="text-lg font-bold">
                    {(() => {
                      // Count the last 5 transactions
                      const recent = userTransactions.slice(-5);
                      const deposits = recent.filter(t => ['deposit', 'win', 'add'].includes(t.type.toLowerCase())).length;
                      const withdrawals = recent.filter(t => ['withdrawal', 'bet', 'remove'].includes(t.type.toLowerCase())).length;
                      
                      if (deposits > withdrawals) return "Increasing ↑";
                      if (withdrawals > deposits) return "Decreasing ↓";
                      return "Stable →";
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : userTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    userTransactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(transaction.type)}
                            <span>{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{`${transaction.amount} ${transaction.currency}`}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedUser(null)}
              className="mr-2"
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fetchUserTransactions(selectedUser.id)}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Balance Adjustment Dialog */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance for {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Current balance: {selectedUser?.balance} {selectedUser?.currency}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Select value={actionType} onValueChange={(value: 'add' | 'remove') => setActionType(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="remove">Remove Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="col-span-2"
              />
              <Select value={adjustmentCurrency} onValueChange={setAdjustmentCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Currency).map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentReasons.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {adjustmentCurrency !== selectedUser?.currency && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right">Converted Amount:</div>
                <div className="col-span-3">
                  {convertAmount(amount || '0', adjustmentCurrency, selectedUser?.currency || 'USD')} {selectedUser?.currency}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-green-500">
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBalanceAdjustment} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}