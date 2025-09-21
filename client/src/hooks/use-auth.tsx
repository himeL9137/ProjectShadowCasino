import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api";
import { setCookie, removeCookie } from "@/lib/cookie-utils";
import { authLogger } from "@/lib/debug-logger";

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
        authLogger.debug('Checking authentication status...');
        
        // Check if we have any stored authentication with enhanced detection
        const localToken = localStorage.getItem('authToken') || localStorage.getItem('jwt');
        const cookieString = document.cookie;
        const hasCookieAuth = cookieString.includes('jwt=');
        
        authLogger.debug('Checking stored authentication:', {
          localStorage: !!localToken,
          cookies: hasCookieAuth,
          cookieString: cookieString.substring(0, 100) + (cookieString.length > 100 ? '...' : '')
        });
        
        if (!localToken && !hasCookieAuth) {
          authLogger.debug('No stored authentication found, user needs to login');
          setUser(null);
          setIsLoading(false);
          return;
        }

        authLogger.debug('Found stored authentication, attempting auto-login...');
        
        try {
          const response = await get('/api/user');
          authLogger.debug('Auto-login response:', response.status, response.ok);

          if (response.ok) {
            try {
              const userData = await response.json();
              if (process.env.NODE_ENV === 'development') {
                authLogger.info('Auto-login successful for user:', userData.username);
              }
              setUser(userData);
              return; // Early return on success
            } catch (jsonError) {
              authLogger.warn('Auto-login JSON parsing error:', jsonError);
              setUser(null);
            }
          } else if (response.status === 403) {
            try {
              const errorData = await response.json();
              if (errorData.banned) {
                authLogger.warn('User account is banned');
                setError('Your account has been banned. Please contact support for assistance.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
                navigate('/auth');
                return;
              } else if (errorData.kicked) {
                authLogger.warn('User account is temporarily suspended');
                setError('Your account has been temporarily suspended. Please contact support for assistance.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
                navigate('/auth');
                return;
              } else {
                // Session expired due to IP/device change
                authLogger.info('Session expired due to security check, clearing stored auth');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                setUser(null);
              }
            } catch (jsonError) {
              // Fallback for non-JSON 403 responses
              authLogger.info('Session expired due to security check, clearing stored auth');
              localStorage.removeItem('authToken');
              localStorage.removeItem('jwt');
              document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
              setUser(null);
            }
          } else {
            authLogger.debug('Auto-login failed with status:', response.status);
            const responseText = await response.text();
            authLogger.debug('Response body:', responseText);
            setUser(null);
          }
        } catch (apiError) {
          authLogger.debug('Auto-login API error:', apiError);
          setUser(null);
        }
      } catch (error) {
        authLogger.error('Error during auto-login:', error);
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
      authLogger.debug('Logging in with:', data.username);

      // Use post helper to properly handle API base URL
      // The post helper already returns parsed JSON data
      const responseData = await post('/api/login', data);

      const { user, token } = responseData;
      authLogger.info('Login successful:', user);

      // Enhanced token storage for persistent sessions
      if (token) {
        authLogger.debug('Storing authentication token for persistent login...');

        // Primary storage in localStorage (most reliable)
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('jwt', token);
          localStorage.setItem('loginTime', Date.now().toString());
          localStorage.setItem('userAgent', navigator.userAgent);
          authLogger.debug('Authentication tokens stored for persistent sessions');
        } catch (err) {
          authLogger.warn('Error saving to localStorage:', err);
        }

        // Secondary storage in sessionStorage for immediate session
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('jwt', token);
          }
        } catch (err) {
          authLogger.warn('Error saving to sessionStorage:', err);
        }

        // Cookie storage is handled by server automatically with 30-day expiration
        authLogger.debug('Persistent login setup complete - user will stay logged in until logout or device change');
      } else {
        authLogger.error('No token received from login response');
      }

      setUser(user);
      navigate('/');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      authLogger.error('Login error:', errorMessage);
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
      authLogger.debug('Registering new user:', data.username);
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
        authLogger.warn('Error parsing registration response:', e);
        throw new Error('Invalid response from server');
      }

      const { user, token } = responseData;
      authLogger.info('Registration successful:', user);

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

          authLogger.debug('Auth token saved to multiple storage locations for better persistence');
        } catch (err) {
          authLogger.warn('Error saving to localStorage:', err);
          // Still continue - the cookie should work
        }

        // Token refresh disabled for now
        authLogger.debug('Token refresh disabled - using auth cookie persistence');
      } else {
        authLogger.error('No token received from registration response');
      }

      setUser(user);
      navigate('/');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      authLogger.error('Registration error:', errorMessage);
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
      authLogger.debug('Logging out and clearing persistent session...');
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
          authLogger.warn(`Error removing ${key} from localStorage:`, e);
        }
      });

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('jwt');
          sessionStorage.clear(); // Clear all session data
        } catch (e) {
          authLogger.warn('Error clearing sessionStorage:', e);
        }
      }

      // Clear cookies completely
      try {
        removeCookie('jwt', '/');
        removeCookie('jwt');
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      } catch (e) {
        authLogger.warn('Error clearing cookies:', e);
      }

      authLogger.debug('Persistent session cleared - user will need to login again');
      navigate('/auth');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      authLogger.error('Logout error:', error);
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
      authLogger.debug('Refreshing user data...');
      const response = await get('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        authLogger.debug('User data refreshed:', userData);
      }
    } catch (error) {
      authLogger.error('Error refreshing user:', error);
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