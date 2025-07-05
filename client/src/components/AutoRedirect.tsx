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
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastRedirectTimeRef = useRef<Map<number, number>>(new Map());

  // Fetch active redirect links
  const { data: activeLinks } = useQuery<RedirectLink[]>({
    queryKey: ["/api/redirect-links/active"],
    refetchInterval: 60000, // Refetch every minute to check for updates
  });

  useEffect(() => {
    if (!activeLinks || activeLinks.length === 0) {
      // Clear all timers if no active links
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      return;
    }

    // Set up timers for each active link
    activeLinks.forEach(link => {
      const existingTimer = timersRef.current.get(link.id);
      
      // Clear existing timer if it exists
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Calculate time until next redirect
      const lastRedirectTime = lastRedirectTimeRef.current.get(link.id) || 0;
      const currentTime = Date.now();
      const intervalMs = link.intervalMinutes * 60 * 1000;
      const timeSinceLastRedirect = currentTime - lastRedirectTime;
      const timeUntilNextRedirect = Math.max(0, intervalMs - timeSinceLastRedirect);

      // Set up the timer
      const timer = setTimeout(() => {
        // Show a toast notification before redirecting
        toast({
          title: "Redirecting...",
          description: `You will be redirected to ${link.url} in 3 seconds.`,
          duration: 3000,
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          lastRedirectTimeRef.current.set(link.id, Date.now());
          window.location.href = link.url;
        }, 3000);
      }, timeUntilNextRedirect);

      timersRef.current.set(link.id, timer);
    });

    // Clean up timers for links that are no longer active
    timersRef.current.forEach((timer, linkId) => {
      if (!activeLinks.find(link => link.id === linkId)) {
        clearTimeout(timer);
        timersRef.current.delete(linkId);
        lastRedirectTimeRef.current.delete(linkId);
      }
    });

    // Cleanup function
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [activeLinks, toast]);

  // This component doesn't render anything
  return null;
}