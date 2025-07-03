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
  details?: any;
  createdAt: string;
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
    if (!action.details) return 'No details';
    
    const details = action.details;
    switch (action.action) {
      case AdminActionType.EDIT_BALANCE:
        return `Amount: ${details.amount || 'N/A'}, Currency: ${details.fromCurrency || 'N/A'}, Reason: ${details.reason || 'No reason provided'}`;
      case AdminActionType.BAN_USER:
        return `Status: ${details.status || 'N/A'}, Notification: ${details.notification || 'None'}`;
      case AdminActionType.MUTE_USER:
        return `Muted: ${details.isMuted ? 'Yes' : 'No'}`;
      default:
        return JSON.stringify(details);
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
                            <div>
                              <span className="font-medium">Admin ID:</span> {action.adminId}
                            </div>
                            {action.targetUserId && (
                              <div>
                                <span className="font-medium">Target User:</span> {action.targetUserId}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Details:</span> {formatActionDetails(action)}
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