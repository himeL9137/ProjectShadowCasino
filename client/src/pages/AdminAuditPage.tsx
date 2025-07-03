import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Download, Search, Filter, Calendar, User, Activity, BarChart3 } from 'lucide-react';
import { AdminActionType } from '@shared/schema';

interface AdminAction {
  id: number;
  adminId: string;
  adminUsername: string;
  action: AdminActionType;
  targetUserId?: string;
  targetUsername?: string;
  details?: any;
  createdAt: string;
  ipAddress?: string;
}

interface AdminStats {
  totalActions: number;
  actionsByType: Array<{ action: string; count: number }>;
  actionsByAdmin: Array<{ adminId: string; adminUsername: string; count: number }>;
}

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');

  // Fetch all admin actions
  const { data: allActions, isLoading: actionsLoading } = useQuery({
    queryKey: ['/api/admin/audit/actions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/audit/actions?limit=500', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch admin actions');
      return response.json();
    }
  });

  // Fetch admin action statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/audit/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/audit/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch admin stats');
      return response.json();
    }
  });

  // Filter actions based on search and filters
  const filteredActions = React.useMemo(() => {
    if (!allActions?.actions) return [];
    
    let filtered = allActions.actions;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter((action: AdminAction) =>
        action.adminUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.targetUserId?.includes(searchQuery) ||
        JSON.stringify(action.details).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Action type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((action: AdminAction) => action.action === filterType);
    }

    // Admin filter
    if (selectedAdmin !== 'all') {
      filtered = filtered.filter((action: AdminAction) => action.adminId === selectedAdmin);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((action: AdminAction) => {
        const actionDate = new Date(action.createdAt);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1970-01-01');
        const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date();
        return actionDate >= start && actionDate <= end;
      });
    }

    return filtered;
  }, [allActions, searchQuery, filterType, selectedAdmin, dateRange]);

  // Get unique admins for filter
  const uniqueAdmins = React.useMemo(() => {
    if (!allActions?.actions) return [];
    const admins = new Map();
    allActions.actions.forEach((action: AdminAction) => {
      if (!admins.has(action.adminId)) {
        admins.set(action.adminId, action.adminUsername || 'Unknown');
      }
    });
    return Array.from(admins.entries()).map(([id, username]) => ({ id, username }));
  }, [allActions]);

  // Format action details for display
  const formatActionDetails = (action: AdminAction) => {
    if (!action.details) return 'No details available';
    
    const details = action.details;
    
    // Create a formatted display of all details
    const formatDetailValue = (value: any): string => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };

    // Format based on action type for better readability
    const formatByActionType = (action: AdminAction): string => {
      const details = action.details;
      
      switch (action.action) {
        case AdminActionType.EDIT_BALANCE:
          return `Action: ${details?.action || 'N/A'}\nAmount: ${details?.amount || 'N/A'} ${details?.fromCurrency || 'N/A'}\nConverted: ${details?.toAmount || 'N/A'} ${details?.toCurrency || 'N/A'}\nReason: ${details?.reason || 'N/A'}`;
        
        case AdminActionType.BAN_USER:
        case AdminActionType.UNBAN_USER:
        case AdminActionType.MUTE_USER:
        case AdminActionType.UNMUTE_USER:
          return `Reason: ${details?.reason || 'N/A'}\nTarget User: ${details?.targetUsername || 'N/A'}\nPrevious Status: ${details?.previousBanStatus !== undefined ? (details.previousBanStatus ? 'Banned' : 'Not Banned') : details?.previousMuteStatus !== undefined ? (details.previousMuteStatus ? 'Muted' : 'Not Muted') : 'N/A'}`;
        
        case AdminActionType.CHANGE_USER_ROLE:
          return `Old Role: ${details?.oldRole || 'N/A'}\nNew Role: ${details?.newRole || 'N/A'}\nTarget User: ${details?.targetUsername || 'N/A'}`;
        
        case AdminActionType.VIEW_USER_DETAILS:
          return `Target User: ${details?.targetUsername || 'N/A'}\nAccessed Sections: ${details?.accessedSections ? details.accessedSections.join(', ') : 'N/A'}`;
        
        default:
          // Default formatting for other action types
          return Object.entries(details).map(([key, value]) => 
            `${key}: ${formatDetailValue(value)}`
          ).join('\n');
      }
    };

    return formatByActionType(action);

    switch (action.action) {
      case AdminActionType.EDIT_BALANCE:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Action:</span> {details.action || 'N/A'}</div>
            <div><span className="font-medium">Amount:</span> {details.amount || 'N/A'} {details.fromCurrency || 'N/A'}</div>
            {details.toAmount && (
              <div><span className="font-medium">Converted Amount:</span> {details.toAmount} {details.toCurrency || 'N/A'}</div>
            )}
            <div><span className="font-medium">Reason:</span> {details.reason || 'No reason provided'}</div>
            {details.transactionId && (
              <div><span className="font-medium">Transaction ID:</span> {details.transactionId}</div>
            )}
          </div>
        );
        
      case AdminActionType.BAN_USER:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Status:</span> {details.status || formatDetailValue(details.isBanned)}</div>
            {details.notification && (
              <div><span className="font-medium">Notification:</span> {details.notification}</div>
            )}
            {details.reason && (
              <div><span className="font-medium">Reason:</span> {details.reason}</div>
            )}
          </div>
        );
        
      case AdminActionType.MUTE_USER:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Muted:</span> {formatDetailValue(details.isMuted)}</div>
            {details.duration && (
              <div><span className="font-medium">Duration:</span> {details.duration}</div>
            )}
            {details.reason && (
              <div><span className="font-medium">Reason:</span> {details.reason}</div>
            )}
          </div>
        );
        
      case AdminActionType.APPROVE_WITHDRAWAL:
      case AdminActionType.APPROVE_DEPOSIT:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Transaction ID:</span> {details.transactionId || 'N/A'}</div>
            <div><span className="font-medium">Amount:</span> {details.amount || 'N/A'} {details.currency || 'N/A'}</div>
            {details.method && (
              <div><span className="font-medium">Method:</span> {details.method}</div>
            )}
            {details.reason && (
              <div><span className="font-medium">Reason:</span> {details.reason}</div>
            )}
          </div>
        );
        
      case AdminActionType.EDIT_GAME_ODDS:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Game Type:</span> {details.gameType || 'N/A'}</div>
            <div><span className="font-medium">Win Chance:</span> {details.winChance || 'N/A'}%</div>
            <div><span className="font-medium">Max Multiplier:</span> {details.maxMultiplier || 'N/A'}x</div>
            {details.reason && (
              <div><span className="font-medium">Reason:</span> {details.reason}</div>
            )}
          </div>
        );
        
      case AdminActionType.ADD_ADVERTISEMENT:
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Ad Type:</span> {details.type || 'N/A'}</div>
            {details.title && (
              <div><span className="font-medium">Title:</span> {details.title}</div>
            )}
            {details.placement && (
              <div><span className="font-medium">Placement:</span> {details.placement}</div>
            )}
          </div>
        );
        
      default:
        // For any other action types, display all available fields
        return (
          <div className="space-y-1">
            {Object.entries(details).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</span>{' '}
                {formatDetailValue(value)}
              </div>
            ))}
          </div>
        );
    }
  };

  // Export audit data
  const exportAuditData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/audit/export?format=${format}&limit=1000`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const filename = `admin-audit-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        const csvContent = await response.text();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionBadgeColor = (action: AdminActionType) => {
    switch (action) {
      case AdminActionType.EDIT_BALANCE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case AdminActionType.BAN_USER:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case AdminActionType.MUTE_USER:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case AdminActionType.APPROVE_WITHDRAWAL:
      case AdminActionType.APPROVE_DEPOSIT:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Admin Audit Trail
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete transparency log of all administrative actions performed on the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportAuditData('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportAuditData('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actions Log
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {Object.values(AdminActionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin</label>
                  <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Admins" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Admins</SelectItem>
                      {uniqueAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Admin Actions ({filteredActions.length} {filteredActions.length === 1 ? 'action' : 'actions'})
              </CardTitle>
              <CardDescription>
                Chronological log of all administrative actions with full details and transparency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actionsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No admin actions found matching the current filters.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActions.map((action: AdminAction) => (
                    <div key={action.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={getActionBadgeColor(action.action)}>
                              {action.action.replace(/_/g, ' ')}
                            </Badge>
                            <span className="font-medium">{action.adminUsername || 'Unknown Admin'}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(action.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div><span className="font-medium">Admin ID:</span> {action.adminId}</div>
                              <div><span className="font-medium">Admin Username:</span> {action.adminUsername || 'Unknown'}</div>
                            </div>
                            {action.targetUserId && (
                              <div className="space-y-1">
                                <div><span className="font-medium">Target User ID:</span> {action.targetUserId}</div>
                                <div><span className="font-medium">Target Username:</span> {action.targetUsername || 'User ID: ' + action.targetUserId}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm mt-3 p-3 bg-muted/30 rounded-md">
                            <div className="font-medium mb-2 text-base">Action Details:</div>
                            {formatActionDetails(action)}
                          </div>
                          
                          {action.ipAddress && (
                            <div className="text-sm mt-2">
                              <span className="font-medium">IP Address:</span> {action.ipAddress}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Action ID:</span> #{action.id} | 
                            <span className="ml-2 font-medium">Timestamp:</span> {new Date(action.createdAt).toISOString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Total Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.statistics?.totalActions || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All admin actions logged
                  </p>
                </CardContent>
              </Card>

              {/* Actions by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.statistics?.actionsByType?.map((item: any) => (
                      <div key={item.action} className="flex justify-between items-center">
                        <span className="text-sm">{item.action.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Actions by Admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Actions by Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.statistics?.actionsByAdmin?.map((item: any) => (
                      <div key={item.adminId} className="flex justify-between items-center">
                        <span className="text-sm">{item.adminUsername}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No data available</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}