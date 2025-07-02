import { createContext, ReactNode, useEffect, useState, useRef } from "react";

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  createdAt: string;
  isAdmin?: boolean;
  role?: string;
  profilePicture?: string;
  profilePictureUrl?: string;
}

interface GameResult {
  username: string;
  gameType: string;
  betAmount: string;
  currency: string;
  isWin: boolean;
  winAmount?: number;
  multiplier?: number;
  gameData?: any;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendChatMessage: (message: string) => void;
  isLoading: boolean;
  recentGameResults: GameResult[];
  setSocketMessenger: (messenger: (type: string, payload: any) => void, isConnected: boolean) => void;
  setCurrentUser: (user: any | null) => void;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentGameResults, setRecentGameResults] = useState<GameResult[]>([]);
  
  // Refs to store data from other contexts without dependencies
  const socketRef = useRef<{
    sendMessage: ((type: string, payload: any) => void) | null,
    connected: boolean
  }>({
    sendMessage: null,
    connected: false
  });
  
  const userRef = useRef<any>(null);
  
  const setSocketMessenger = (messenger: (type: string, payload: any) => void, isConnected: boolean) => {
    socketRef.current = {
      sendMessage: messenger,
      connected: isConnected
    };
  };
  
  const setCurrentUser = (user: any | null) => {
    userRef.current = user;
  };

  useEffect(() => {
    // Register a global socket message handler
    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'chat_history':
            setMessages(data.payload);
            setIsLoading(false);
            break;
          
          case 'chat_message':
            setMessages(prev => [...prev, data.payload]);
            break;
          
          case 'user_joined':
            // Could add a system message here
            break;
          
          case 'game_result':
            setRecentGameResults(prev => {
              // Keep only the last 10 results
              const newResults = [data.payload, ...prev];
              if (newResults.length > 10) {
                return newResults.slice(0, 10);
              }
              return newResults;
            });
            break;
          
          case 'user_muted':
            if (userRef.current && data.payload.userId === userRef.current.id) {
              // Show notification that user was muted
            }
            break;
          
          default:
            break;
        }
      } catch (error) {
        console.error('Error handling socket message:', error);
      }
    };

    // Listen for WebSocket messages at the window level
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'websocket_message') {
        handleSocketMessage(event.data.payload);
      }
    });

    return () => {
      window.removeEventListener('message', handleSocketMessage);
    };
  }, []);

  const sendChatMessage = (message: string) => {
    if (!socketRef.current.connected || !userRef.current || !message.trim() || !socketRef.current.sendMessage) {
      return;
    }
    
    socketRef.current.sendMessage('chat', { message: message.trim() });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendChatMessage,
        isLoading,
        recentGameResults,
        setSocketMessenger,
        setCurrentUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
