import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInitials, timeAgo, getUserAvatarColor } from "@/lib/utils";
import { Send, Settings } from "lucide-react";

export function ChatSidebar() {
  const { user } = useAuth();
  const { messages, sendChatMessage, isLoading } = useChat();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendChatMessage(message);
    setMessage("");
  };
  
  return (
    <aside className="hidden lg:block w-80 bg-background-light border-l border-gray-800 overflow-y-auto scrollbar-hide">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="font-bold font-heading text-white">Live Chat</h2>
        <button className="text-gray-400 hover:text-white">
          <Settings className="h-5 w-5" />
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="p-4 space-y-4 h-[calc(100vh-180px)] overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-2">
              <Avatar className={`w-8 h-8 ${getUserAvatarColor(msg.username)}`}>
                <AvatarImage 
                  src={msg.profilePicture ? `/uploads/${msg.profilePicture}` : (msg.profilePictureUrl || '/assets/default-profile.png')}
                  alt={`${msg.username}'s profile`}
                  className="object-cover"
                  onError={(e) => {
                    console.log('Profile picture failed to load for:', msg.username);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <AvatarFallback className="text-white">{getInitials(msg.username)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <span className={`font-medium ${msg.isAdmin ? 'text-accent-gold' : 'text-white'}`}>
                    {msg.username}
                  </span>
                  {msg.isAdmin && (
                    <span className="text-xs bg-primary px-1 rounded text-white">ADMIN</span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</span>
                </div>
                <p className="text-gray-300 text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-background-darker border-gray-800 text-white"
            disabled={!user || user.isMuted}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || !user || user.isMuted}
            className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        {user?.isMuted && (
          <p className="text-destructive text-xs mt-2">You are muted and cannot send messages</p>
        )}
      </div>
    </aside>
  );
}
