import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotionSetupButton } from './NotionSetupButton';

export function SystemTab() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Notion Setup Card */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Notion Integration</CardTitle>
          <CardDescription>
            Manage game configurations, promotions, and content through Notion databases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotionSetupButton />
        </CardContent>
      </Card>
      
      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current operational status of server components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Server Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Notion Integration</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>WebSocket Service</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Running
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Server Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
          <CardDescription>Technical details about the server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Environment</span>
              <span className="text-sm font-mono">{process.env.NODE_ENV || 'development'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Node.js Version</span>
              <span className="text-sm font-mono">v20.x</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Database Type</span>
              <span className="text-sm font-mono">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Last Restart</span>
              <span className="text-sm">Recently</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}