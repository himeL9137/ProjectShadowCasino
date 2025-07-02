import { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  sendMessage: (type: string, payload: any) => void;
  connected: boolean;
  connect: (userId: number, username: string) => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const userInfoRef = useRef<{userId?: number, username?: string}>({});

  // Helper function to get a cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  
  // Reconnection logic with backoff
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  const reconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(`Max reconnection attempts (${maxReconnectAttempts}) reached`);
      return;
    }
    
    const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    console.log(`Scheduling reconnect attempt in ${timeout}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      connectSocket();
    }, timeout);
  };
  
  const connectSocket = () => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Create WebSocket connection with JWT token
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Get JWT token from cookie
    const token = getCookie('jwt');
    const wsUrl = `${protocol}//${window.location.host}/ws${token ? `?token=${token}` : ''}`;
    
    try {
      console.log("Attempting to connect to WebSocket at:", wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        
        // If we have user info, send authentication message
        if (userInfoRef.current.userId && userInfoRef.current.username) {
          sendMessage("auth", {
            userId: userInfoRef.current.userId,
            username: userInfoRef.current.username
          });
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setConnected(false);
        
        // Reset reconnect attempts if this was a normal closure
        if (event.code === 1000) {
          reconnectAttemptsRef.current = 0;
        } else {
          // Try to reconnect on abnormal closure
          reconnect();
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
        
        // Only show toast on first error to prevent spamming
        if (reconnectAttemptsRef.current === 0) {
          toast({
            title: "Connection Error",
            description: "Failed to connect to game server. Retrying...",
            variant: "destructive",
          });
        }
        
        // Start reconnection process
        reconnect();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const connect = (userId: number, username: string) => {
    userInfoRef.current = { userId, username };
    
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    connectSocket();
  };
  
  // Connect to WebSocket when the component mounts, but only if we have a token
  useEffect(() => {
    // Only try to connect if we have a token
    const token = getCookie('jwt');
    if (token) {
      console.log("Found JWT token, attempting to connect to WebSocket");
      connectSocket();
    } else {
      console.log("No JWT token found, skipping WebSocket connection until user logs in");
    }
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendMessage = (type: string, payload: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type,
        payload,
      })
    );
  };

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        connected,
        connect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
