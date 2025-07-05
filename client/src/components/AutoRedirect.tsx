import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface RedirectLink {
  id: number;
  url: string;
  intervalMinutes: number;
  isActive: boolean;
}

interface LinkTimer {
  interval: NodeJS.Timeout;
  lastRedirectTime: number;
  link: RedirectLink;
}

export function AutoRedirect() {
  const { toast } = useToast();
  const timersRef = useRef<Map<number, LinkTimer>>(new Map());
  const mountedRef = useRef(true);

  // Fetch active redirect links
  const { data: activeLinks } = useQuery<RedirectLink[]>({
    queryKey: ["/api/redirect-links/active"],
    refetchInterval: 30000, // Refetch every 30 seconds to check for updates
  });

  // Function to handle redirect for a specific link
  const handleRedirect = useCallback((link: RedirectLink) => {
    if (!mountedRef.current) return;
    
    const now = new Date().toLocaleTimeString();
    console.log(`[AutoRedirect] [${now}] Executing redirect for link ID ${link.id} - ${link.url}`);
    
    // Show toast notification with time
    toast({
      title: "Opening Link...",
      description: `Opening ${link.url} in a new tab in 3 seconds. Time: ${now}`,
      duration: 3000,
    });

    // Open link after 3 seconds
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      console.log(`[AutoRedirect] [${now}] Opening link NOW: ${link.url}`);
      try {
        // Try to open the link
        const newWindow = window.open(link.url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.error(`[AutoRedirect] Popup was blocked for ${link.url}`);
          
          // Show persistent error message with instructions
          toast({
            title: "⚠️ Popup Blocked!",
            description: (
              <div>
                <p>Your browser is blocking popups. To enable automatic redirects:</p>
                <ol className="list-decimal ml-4 mt-2">
                  <li>Click the popup blocker icon in your address bar</li>
                  <li>Allow popups for this site</li>
                  <li>Refresh the page</li>
                </ol>
                <p className="mt-2">Link: {link.url}</p>
              </div>
            ) as any,
            variant: "destructive",
            duration: 10000,
          });

          // Also try alternative method - create a link and click it
          console.log(`[AutoRedirect] Trying alternative method - simulated click`);
          const a = document.createElement('a');
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          console.log(`[AutoRedirect] Successfully opened ${link.url} in new tab`);
          toast({
            title: "✓ Link Opened",
            description: `Successfully opened ${link.url} at ${now}`,
            duration: 2000,
          });
        }
      } catch (error) {
        console.error(`[AutoRedirect] Error opening link:`, error);
        toast({
          title: "Error Opening Link",
          description: `Failed to open ${link.url}: ${error}`,
          variant: "destructive",
          duration: 5000,
        });
      }
      
      // Update last redirect time
      const timer = timersRef.current.get(link.id);
      if (timer) {
        timer.lastRedirectTime = Date.now();
      }
    }, 3000);
  }, [toast]);

  // Function to set up a timer for a link
  const setupLinkTimer = useCallback((link: RedirectLink) => {
    // Clear existing timer if any
    const existingTimer = timersRef.current.get(link.id);
    if (existingTimer) {
      console.log(`[AutoRedirect] Clearing existing timer for link ID ${link.id}`);
      clearInterval(existingTimer.interval);
    }

    const intervalMs = link.intervalMinutes * 60 * 1000;
    console.log(`[AutoRedirect] Setting up NEW timer for link ID ${link.id} (${link.url}) - Interval: ${link.intervalMinutes} minutes (${intervalMs}ms)`);

    // Create the interval
    const interval = setInterval(() => {
      console.log(`[AutoRedirect] Timer fired for link ID ${link.id}`);
      handleRedirect(link);
    }, intervalMs);

    // Store the timer
    timersRef.current.set(link.id, {
      interval,
      lastRedirectTime: Date.now(),
      link
    });

    // Trigger first redirect immediately
    console.log(`[AutoRedirect] Triggering FIRST redirect for link ID ${link.id}`);
    handleRedirect(link);
  }, [handleRedirect]);

  // Main effect to manage timers
  useEffect(() => {
    if (!activeLinks || activeLinks.length === 0) {
      console.log(`[AutoRedirect] No active links, clearing all timers`);
      timersRef.current.forEach((timer, id) => {
        console.log(`[AutoRedirect] Clearing timer for link ID ${id}`);
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
      return;
    }

    console.log(`[AutoRedirect] Processing ${activeLinks.length} active links`);

    // Set up timers for new/updated links
    activeLinks.forEach(link => {
      const existingTimer = timersRef.current.get(link.id);
      
      // Check if we need to set up a new timer
      if (!existingTimer || 
          existingTimer.link.intervalMinutes !== link.intervalMinutes ||
          existingTimer.link.url !== link.url) {
        console.log(`[AutoRedirect] Link ${link.id} is new or updated, setting up timer`);
        setupLinkTimer(link);
      } else {
        console.log(`[AutoRedirect] Link ${link.id} already has an active timer, skipping`);
      }
    });

    // Remove timers for links that are no longer active
    const activeIds = new Set(activeLinks.map(link => link.id));
    timersRef.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
        console.log(`[AutoRedirect] Link ID ${id} is no longer active, removing timer`);
        clearInterval(timer.interval);
        timersRef.current.delete(id);
      }
    });
  }, [activeLinks, setupLinkTimer]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      console.log(`[AutoRedirect] Component unmounting, clearing all timers`);
      timersRef.current.forEach((timer, id) => {
        console.log(`[AutoRedirect] Clearing timer for link ID ${id} on unmount`);
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
    };
  }, []);

  // Show a small status indicator when redirects are active
  if (!activeLinks || activeLinks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg shadow-lg z-50 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Auto-redirect active: {activeLinks.length} link{activeLinks.length > 1 ? 's' : ''}</span>
      </div>
      <div className="text-xs text-gray-300 mt-1">
        {activeLinks.map(link => (
          <div key={link.id}>
            Link {link.id}: Every {link.intervalMinutes} min
          </div>
        ))}
      </div>
    </div>
  );
}