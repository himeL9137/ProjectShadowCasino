import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RedirectLink {
  id: number;
  url: string;
  intervalMinutes: number;
  isActive: boolean;
}

export function AutoRedirect() {
  const { toast } = useToast();
  const intervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const activeLinksRef = useRef<RedirectLink[]>([]);

  // Fetch active redirect links
  const { data: activeLinks } = useQuery<RedirectLink[]>({
    queryKey: ["/api/redirect-links/active"],
    refetchInterval: 30000, // Refetch every 30 seconds to check for updates
  });

  // Update the ref when activeLinks changes
  useEffect(() => {
    if (activeLinks) {
      activeLinksRef.current = activeLinks;
    }
  }, [activeLinks]);

  useEffect(() => {
    if (!activeLinks || activeLinks.length === 0) {
      // Clear all intervals if no active links
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
      return;
    }

    // Set up intervals for each active link
    activeLinks.forEach(link => {
      // Skip if interval already exists for this link
      if (intervalsRef.current.has(link.id)) {
        return;
      }

      const intervalMs = link.intervalMinutes * 60 * 1000;

      // Function to handle redirect
      const handleRedirect = () => {
        console.log(`[AutoRedirect] Checking redirect for link ID ${link.id}`);
        
        // Check if link is still active
        const currentActiveLinks = activeLinksRef.current;
        const isStillActive = currentActiveLinks.find(activeLink => 
          activeLink.id === link.id && activeLink.isActive
        );

        if (!isStillActive) {
          console.log(`[AutoRedirect] Link ID ${link.id} is no longer active, clearing interval`);
          // Link is no longer active, clear the interval
          const interval = intervalsRef.current.get(link.id);
          if (interval) {
            clearInterval(interval);
            intervalsRef.current.delete(link.id);
          }
          return;
        }

        console.log(`[AutoRedirect] Triggering redirect for ${link.url} (interval: ${link.intervalMinutes} min)`);
        
        // Show a toast notification before opening link
        toast({
          title: "Opening Link...",
          description: `Opening ${link.url} in a new tab in 3 seconds.`,
          duration: 3000,
        });

        // Open link in new tab after 3 seconds
        setTimeout(() => {
          console.log(`[AutoRedirect] Opening link: ${link.url}`);
          window.open(link.url, '_blank', 'noopener,noreferrer');
        }, 3000);
      };

      // Set up the recurring interval
      console.log(`[AutoRedirect] Setting up interval for link ID ${link.id} (${link.url}) every ${link.intervalMinutes} minutes`);
      const interval = setInterval(handleRedirect, intervalMs);
      intervalsRef.current.set(link.id, interval);

      // Trigger first redirect immediately if it's a new link
      console.log(`[AutoRedirect] Triggering first redirect immediately for link ID ${link.id}`);
      handleRedirect();
    });

    // Clean up intervals for links that are no longer active
    intervalsRef.current.forEach((interval, linkId) => {
      if (!activeLinks.find(link => link.id === linkId)) {
        clearInterval(interval);
        intervalsRef.current.delete(linkId);
      }
    });

    // Cleanup function
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, [activeLinks, toast]);

  // This component doesn't render anything
  return null;
}