import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { adminApiCall } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function NotionSetupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    databases?: Array<{ id: string; title: string }>;
  } | null>(null);

  const [secretsStatus, setSecretsStatus] = useState<{
    integrationSecret: boolean;
    pageUrl: boolean;
  }>({
    integrationSecret: false,
    pageUrl: false,
  });

  // Check if Notion secrets are configured
  const checkNotionSecrets = async () => {
    try {
      setIsLoading(true);
      const status = await adminApiCall<{
        hasIntegrationSecret: boolean;
        hasPageUrl: boolean;
        pageId: string | null;
      }>('GET', '/api/admin/notion/status');
      setSecretsStatus({
        integrationSecret: status.hasIntegrationSecret,
        pageUrl: status.hasPageUrl,
      });
    } catch (error) {
      console.error('Error checking Notion secrets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Notion databases
  const setupNotionDatabases = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      interface SetupResponse {
        success: boolean;
        message: string;
        databases: Array<{ id: string; title: string; propertyCount: number }>;
      }
      
      const data = await adminApiCall<SetupResponse>('POST', '/api/admin/notion/setup');
      
      setResult({
        success: true,
        message: 'Notion databases successfully set up!',
        databases: data.databases,
      });
    } catch (error) {
      console.error('Error setting up Notion:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set up Notion databases',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // When dialog opens, check secrets status
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      checkNotionSecrets();
    } else {
      setResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Setup Notion Databases
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Notion Database Setup</DialogTitle>
          <DialogDescription>
            Initialize or update Notion databases for game content management.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
          {/* Secrets Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Integration Status</h3>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking Notion integration status...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  {secretsStatus.integrationSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">
                    {secretsStatus.integrationSecret
                      ? 'Notion integration secret is configured'
                      : 'Notion integration secret is missing'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {secretsStatus.pageUrl ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">
                    {secretsStatus.pageUrl
                      ? 'Notion page URL is configured'
                      : 'Notion page URL is missing'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Results */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {result.success ? 'Setup Complete' : 'Setup Failed'}
              </AlertTitle>
              <AlertDescription>
                {result.message}
                
                {result.databases && result.databases.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Created/Updated Databases:</h4>
                    <ul className="text-sm list-disc pl-5">
                      {result.databases.map((db) => (
                        <li key={db.id}>{db.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={setupNotionDatabases}
            disabled={isLoading || !secretsStatus.integrationSecret || !secretsStatus.pageUrl}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Setting up...' : 'Setup Notion Databases'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}