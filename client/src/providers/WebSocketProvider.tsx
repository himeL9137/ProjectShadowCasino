import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { Currency } from '@shared/schema';
import { getCookie, setCookie, getAuthToken } from '@/lib/cookie-utils';
import { buildWebSocketUrl } from '@/config/api';

// Define the WebSocket context type
interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
}

// Create the context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket configuration constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3 seconds
const CLIENT_PING_INTERVAL = 25000; // 25 seconds - slightly less than server heartbeat

// Provider component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to create a WebSocket connection
  const createWebSocketConnection = useCallback(() => {
    if (!user) return null;

    console.log('Setting up WebSocket connection...');

    // Get the JWT token from various sources
    let token = '';
    let authHeader = '';

    try {
      // Use our getAuthToken utility which tries multiple sources
      token = getAuthToken() || '';

      // Only log token details in development
      if (process.env.NODE_ENV === 'development' && token) {
        console.log('WebSocket auth token acquired');
      }

      // If we have a token in user object but not in cookie/localStorage, use that
      // and store it in both cookie and localStorage for future use
      if (!token && user) {
        const userToken = (user as any).token;
        if (userToken) {
          token = userToken;
          console.log('Using token from user object for WebSocket');

          // Sync token to both storage mechanisms
          setCookie('jwt', userToken, {
            path: '/',
            sameSite: 'lax'
          });
          localStorage.setItem('jwt', userToken);
          localStorage.setItem('authToken', userToken);
        }
      }

      if (!token && process.env.NODE_ENV === 'development') {
        console.warn('No authentication token found for WebSocket connection');
      }
    } catch (err) {
      console.error('Error retrieving token for WebSocket:', err);
    }

    // Use the new configuration function to get the correct WebSocket URL
    const wsUrl = buildWebSocketUrl();
    console.log('WebSocket URL:', wsUrl);

    // Create WebSocket with options
    let newSocket: WebSocket;

    try {
      // Create WebSocket with token if available
      if (token) {
        console.log('Creating WebSocket with token');
        newSocket = new WebSocket(`${wsUrl}?token=${token}`);
      } else {
        console.log('Creating WebSocket without token');
        newSocket = new WebSocket(wsUrl);
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      return null;
    }

    return newSocket;
  }, [user]);

  // Function to handle reconnection
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Maximum reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      console.log(`Reconnection attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
      const newSocket = createWebSocketConnection();

      if (newSocket) {
        setSocket(newSocket);
        setupSocketHandlers(newSocket);
      }
    }, RECONNECT_INTERVAL);
  }, [createWebSocketConnection]);

  // Setup WebSocket event handlers
  const setupSocketHandlers = useCallback((webSocket: WebSocket) => {
    webSocket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    webSocket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      setIsConnected(false);

      // Don't attempt to reconnect if the close was clean and intentional (code 1000)
      if (event.code !== 1000 && user) {
        reconnect();
      }
    };

    webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    webSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [reconnect]);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    // Close existing connection if there is one
    if (socket) {
      socket.close(1000, 'Intentional disconnect'); // Clean close
      setSocket(null);
      setIsConnected(false);
    }

    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnect attempts
    reconnectAttempts.current = 0;

    // Only attempt to connect if user is authenticated
    if (user) {
      const newSocket = createWebSocketConnection();

      if (newSocket) {
        setupSocketHandlers(newSocket);
        setSocket(newSocket);

        // Clean up on unmount
        return () => {
          console.log('Unmounting, closing WebSocket connection');
          // Clear reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          // Clear ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          // Close socket connection
          newSocket.close(1000, 'Component unmounted');
        };
      }
    } else {
      console.log('No user authenticated, skipping WebSocket connection until user logs in');
    }
  }, [user, createWebSocketConnection, setupSocketHandlers]);

  // Handle messages received from the server
  const handleSocketMessage = (data: any) => {
    const { type, payload } = data;

    switch (type) {
      case 'balance_update':
        handleBalanceUpdate(payload);
        break;
      case 'currency_changed':
        // Special handling for currency changes to ensure UI updates without page refresh
        console.log('Received currency change event:', payload);
        handleCurrencyChanged(payload);
        break;
      case 'chat_message':
        // Handle chat messages
        break;
      case 'game_update':
        // Handle game updates
        break;
      case 'user_muted':
        // Handle user muted notification
        break;
      case 'connected':
        console.log('Connected to WebSocket server as:', payload.username);
        break;
      case 'heartbeat':
        // Respond to server heartbeat to keep connection alive
        handleHeartbeat();
        break;
      case 'pong':
        // Server responded to our ping
        console.log('Received pong from server');
        break;
      default:
        console.log('Unhandled WebSocket message type:', type);
    }
  };

  // Handle currency change events with improved event distribution
  const handleCurrencyChanged = (payload: any) => {
    console.log('Processing currency change event via WebSocket:', payload);

    // Extract currency information - handle both formats from different sources
    const newCurrency = payload.newCurrency || payload.currency;
    const newBalance = payload.newBalance || payload.balance;
    const oldCurrency = payload.oldCurrency || payload.previousCurrency;
    const oldBalance = payload.oldBalance || payload.previousBalance;

    if (!newCurrency || !newBalance) {
      console.error('Currency change event missing required data:', payload);
      return;
    }

    // Update React Query cache for immediate UI updates
    queryClient.setQueryData(['/api/wallet/balance'], {
      balance: newBalance,
      currency: newCurrency
    });

    // Trigger a focused invalidation for wallet-related queries
    queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });

    // Create a standard format for the update
    const updateData = {
      balance: newBalance,
      currency: newCurrency,
      oldCurrency: oldCurrency,
      oldBalance: oldBalance,
      type: 'currency_change',
      timestamp: Date.now(),
      source: 'websocket'
    };

    try {
      // Store in multiple locations for resilience
      localStorage.setItem('websocket_balance_update', JSON.stringify(updateData));
      localStorage.setItem('last_currency_change', JSON.stringify(updateData));
      sessionStorage.setItem('current_currency', newCurrency);
      sessionStorage.setItem('current_balance', newBalance);

      // Broadcast via storage event (works across tabs)
      const storageEvent = new StorageEvent('storage', {
        key: 'websocket_balance_update',
        newValue: JSON.stringify(updateData)
      });
      window.dispatchEvent(storageEvent);

      // Broadcast via specialized custom event (works within current window)
      const currencyEvent = new CustomEvent('currency_changed', { 
        detail: updateData 
      });
      window.dispatchEvent(currencyEvent);

      // Broadcast via balance update event (for components using that listener)
      const balanceEvent = new CustomEvent('balance_updated', { 
        detail: updateData 
      });
      window.dispatchEvent(balanceEvent);

      console.log(`Currency changed successfully: ${oldCurrency} (${oldBalance}) -> ${newCurrency} (${newBalance})`);
    } catch (error) {
      console.error('Error broadcasting currency change:', error);
    }
  };

  // Handle heartbeat messages from the server
  const handleHeartbeat = () => {
    if (socket && isConnected) {
      // Respond with a ping message to let the server know we're alive
      sendMessage('ping', { timestamp: new Date().toISOString() });
    }
  };

  // Set up client-side ping interval to keep connection alive
  useEffect(() => {
    // Start ping interval when connected
    if (isConnected && socket) {
      console.log('Starting client ping interval');

      // Clear any existing interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Set up new interval
      pingIntervalRef.current = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          console.log('Sending client ping to keep connection alive');
          sendMessage('ping', { timestamp: new Date().toISOString() });
        }
      }, CLIENT_PING_INTERVAL);

      // Clean up interval on component unmount or disconnect
      return () => {
        if (pingIntervalRef.current) {
          console.log('Clearing client ping interval');
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, socket]);

  // Handle balance updates from the server
  const handleBalanceUpdate = (payload: { balance: string; currency: Currency }) => {
    console.log('Received balance update:', payload);

    // Update the cached balance data
    queryClient.setQueryData(['/api/wallet/balance'], {
      balance: payload.balance,
      currency: payload.currency
    });

    // Notify any relevant components
    queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });

    // Store in localStorage for cross-component communication
    // This triggers a storage event that CurrencyProvider and other components listen for
    try {
      const updateData = {
        balance: payload.balance,
        currency: payload.currency,
        timestamp: Date.now()
      };

      localStorage.setItem('websocket_balance_update', JSON.stringify(updateData));

      // Dispatch a custom event for components that might be in the same window
      // (storage events only fire in other windows/tabs)
      const storageEvent = new StorageEvent('storage', {
        key: 'websocket_balance_update',
        newValue: JSON.stringify(updateData)
      });
      window.dispatchEvent(storageEvent);

      console.log('Dispatched balance update to all components:', payload.currency);
    } catch (error) {
      console.error('Error broadcasting balance update:', error);
    }
  };

  // Send a message to the server
  const sendMessage = (type: string, payload: any) => {
    if (socket && isConnected) {
      const message = JSON.stringify({ type, payload });
      socket.send(message);
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}