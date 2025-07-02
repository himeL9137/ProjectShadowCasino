import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthToken, setCookie, getCookie } from "./cookie-utils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    // Check if response is HTML instead of JSON (common server error)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Received HTML instead of JSON. Server might be down or returning an error page. Status: ${res.status}`);
    }
    
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get token from unified token source
  const token = getAuthToken();
  
  // Create base headers
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Always include credentials for cookies
    });
    
    // Check for Set-Cookie header in response (for debugging in development)
    if (process.env.NODE_ENV === 'development') {
      const setCookieHeader = res.headers.get('Set-Cookie');
      if (!setCookieHeader) {
        console.log('No Set-Cookie header in response');
      }
    }

    await throwIfResNotOk(res);
    
    // Handle authentication responses (login/register)
    if ((url.includes('/login') || url.includes('/register')) && method.toUpperCase() === 'POST') {
      try {
        // Clone the response to preserve the original
        const resClone = res.clone();
        const responseData = await resClone.json();
        
        if (responseData && responseData.token) {
          console.log('Received token in response, storing in multiple locations for redundancy');
          
          // Store in localStorage (primary)
          localStorage.setItem('authToken', responseData.token);
          localStorage.setItem('jwt', responseData.token);
          
          // Set in cookies (backup) - will help with WebSocket authentication
          // This is belt-and-suspenders approach - server should set cookies, but we do it client-side as well
          setCookie('jwt', responseData.token, {
            path: '/',
            sameSite: 'lax'
          });
          
          // Verify cookie was set
          const cookieCheck = getCookie('jwt');
          if (cookieCheck) {
            console.log('JWT cookie set successfully by client');
          } else {
            console.warn('Failed to set JWT cookie on client side');
          }
          
          console.log('Authentication information saved in multiple locations for redundancy');
        }
      } catch (e) {
        console.warn('Could not extract token from response:', e);
      }
    }
    
    return res;
  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
}

// Helper function to handle admin API calls with proper authentication
export async function adminApiCall<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  try {
    // Use the unified token retrieval function
    const token = getAuthToken();
    
    console.log(`Making admin API call to ${url} with token: ${token ? 'present' : 'missing'}`);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Using auth token from getAuthToken(): ${token.substring(0, 10)}...`);
    } else {
      console.warn('No auth token found for admin API call');
    }

    // Make the request with authentication
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Include cookies for session-based auth
    });

    // Handle common error responses
    if (!res.ok) {
      // Handle specific error codes
      if (res.status === 401) {
        console.error('Authentication required for admin API call. Redirecting to login...');
        // Clear any existing tokens as they're invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('jwt');
        
        // Optional: Redirect to login page
        window.location.href = '/auth';
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (res.status === 403) {
        console.error('Forbidden: Insufficient permissions for admin API call');
        throw new Error('You do not have permission to access this resource.');
      }
      
      let errorMessage;
      try {
        // Try to parse error as JSON
        const errorData = await res.json();
        errorMessage = errorData.message || `Request failed with status ${res.status}`;
      } catch (e) {
        // If not JSON, get as text
        const errorText = await res.text();
        errorMessage = errorText || `Request failed with status ${res.status}`;
      }
      
      console.error(`Admin API call failed for ${url}:`, errorMessage);
      throw new Error(errorMessage);
    }

    // If no content, return empty object
    if (res.status === 204) {
      return {} as T;
    }

    // Parse JSON response
    return await res.json();
  } catch (error) {
    console.error(`Admin API call failed for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from unified token source
    const token = getAuthToken();
    
    // Create headers with authorization if token exists
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Query: Adding Authorization header with token (first 10 chars): ${token.substring(0, 10)}...`);
    } else {
      console.log('Query: No auth token available, proceeding without Authorization header');
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include", // Always include credentials for cookies
      });
      
      // Handle specific status codes
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        
        // Authentication required
        // Don't attempt to set cookies here as browser security may prevent it
        // Just redirect to login page instead
        window.location.href = '/auth';
        throw new Error('Authentication required');
      }
      
      // Check and handle errors
      await throwIfResNotOk(res);
      
      // Parse JSON response
      try {
        return await res.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error('Invalid JSON response from server. Please try again or contact support.');
      }
      
    } catch (error) {
      console.error(`Query to ${queryKey[0]} failed:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
