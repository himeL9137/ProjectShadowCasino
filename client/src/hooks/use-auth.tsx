import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api";
import { setCookie, removeCookie } from "@/lib/cookie-utils";

type User = {
  id: number;
  username: string;
  email: string;
  phone: string;
  balance: string;
  currency: string;
  role: string;
  isMuted: boolean;
  isBanned: boolean;
}

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData & { savePassword?: boolean }) => Promise<any>; // Modified type to support cleanup function return
  register: (data: RegisterData) => Promise<any>; // Modified type to support cleanup function return
  logout: () => Promise<void>;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = React.memo(function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Auto-login check with persistent session support
  useEffect(() => {
    async function loadUser() {
      try {
        console.log('Checking authentication status...');
        
        // Check if we have any stored authentication with enhanced detection
        const localToken = localStorage.getItem('authToken') || localStorage.getItem('jwt');
        const cookieString = document.cookie;
        const hasCookieAuth = cookieString.includes('jwt=');
        
        console.log('Checking stored authentication:', {
          localStorage: !!localToken,
          cookies: hasCookieAuth,
          cookieString: cookieString.substring(0, 100) + (cookieString.length > 100 ? '...' : '')
        });
        
        if (!localToken && !hasCookieAuth) {
          console.log('No stored authentication found, user needs to login');
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log('Found stored authentication, attempting auto-login...');
        
        try {
          const response = await get('/api/user');
          console.log('Auto-login response:', response.status, response.ok);

          if (response.ok) {
            try {
              const userData = await response.json();
              if (process.env.NODE_ENV === 'development') {
                console.log('Auto-login successful for user:', userData.username);
              }
              setUser(userData);
              return; // Early return on success
            } catch (jsonError) {
              console.log('Auto-login JSON parsing error:', jsonError);
              setUser(null);
            }
          } else if (response.status === 403) {
            try {
              const errorData = await response.json();
              if (errorData.banned) {
                console.log('User account is banned');
                setError('Your account has been banned. Please contact support for assistance.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
                navigate('/auth');
                return;
              } else if (errorData.kicked) {
                console.log('User account is temporarily suspended');
                setError('Your account has been temporarily suspended. Please contact support for assistance.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
                navigate('/auth');
                return;
              } else {
                // Session expired due to IP/device change
                console.log('Session expired due to security check, clearing stored auth');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
              }
            } catch (jsonError) {
              // Fallback for non-JSON 403 responses
              console.log('Session expired due to security check, clearing stored auth');
              localStorage.removeItem('authToken');
              localStorage.removeItem('jwt');
              document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
              setUser(null);
            }
          } else {
            console.log('Auto-login failed with status:', response.status);
            const responseText = await response.text();
            console.log('Response body:', responseText);
            setUser(null);
          }
        } catch (apiError) {
          console.log('Auto-login API error:', apiError);
          setUser(null);
        }
      } catch (error) {
        console.error('Error during auto-login:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login function with enhanced token persistence
  const login = async (data: LoginData & { savePassword?: boolean }) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('Logging in with:', data.username);

      // Use post helper to properly handle API base URL
      // The post helper already returns parsed JSON data
      const responseData = await post('/api/login', data);

      const { user, token } = responseData;
      console.log('Login successful:', user);

      // Enhanced token storage for persistent sessions
      if (token) {
        console.log('Storing authentication token for persistent login...');

        // Primary storage in localStorage (most reliable)
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('jwt', token);
          localStorage.setItem('loginTime', Date.now().toString());
          localStorage.setItem('userAgent', navigator.userAgent);
          console.log('Authentication tokens stored for persistent sessions');
        } catch (err) {
          console.warn('Error saving to localStorage:', err);
        }

        // Secondary storage in sessionStorage for immediate session
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('jwt', token);
          }
        } catch (err) {
          console.warn('Error saving to sessionStorage:', err);
        }

        // Cookie storage is handled by server automatically with 30-day expiration
        console.log('Persistent login setup complete - user will stay logged in until logout or device change');
      } else {
        console.error('No token received from login response');
      }

      setUser(user);
      navigate('/');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function with enhanced token persistence (matching login)
  const register = async (data: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('Registering new user:', data.username);
      const registerData = {
        ...data,
        balance: "0", // New users start with 0 balance
        currency: "USD", // Default currency
        role: "user",
        isMuted: false,
        isBanned: false,
      };

      // Use fetch directly instead of the post helper to avoid json parsing issues
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registerData),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorText = 'Registration failed';
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            errorText = await response.text();
          } catch (e2) {
            // If all fails, use the default error message
          }
        }
        throw new Error(errorText);
      }

      // Parse the response carefully to handle any potential issues
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Error parsing registration response:', e);
        throw new Error('Invalid response from server');
      }

      const { user, token } = responseData;
      console.log('Registration successful:', user);

      // Store token in both cookies and local storage for compatibility
      if (token) {
        // Store token in multiple locations for maximum persistence

        // 1. Set in cookie (primary storage method)
        setCookie('jwt', token, { 
          path: '/', 
          sameSite: 'lax',
          // Set expiry to 30 days for better persistence
          maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
        });

        // 2. Store in localStorage as backup (multiple keys for compatibility)
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('jwt', token);
          localStorage.setItem('cookie_fallback_jwt', token); // Special fallback for cookie-blocked environments
          localStorage.setItem('auth_timestamp', Date.now().toString()); // Store timestamp for later validation

          // 3. If session storage is available, use that too (for same-session persistence)
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('jwt', token);
          }

          console.log('Auth token saved to multiple storage locations for better persistence');
        } catch (err) {
          console.warn('Error saving to localStorage:', err);
          // Still continue - the cookie should work
        }

        // Token refresh disabled for now
        console.log('Token refresh disabled - using auth cookie persistence');
      } else {
        console.error('No token received from registration response');
      }

      setUser(user);
      navigate('/');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('Registration error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout with complete session cleanup
  const logout = async () => {
    setError(null);

    try {
      console.log('Logging out and clearing persistent session...');
      await post('/api/logout', {});

      // Clear user data
      setUser(null);

      // Remove all authentication data from localStorage
      const keysToRemove = [
        'authToken',
        'jwt',
        'loginTime',
        'userAgent',
        'authHeader',
        'cookie_fallback_jwt',
        'auth_timestamp',
        'cookies_blocked'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Error removing ${key} from localStorage:`, e);
        }
      });

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('jwt');
          sessionStorage.clear(); // Clear all session data
        } catch (e) {
          console.warn('Error clearing sessionStorage:', e);
        }
      }

      // Clear cookies completely
      try {
        removeCookie('jwt', '/');
        removeCookie('jwt');
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      } catch (e) {
        console.warn('Error clearing cookies:', e);
      }

      console.log('Persistent session cleared - user will need to login again');
      navigate('/auth');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', error);
    }
  };

  // Fix TypeScript errors by wrapping the functions
  const wrappedLogin = async (data: LoginData & { savePassword?: boolean }) => {
    const result = await login(data);
    // Ignore the return value from login to satisfy Promise<any>
    return undefined;
  };

  const wrappedRegister = async (data: RegisterData) => {
    const result = await register(data);
    // Ignore the return value from register to satisfy Promise<any>
    return undefined;
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const response = await get('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('User data refreshed:', userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      login: wrappedLogin, 
      register: wrappedRegister, 
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}