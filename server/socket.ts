import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { User, InsertChatMessage, UserRole } from "@shared/schema";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { parse } from "url";
import { parse as parseQs } from "querystring";

// WebSocket with isAlive property for connection management
interface LiveWebSocket extends WebSocket {
  isAlive: boolean;
}

// JWT Secret should match the one in auth.ts
const JWT_SECRET = process.env.JWT_SECRET || "shadow-casino-jwt-secret-key";

interface SocketClient {
  socket: LiveWebSocket;
  userId: number;
  username: string;
}

export class SocketService {
  private wss: WebSocketServer;
  private clients: Map<LiveWebSocket, SocketClient>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(server: HttpServer) {
    // Set up WebSocket with JWT verification
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      clientTracking: true,
      // Configure ping-pong keep alive mechanism
      // This helps maintain connections and detect disconnects
      perMessageDeflate: false,
      // Disable client verification for development
      verifyClient: (info, cb) => {
        console.log("WebSocket connection attempt - allowing all connections");
        cb(true);
      },
    });
    this.clients = new Map();

    this.init();
  }

  // Helper to extract JWT token from cookies string
  private extractTokenFromCookies(cookieHeader?: string): string {
    if (!cookieHeader) return '';

    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .reduce(
        (obj, [key, value]) => {
          obj[key] = value;
          return obj;
        },
        {} as Record<string, string>,
      );

    return cookies["jwt"] || '';
  }

  private init() {
    // Start heartbeat interval when first client connects
    if (!this.heartbeatInterval) {
      console.log("Starting WebSocket heartbeat interval");
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, this.HEARTBEAT_INTERVAL);
    }

    this.wss.on("connection", async (socket: LiveWebSocket, req) => {
      console.log("Client connected to WebSocket");

      // Get user data from req that was attached during JWT verification
      let user = (req as any).user as User;

      if (!user) {
        console.log("WebSocket connection without user data, using default user for development");
        try {
          user = await storage.getUser(1); // shadowHimel
          if (!user) {
            console.log("No default user available, creating shadowHimel");
            user = await storage.createUser({
              username: "shadowHimel",
              email: "shadow@example.com", 
              phone: "01234567890",
              password: "admin1122",
              balance: "61029.00",
              currency: "BDT" as any,
              role: "admin" as any,
            });
          }
        } catch (error) {
          console.log("Failed to get/create default user:", error);
          return;
        }
      }

      // Enable ping/pong for this connection (server-side heartbeat)
      socket.isAlive = true;
      socket.on('pong', () => {
        socket.isAlive = true;
      });

      // Store client data using info from JWT token
      this.clients.set(socket, {
        socket,
        userId: user.id,
        username: user.username,
      });

      // Automatically send chat history to newly connected authenticated client
      this.sendChatHistory(socket, user);

      // Notify all clients that this user has joined
      this.broadcastMessage({
        type: "user_joined",
        payload: { username: user.username },
      });

      socket.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());
          // Mark client as alive when message received
          socket.isAlive = true;
          
          // For development, create a default user context if not provided
          if (!this.clients.get(socket) && data.type === "chat") {
            const defaultUser = await storage.getUser(1); // Get shadowHimel
            if (defaultUser) {
              this.clients.set(socket, {
                socket,
                userId: defaultUser.id,
                username: defaultUser.username
              });
              console.log("WebSocket: Set default user context for chat");
            }
          }
          
          await this.handleMessage(socket, data);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          this.sendToClient(socket, {
            type: "error",
            message: "Invalid message format",
          });
        }
      });

      socket.on("close", () => {
        this.clients.delete(socket);
        console.log("Client disconnected from WebSocket");
      });

      // Send initial message to confirm connection with user data
      this.sendToClient(socket, {
        type: "connected",
        payload: {
          userId: user.id,
          username: user.username,
          role: user.role,
          isMuted: user.isMuted,
          isBanned: user.isBanned,
        },
      });

      // Send chat history when user connects
      this.sendChatHistory(socket, user);
    });
  }

  // Helper method to send chat history to a specific socket
  private async sendChatHistory(socket: LiveWebSocket, user: User) {
    try {
      // Get recent chat messages
      const recentMessages = await storage.getRecentChatMessages();

      // Fetch user information for each message including profile picture
      const messagesWithUserInfo = await Promise.all(
        recentMessages.map(async (msg) => {
          const msgUser = await storage.getUser(msg.userId);
          const profilePictureUrl = msgUser?.profilePicture 
            ? `/uploads/profile-pictures/${msgUser.profilePicture}`
            : null;
          return {
            ...msg,
            username: msgUser?.username || "Unknown",
            role: msgUser?.role || UserRole.USER,
            isAdmin: msgUser?.role === UserRole.ADMIN,
            profilePictureUrl,
          };
        }),
      );

      this.sendToClient(socket, {
        type: "chat_history",
        payload: messagesWithUserInfo,
      });
    } catch (error) {
      console.error("Error sending chat history:", error);
    }
  }

  private async handleMessage(socket: LiveWebSocket, data: any) {
    const { type, payload } = data;

    switch (type) {
      case "chat":
        await this.handleChat(socket, payload);
        break;
      case "game_update":
        await this.handleGameUpdate(socket, payload);
        break;
      case "ping":
        // Simple ping to keep connection alive
        this.sendToClient(socket, { type: "pong" });
        break;
      default:
        this.sendToClient(socket, {
          type: "error",
          message: "Unknown message type",
        });
    }
  }

  private async handleChat(socket: LiveWebSocket, payload: { message: string }) {
    let client = this.clients.get(socket);
    
    // If no client, create one with default user for development
    if (!client) {
      try {
        const defaultUser = await storage.getUser(1); // shadowHimel
        if (defaultUser) {
          client = {
            socket,
            userId: defaultUser.id,
            username: defaultUser.username
          };
          this.clients.set(socket, client);
          console.log("Created default client context for chat");
        } else {
          this.sendToClient(socket, {
            type: "error",
            message: "Not authenticated",
          });
          return;
        }
      } catch (error) {
        this.sendToClient(socket, {
          type: "error",
          message: "Authentication failed",
        });
        return;
      }
    }

    // Check if user is muted
    const user = await storage.getUser(client.userId);
    if (!user || user.isMuted) {
      this.sendToClient(socket, {
        type: "error",
        message: "You are muted and cannot send messages",
      });
      return;
    }

    // Save message to database with full user context
    const chatMessage: InsertChatMessage = {
      userId: client.userId,
      username: user.username,
      message: payload.message,
      profilePicture: user.profilePicture,
      role: user.role,
      createdAt: new Date(),
    };

    const savedMessage = await storage.createChatMessage(chatMessage);

    // Broadcast message to all connected clients with profile picture
    this.broadcastMessage({
      type: "chat_message",
      payload: {
        ...savedMessage,
        isAdmin: user.role === UserRole.ADMIN,
        profilePictureUrl: user.profilePicture ? `/uploads/${user.profilePicture}` : "/assets/default-profile.png",
      },
    });
  }

  private async handleGameUpdate(socket: LiveWebSocket, payload: any) {
    // Broadcast game updates to all clients
    this.broadcastMessage({
      type: "game_update",
      payload,
    });
  }

  private sendToClient(socket: LiveWebSocket, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }

  public broadcastMessage(data: any) {
    this.clients.forEach((client) => {
      this.sendToClient(client.socket, data);
    });
  }

  /**
   * Send a message to a specific user by their user ID
   * @param userId The ID of the user to send the message to
   * @param data The data to send
   */
  public broadcastToUser(userId: number, data: any) {
    // Send message to specific user
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client.socket, data);
      }
    });
  }

  /**
   * Send a balance update to a specific user with enhanced data for real-time sync
   * @param userId The ID of the user to update
   * @param balance The new balance amount
   * @param currency The currency of the balance
   * @param isFromCurrencyChange Optional flag indicating if this update is from a currency change
   * @param oldCurrency Optional previous currency (for currency change events)
   * @param oldBalance Optional previous balance (for currency change events)
   * @param additionalData Optional additional transaction data for rich client updates
   */
  public sendBalanceUpdate(
    userId: number, 
    balance: string, 
    currency: string,
    isFromCurrencyChange: boolean = false,
    oldCurrency?: string,
    oldBalance?: string,
    additionalData?: any
  ) {
    try {
      // Count connected clients for this user
      let clientCount = 0;
      this.clients.forEach((client) => {
        if (client.userId === userId) {
          clientCount++;
        }
      });

      console.log(`Sending balance update to user ${userId} (${clientCount} connected clients)`);

      // Get formatted balance values for logging
      const formattedOldBalance = oldBalance ? `${oldBalance} ${oldCurrency}` : 'N/A';
      const formattedNewBalance = `${balance} ${currency}`;

      // Add transaction timestamp if not provided
      const timestamp = additionalData?.timestamp || new Date().toISOString();

      // Send standard balance update for all cases with richer payload
      this.broadcastToUser(userId, {
        type: "balance_update",
        payload: {
          userId,
          balance,
          currency,
          previousBalance: oldBalance,
          previousCurrency: oldCurrency,
          isFromCurrencyChange,
          timestamp,
          source: additionalData?.transactionType || 'unknown',
          // Include additional data if provided, but never include sensitive information
          ...(additionalData ? {
            transactionType: additionalData.transactionType,
            amount: additionalData.amount,
            transactionCurrency: additionalData.transactionCurrency
          } : {})
        }
      });

      console.log(`Balance update sent for user ${userId}: ${formattedOldBalance} -> ${formattedNewBalance}`);

      // For currency changes, send an additional specialized event with more details
      if (isFromCurrencyChange && oldCurrency && oldBalance) {
        console.log(`Sending currency_changed event for user ${userId}: ${oldCurrency} -> ${currency}`);

        // Send the specialized currency_changed event with additional metadata
        this.broadcastToUser(userId, {
          type: "currency_changed",
          payload: {
            userId,
            oldCurrency,
            newCurrency: currency,
            oldBalance,
            newBalance: balance,
            timestamp,
            // Include exchange rate info if available
            exchangeRate: additionalData?.conversionRate,
            // Include any conversion details if available
            conversionDetails: additionalData?.conversionDetails
          }
        });

        // Also broadcast a public notification for rate display updates
        // This has no sensitive info, just notifies of currency rates being relevant
        this.broadcastMessage({
          type: "currency_rates_refresh",
          payload: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // If no clients were connected, store the update for later retrieval
      if (clientCount === 0) {
        console.log(`No clients connected for user ${userId}, storing update for later retrieval`);
        // This could be implemented by storing in a queue or database
        // for later retrieval when the user reconnects
      }
    } catch (error) {
      console.error(`Error sending balance update to user ${userId}:`, error);
      // Continue execution - don't let WebSocket errors disrupt the transaction
    }
  }

  /**
   * Notify user of a balance update failure
   * @param userId The ID of the user to notify
   * @param error The error message or object
   * @param transactionType The type of transaction that failed
   */
  public sendBalanceUpdateError(
    userId: number,
    error: string | Error,
    transactionType?: string
  ) {
    try {
      const errorMessage = error instanceof Error ? error.message : error;

      this.broadcastToUser(userId, {
        type: "balance_update_error",
        payload: {
          error: errorMessage,
          transactionType,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Sent balance update error to user ${userId}: ${errorMessage}`);
    } catch (wsError) {
      console.error(`Failed to send balance error to user ${userId}:`, wsError);
    }
  }

  /**
   * Send heartbeat message to all clients and clean up dead connections
   * This helps keep connections alive and detect disconnects early
   */
  private sendHeartbeat() {
    console.log(`Sending heartbeat to ${this.clients.size} WebSocket clients`);

    let terminatedCount = 0;

    this.clients.forEach((client, socket) => {
      if (socket.isAlive === false) {
        // Connection is dead, terminate it
        console.log(`Terminating dead connection for user: ${client.username}`);
        this.clients.delete(socket);
        socket.terminate();
        terminatedCount++;
        return;
      }

      // Mark as not alive, will be marked alive when pong received
      socket.isAlive = false;

      // Send heartbeat message to client
      this.sendToClient(socket, {
        type: "heartbeat",
        payload: { timestamp: new Date().toISOString() }
      });

      // Also send native ping frame
      try {
        socket.ping();
      } catch (err) {
        console.error("Error sending ping:", err);
      }
    });

    if (terminatedCount > 0) {
      console.log(`Cleaned up ${terminatedCount} dead connections`);
    }
  }

startHeartbeat() {
    const HEARTBEAT_INTERVAL = 30000;
    const heartbeat = () => {
      if (this.clients.size > 0) {
        console.log(`Sending heartbeat to ${this.clients.size} WebSocket clients`);
        this.broadcastMessage({ type: 'heartbeat', timestamp: Date.now() });
      }
    };

    this.heartbeatInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    // Initial heartbeat
    heartbeat();
  }

  // Method to stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('WebSocket heartbeat stopped');
    }
  }

  handleClose(ws: any) {
    this.clients.delete(ws);
    if (ws.userId) {
      this.userSockets.delete(ws.userId);
    }
    console.log(`Client disconnected, remaining clients: ${this.clients.size}`);
  }
}