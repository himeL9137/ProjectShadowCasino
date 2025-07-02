// Utility function to parse cookies from document.cookie
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const fullCookieString = document.cookie;
    
    if (!fullCookieString) {
      return null;
    }
    
    // More robust cookie parsing
    const cookies = fullCookieString.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      
      // Check if this cookie starts with the name we're looking for
      if (cookie.indexOf(name + '=') === 0) {
        const cookieValue = cookie.substring(name.length + 1);
        return cookieValue;
      }
    }
    
    return null;
  } catch (err) {
    console.error(`Error parsing cookie ${name}:`, err);
    return null;
  }
}

// Set a cookie with optional parameters
export function setCookie(name: string, value: string, options: {
  expires?: Date | number;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
} = {}): void {
  if (typeof document === 'undefined') return;
  
  try {
    // Properly encode the value (especially for JWT tokens which can contain special chars)
    let cookieStr = `${name}=${encodeURIComponent(value)}`;
    
    // Handle expiration date
    if (options.expires) {
      if (typeof options.expires === 'number') {
        // If number, treat as days from now
        const date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
        options.expires = date;
      }
      cookieStr += `; expires=${options.expires.toUTCString()}`;
    }
    
    // Add max-age if provided (in seconds)
    if (options.maxAge !== undefined) {
      cookieStr += `; max-age=${options.maxAge}`;
    }
    
    // Add other options
    if (options.path) cookieStr += `; path=${options.path}`;
    if (options.secure) cookieStr += '; secure';
    if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
    
    console.log(`Setting cookie: ${name} with string length: ${cookieStr.length} chars`);
    
    // Try to set the cookie
    document.cookie = cookieStr;
    
    // Try to verify if cookie was actually set
    setTimeout(() => {
      const verifySet = getCookie(name);
      if (verifySet) {
        console.log(`Cookie ${name} successfully set and verified`);
      } else {
        // If cookie wasn't set, try again with different parameters
        console.warn(`Cookie ${name} was not successfully set. Trying again with minimal options.`);
        
        // Try with minimal options
        const simpleCookieStr = `${name}=${encodeURIComponent(value)}; path=/`;
        document.cookie = simpleCookieStr;
        
        // Check again
        setTimeout(() => {
          const recheck = getCookie(name);
          if (recheck) {
            console.log(`Cookie ${name} set successfully on second attempt`);
          } else {
            console.error(`Failed to set cookie ${name} even with minimal options. Browser may be blocking cookies.`);
            
            // Store an indicator that cookies are blocked
            try {
              localStorage.setItem('cookies_blocked', 'true');
            } catch (e) {
              // Ignore localStorage errors
            }
          }
        }, 50);
      }
    }, 50);
  } catch (err) {
    console.error(`Error setting cookie ${name}:`, err);
    
    // Fallback to localStorage only if cookies fail
    try {
      localStorage.setItem(`cookie_fallback_${name}`, value);
      console.log(`Stored ${name} in localStorage as cookie fallback`);
    } catch (storageErr) {
      console.error(`Failed to store in localStorage:`, storageErr);
    }
  }
}

// Remove a cookie
export function removeCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  
  // To delete a cookie, set its expiration date to a past date
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  console.log(`Cookie removed: ${name}`);
}

// Helper function to get authentication token from multiple sources
export function getAuthToken(): string | null {
  try {
    // 1. First try cookies (most secure and reliable)
    const cookieToken = getCookie('jwt');
    if (cookieToken && cookieToken.trim()) {
      return cookieToken.trim();
    }
    
    // 2. Fall back to localStorage
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('jwt');
    if (localToken && localToken.trim()) {
      // Sync back to cookie for consistency
      setCookie('jwt', localToken.trim(), { 
        path: '/', 
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
      return localToken.trim();
    }
    
    // 3. Check sessionStorage as last resort
    if (typeof sessionStorage !== 'undefined') {
      const sessionToken = sessionStorage.getItem('jwt');
      if (sessionToken && sessionToken.trim()) {
        return sessionToken.trim();
      }
    }
  } catch (err) {
    console.error('Error in getAuthToken:', err);
  }
  
  return null;
}