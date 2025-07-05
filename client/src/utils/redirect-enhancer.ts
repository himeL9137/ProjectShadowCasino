// Advanced redirect enhancement utilities
export class RedirectEnhancer {
  private static instance: RedirectEnhancer;
  private scriptInjected = false;
  
  private constructor() {}
  
  static getInstance(): RedirectEnhancer {
    if (!RedirectEnhancer.instance) {
      RedirectEnhancer.instance = new RedirectEnhancer();
    }
    return RedirectEnhancer.instance;
  }
  
  // Inject runtime bypass script
  injectBypassScript(): void {
    if (this.scriptInjected) return;
    
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Override popup blocking detection
        const originalOpen = window.open;
        window.open = function(...args) {
          try {
            const result = originalOpen.apply(window, args);
            if (!result || result.closed) {
              // Fallback method using location.assign
              const url = args[0];
              if (url && typeof url === 'string') {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.style.display = 'none';
                document.body.appendChild(a);
                
                // Use multiple click methods
                if (a.click) a.click();
                const evt = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                a.dispatchEvent(evt);
                
                setTimeout(() => a.remove(), 10);
              }
            }
            return result;
          } catch (e) {
            return null;
          }
        };
        
        // Override adblock detection on window properties
        const blockedProps = ['adBlock', 'adBlockEnabled', 'adBlockActive', 'adblockDetected'];
        blockedProps.forEach(prop => {
          try {
            Object.defineProperty(window, prop, {
              get: () => false,
              set: () => {},
              configurable: false
            });
          } catch (e) {}
        });
        
        // Override common ad-related element queries
        const originalQuerySelector = document.querySelector;
        const originalQuerySelectorAll = document.querySelectorAll;
        
        document.querySelector = function(selector) {
          if (selector && selector.includes('adblock')) {
            return null;
          }
          return originalQuerySelector.apply(this, arguments);
        };
        
        document.querySelectorAll = function(selector) {
          if (selector && selector.includes('adblock')) {
            return [];
          }
          return originalQuerySelectorAll.apply(this, arguments);
        };
        
        // Create invisible click zones for redirect
        const createClickZone = () => {
          const zone = document.createElement('div');
          zone.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0;pointer-events:none;';
          zone.className = 'click-zone-' + Math.random().toString(36).substr(2, 9);
          
          // Make it clickable on demand
          zone.makeClickable = (url) => {
            zone.style.pointerEvents = 'auto';
            zone.style.zIndex = '999999';
            zone.onclick = () => {
              window.location.href = url;
              zone.style.pointerEvents = 'none';
              zone.style.zIndex = '-1';
            };
            
            // Auto-disable after 100ms
            setTimeout(() => {
              zone.style.pointerEvents = 'none';
              zone.style.zIndex = '-1';
            }, 100);
          };
          
          document.body.appendChild(zone);
          window.__clickZone = zone;
        };
        
        if (document.body) {
          createClickZone();
        } else {
          document.addEventListener('DOMContentLoaded', createClickZone);
        }
        
        // Intercept and modify fetch responses for ad detection
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const url = args[0]?.toString() || '';
          
          if (url.includes('adblock') || url.includes('detect') || url.includes('check')) {
            return new Response(JSON.stringify({ detected: false, adBlockEnabled: false }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          try {
            const response = await originalFetch.apply(this, args);
            
            // Intercept and modify responses
            if (url.includes('ad') || url.includes('banner')) {
              const clonedResponse = response.clone();
              const text = await clonedResponse.text();
              
              if (text.includes('adblock') || text.includes('detected')) {
                return new Response(text.replace(/adblock|detected|blocked/gi, ''), {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers
                });
              }
            }
            
            return response;
          } catch (e) {
            return originalFetch.apply(this, args);
          }
        };
        
        // Prevent console warnings about popups
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.warn = function(...args) {
          const msg = args[0]?.toString() || '';
          if (!msg.includes('popup') && !msg.includes('blocked')) {
            originalWarn.apply(console, args);
          }
        };
        
        console.error = function(...args) {
          const msg = args[0]?.toString() || '';
          if (!msg.includes('popup') && !msg.includes('blocked')) {
            originalError.apply(console, args);
          }
        };
      })();
    `;
    
    document.head.insertBefore(script, document.head.firstChild);
    this.scriptInjected = true;
  }
  
  // Create hidden redirect frame
  createHiddenFrame(url: string): void {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;';
    frame.src = 'about:blank';
    
    document.body.appendChild(frame);
    
    // Use multiple methods to navigate the frame
    setTimeout(() => {
      try {
        if (frame.contentWindow) {
          frame.contentWindow.location.href = url;
        }
      } catch (e) {
        frame.src = url;
      }
      
      // Remove frame after redirect
      setTimeout(() => frame.remove(), 5000);
    }, 50);
  }
  
  // Use Web Workers for background redirect
  createWorkerRedirect(url: string): void {
    try {
      const workerCode = `
        self.addEventListener('message', function(e) {
          if (e.data.action === 'redirect') {
            // Use importScripts to load external redirect
            try {
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({ type: 'navigate', url: e.data.url });
                });
              });
            } catch (err) {
              // Fallback
              self.postMessage({ type: 'redirect', url: e.data.url });
            }
          }
        });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.postMessage({ action: 'redirect', url });
      
      // Listen for worker messages
      worker.onmessage = (e) => {
        if (e.data.type === 'redirect') {
          window.location.href = e.data.url;
        }
      };
      
      // Terminate worker after use
      setTimeout(() => worker.terminate(), 1000);
    } catch (e) {
      // Silent fail
    }
  }
  
  // Advanced popup with fallbacks
  enhancedPopup(url: string): void {
    const methods = [
      // Method 1: Standard window.open
      () => window.open(url, '_blank'),
      
      // Method 2: Click on dynamically created link
      () => {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
      },
      
      // Method 3: Form submission
      () => {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = url;
        form.target = '_blank';
        document.body.appendChild(form);
        form.submit();
        form.remove();
      },
      
      // Method 4: Use click zone if available
      () => {
        if ((window as any).__clickZone) {
          (window as any).__clickZone.makeClickable(url);
          // Simulate user interaction
          const evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
          });
          (window as any).__clickZone.dispatchEvent(evt);
        }
      },
      
      // Method 5: Location replace as last resort
      () => {
        window.location.replace(url);
      }
    ];
    
    // Try each method with small delays
    let methodIndex = 0;
    const tryNext = () => {
      if (methodIndex < methods.length) {
        try {
          methods[methodIndex]();
        } catch (e) {
          // Silent fail, try next
        }
        methodIndex++;
        if (methodIndex < methods.length - 1) { // Don't delay for location.replace
          setTimeout(tryNext, 50);
        } else {
          tryNext();
        }
      }
    };
    
    tryNext();
  }
}