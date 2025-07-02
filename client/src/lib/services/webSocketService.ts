
import { updateBalance, setCurrency } from '../store/slices/walletSlice';
import { toast } from 'react-toastify';

// This service handles WebSocket events for real-time updates
export const webSocketService = {
  // Initialize WebSocket connection
  initWebSocket: (dispatch) => {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      
      console.log('Initializing WebSocket connection to:', wsUrl);
      const socket = new WebSocket(wsUrl);
      
      // Connection opened
      socket.addEventListener('open', (event) => {
        console.log('WebSocket connection established');
      });
      
      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle balance updates
          if (data.type === 'balance_update') {
            dispatch(updateBalance(data.balance));
            dispatch(setCurrency(data.currency));
            
            // Show notification if it's a significant change
            if (data.showNotification) {
              if (data.isWin) {
                toast.success(`Balance updated: +${data.changeAmount} ${data.currency}`);
              } else if (data.isBet) {
                toast.info(`Bet placed: -${data.changeAmount} ${data.currency}`);
              }
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          webSocketService.initWebSocket(dispatch);
        }, 5000);
      });
      
      // Handle errors
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      return socket;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      return null;
    }
  },
  
  // Close WebSocket connection
  closeWebSocket: (socket) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }
};

import { store } from '../store';
import { updateBalance, setError } from '../store/slices/walletSlice';
import { getCookie } from '../cookie-utils';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get JWT token from cookie for authentication
      const token = getCookie('jwt');
      if (!token) {
        console.log('No user authenticated, skipping WebSocket connection until user logs in');
        this.isConnecting = false;
        return;
      }

      console.log('Setting up WebSocket connection...');
      
      // Create WebSocket URL with JWT token for authentication
      const host = window.location.hostname;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Special handling for Replit domains
      const isReplit = host.includes('.replit.dev') || host.includes('.repl.co');
      let wsHost = host;
      
      if (isReplit) {
        // For Replit, we need to modify the host to work with WebSockets
        console.log('Found token in jwt cookie for WebSocket');
        console.log('WebSocket will use token (first 10 chars): ' + token.substring(0, 10) + '...');
        
        // Remove the container prefix for Replit domains
        const parts = host.split('-');
        if (parts.length > 1) {
          // Keep the Replit ID part only (removes container ID)
          const replitId = parts.slice(0, -1).join('-');
          wsHost = replitId + '.replit.dev';
          console.log('Using modified Replit host for WebSocket:', wsHost);
        }
      }
      
      const wsUrl = `${protocol}//${wsHost}/ws`;
      console.log('WebSocket URL:', wsUrl);
      
      // Create WebSocket connection with token query parameter
      console.log('Creating WebSocket with token');
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'BALANCE_UPDATE':
          console.log('Received balance update via WebSocket:', message.payload);
          store.dispatch(updateBalance(message.payload.balance));
          break;
        case 'HEARTBEAT':
          // Send heartbeat response to keep connection alive
          this.send({ type: 'HEARTBEAT_RESPONSE', payload: {} });
          break;
        case 'game_result':
          console.log('Game result received via WebSocket:', message.payload);
          // Force a balance refresh when we get a game result
          store.dispatch(setError(null)); // Clear any existing errors
          
          // Force fetch balance from server to ensure it's up to date regardless of auth state
          import('../store/thunks/walletThunks').then(({ fetchBalance }) => {
            store.dispatch(fetchBalance());
          });
          break;
        default:
          console.log('WebSocket message received:', message);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    store.dispatch(setError('WebSocket connection error. Real-time updates may be unavailable.'));
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    // Exponential backoff for reconnection attempts
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
}

// Export a singleton instance
export const webSocketService = WebSocketService.getInstance();