import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  createdAt: string;
  isAdmin?: boolean;
  profilePicture?: string;
  profilePictureUrl?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Don't connect if no user is authenticated
    if (!user) {
      console.log("No user authenticated, skipping WebSocket connection");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log("Attempting to connect to WebSocket at:", wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
      
      // Send test message to verify connection
      ws.send(JSON.stringify({
        type: "chat",
        payload: {
          message: "Connected to chat"
        }
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "chat_message") {
          setMessages(prev => [...prev, data.payload]);
        } else if (data.type === "recent_messages") {
          setMessages(data.payload);
          setIsLoading(false);
        } else if (data.type === "user_muted") {
          toast({
            title: "You are muted",
            description: "An admin has muted you from chat",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    // Fetch chat messages via API as fallback
    async function fetchMessages() {
      try {
        const response = await fetch('/api/chat/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch chat messages');
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMessages();
    
    return () => {
      ws.close();
    };
  }, [user, toast]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected || !user) return;
    
    try {
      socket.send(JSON.stringify({
        type: "chat",
        payload: {
          message: newMessage.trim()
        }
      }));
      
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive"
      });
      console.error("Error sending message:", error);
    }
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <MessageSquare className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Chat Room</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[70vh] flex flex-col animate-fadeIn">
              <div className="bg-background-darker p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="font-semibold">Public Chat</h2>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-3" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'} animate-slideUp`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.userId === user?.id 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-background rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          <User className="h-3 w-3 mr-1" />
                          <span className={`text-xs font-semibold ${msg.userId === user?.id ? 'text-white' : 'text-primary'}`}>
                            {msg.username}
                          </span>
                          <span className="mx-1 text-xs">•</span>
                          <span className="text-xs flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!isConnected || user?.isMuted}
                    className="flex-1 bg-background border border-border rounded-l-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !newMessage.trim() || user?.isMuted}
                    className="bg-primary text-white rounded-r-md px-4 py-2 hover:bg-primary/90 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                {user?.isMuted && (
                  <div className="mt-2 text-xs text-red-500">
                    You are currently muted by an admin and cannot send messages
                  </div>
                )}
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-4 shadow-lg animate-fadeIn">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="h-4 w-4 mr-2 text-primary" />
                Chat Rules
              </h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Be respectful to other users</li>
                <li>• No spamming or flooding</li>
                <li>• No offensive language</li>
                <li>• No sharing personal information</li>
                <li>• No advertising or self-promotion</li>
              </ul>
            </div>
            
            <div className="bg-card rounded-lg p-4 shadow-lg mt-4 animate-fadeIn">
              <h3 className="font-semibold mb-3">Chat Commands</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-mono">/help</p>
                <p className="font-mono">/balance</p>
                <p className="font-mono">/roll</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}