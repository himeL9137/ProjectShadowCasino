import { Express, NextFunction, Request, Response } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User, UserRole, Currency } from "@shared/schema";
import { userActivityTracker } from "./user-activity-tracker";

// Extend the Express Request type to include our user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Use JWT auth as specified in the project requirements
const JWT_SECRET = process.env.JWT_SECRET || "shadow-casino-jwt-secret-key";
const JWT_EXPIRES_IN = "30d"; // JWT token expiration increased to 30 days for better persistence

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if stored password has the correct format
    if (!stored || !stored.includes(".")) {
      console.error("Invalid password format in stored password");
      return false;
    }

    const [hashed, salt] = stored.split(".");

    // Verify that both parts exist
    if (!hashed || !salt) {
      console.error("Missing hash or salt component");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    // Ensure both buffers have the same length before comparing
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error(
        `Buffer length mismatch: ${hashedBuf.length} vs ${suppliedBuf.length}`,
      );
      return false;
    }

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
}

// Generate JWT token for user with device/IP tracking
function generateToken(user: User, req?: Request) {
  // Remove sensitive fields
  const { password, ...userWithoutPassword } = user;

  // Add device and IP information for session tracking
  const tokenPayload = {
    ...userWithoutPassword,
    deviceIP: req ? getClientIP(req) : undefined,
    userAgent: req ? req.headers['user-agent'] : undefined,
    issuedAt: Date.now(),
    sessionId: randomBytes(16).toString('hex')
  };

  // Create JWT token with explicit expiration
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '30d' // 30 days expiration
  });
}

// JWT Authentication middleware with improved token extraction
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(`Authenticating request to: ${req.path}`);
  console.log(`Auth header present: ${!!req.headers.authorization}`);
  console.log(`Cookies present: ${!!req.cookies}`);
  console.log(`JWT cookie present: ${!!req.cookies?.jwt}`);

  // Get token from various sources with enhanced debugging
  const authHeader = req.headers.authorization;
  if (authHeader) {
    console.log(`Auth header format: ${authHeader.substring(0, 10)}...`);
  }

  // Try to get token from multiple sources
  let token = null;

  // 1. Try JWT cookie first
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
    console.log("Found token in jwt cookie");
  } 
  // 2. Try Authorization header with Bearer scheme
  else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(" ")[1];
    console.log("Found token in Authorization header with Bearer scheme");

    // ENHANCEMENT: Also set the cookie to help with persistence
    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/',
    });
  } 
  // 3. Try custom auth header (some clients use this)
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'] as string;
    console.log("Found token in x-auth-token header");

    // ENHANCEMENT: Also set the cookie to help with persistence
    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/',
    });
  }
  // 4. As a fallback, try Authorization header directly (some clients don't use Bearer)
  else if (authHeader && !authHeader.includes(' ')) {
    token = authHeader;
    console.log("Found token in Authorization header (raw)");

    // ENHANCEMENT: Also set the cookie to help with persistence
    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/',
    });
  }

  if (!token) {
    console.log("No JWT token found in any location");
    return res.status(401).json({ message: "Authentication required" });
  }

  console.log(`Token found (first 10 chars): ${token.substring(0, 10)}...`);

  try {
    console.log(`Attempting to verify JWT token with secret length: ${JWT_SECRET.length}`);
    console.log(`Token format check - starts with eyJ: ${token.startsWith('eyJ')}`);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log(`JWT decoded successfully for user: ${decoded.username}`);
    
    // Enhanced security: Check if device/IP matches for session validation
    const currentIP = getClientIP(req);
    const currentUserAgent = req.headers['user-agent'];
    
    // For development, be more lenient with IP validation to ensure persistent login works
    console.log(`Token validation for ${decoded.username}: stored IP ${decoded.deviceIP}, current IP ${currentIP}`);
    
    // In development mode, allow all sessions (for better user experience)
    // In production, you can enable stricter IP checking
    const isDevelopment = process.env.NODE_ENV === 'development';
    let ipMatches = true;
    
    if (!isDevelopment && decoded.deviceIP) {
      ipMatches = decoded.deviceIP === currentIP;
      if (!ipMatches) {
        console.log(`IP validation failed for user ${decoded.username}: stored ${decoded.deviceIP}, current ${currentIP}`);
        res.clearCookie("jwt", { path: '/' });
        return res.status(403).json({ message: "Session expired due to IP change. Please login again." });
      }
    }
    
    console.log(`Token validation successful for user ${decoded.username}`);
    
    // Check if user is banned or kicked - ensure ID is string for database lookup
    const currentUser = await storage.getUser(String(decoded.id));
    if (!currentUser) {
      console.log(`User ${decoded.username} not found in database (ID: ${decoded.id})`);
      res.clearCookie("jwt", { path: '/' });
      return res.status(401).json({ message: "User account not found" });
    }
    
    if (currentUser.isBanned) {
      console.log(`Banned user ${decoded.username} attempted to access the platform`);
      res.clearCookie("jwt", { path: '/' });
      return res.status(403).json({ 
        message: "Your account has been banned. Please contact support for assistance.",
        banned: true 
      });
    }
    
    if (currentUser.isMuted) {
      console.log(`Kicked user ${decoded.username} attempted to access the platform`);
      res.clearCookie("jwt", { path: '/' });
      return res.status(403).json({ 
        message: "Your account has been temporarily suspended. Please contact support for assistance.",
        kicked: true 
      });
    }
    
    req.user = decoded;
    console.log("JWT token verified for user:", decoded.username, "with role:", decoded.role);

    // Update user session tracking with enhanced activity monitoring
    try {
      const userId = String(decoded.id); // Convert to string for consistency
      await storage.updateUserLastSeen(userId);
      await storage.updateUserOnlineStatus(userId, true);
      
      // Also update the activity tracker for accurate admin panel display
      const { userActivityTracker } = await import('./user-activity-tracker');
      await userActivityTracker.markUserActive(userId, decoded.username, currentIP);
      
      console.log(`User ${decoded.username} activity tracked (IP: ${currentIP})`);
    } catch (error) {
      console.error("Failed to update user session tracking:", error);
    }

    // Refresh the cookie to extend session on each request
    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/',
      domain: undefined // Let browser handle domain automatically
    });

    next();
  } catch (error) {
    console.error("JWT verification failed:", {
      error: (error as Error).message || error,
      tokenLength: token?.length || 'no token',
      tokenStart: token?.substring(0, 20) || 'no token',
      secretLength: JWT_SECRET.length
    });
    
    // Clear any invalid cookies
    res.clearCookie("jwt", {
      path: '/',
    });
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Helper function to get client IP address
function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  ).split(',')[0].trim();
}



export function setupAuth(app: Express) {
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate that email and phone are provided as required in the project spec
      if (!req.body.email || !req.body.phone) {
        return res
          .status(400)
          .json({ message: "Email and phone number are required" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Get client IP
      const clientIP = getClientIP(req);

      // Create new user
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        rawPassword: req.body.password, // Store raw password for admin panel
        ipAddress: clientIP,
      });

      // Generate JWT token with extended expiration
      const token = generateToken(user);

      // Set token as cookie with client-accessible settings and extended expiration
      res.cookie("jwt", token, {
        httpOnly: false, // Allow JavaScript access for client-side usage
        secure: false, // Allow non-HTTPS in development environment
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        sameSite: 'lax', // More permissive for cross-site requests
        path: '/', // Ensure cookie is available for all paths
      });

      console.log("JWT token set in cookie:", token.substring(0, 15) + "...");

      console.log("User registered successfully:", user.username);

      // Return user info and token
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, savePassword = false } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }
      
      const clientIP = getClientIP(req);
      console.log("Login attempt for user:", username, "from IP:", clientIP);

      // Admin password shortcuts for convenience
      const adminShortcuts: Record<string, string> = {
        'shadowHimel': 'admin1122',
        'shadowTalha': 'talha1122',
        'shadowKaran': 'karan1122'
      };

      // Check if this is an admin using a shortcut password
      const isAdminShortcut = adminShortcuts[username] === password;

      // Try to get user from storage if not using hardcoded admin
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log("Login failed: User not found");
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }

        console.log(`User found: ${user.username} (ID: ${user.id}, Role: ${user.role})`);

        // Check if user is banned
        if (user.isBanned) {
          console.log("Login failed: User is banned");
          return res
            .status(403)
            .json({ message: "Your account has been banned" });
        }

        // Special case for admin accounts per project specification
        const isAdminUser = username === "shadowHimel" || username === "shadowTalha" || username === "shadowKaran" || username === "Albab AJ" || username === "Aj Albab" || username === "shadowHimel2";
        let isPasswordValid = false;

        if (isAdminShortcut && user.role === UserRole.ADMIN) {
          // Admin using shortcut password
          console.log("Admin authentication with shortcut password");
          isPasswordValid = true;
        } else if (isAdminUser && password === "admin1122") {
          // Legacy admin password support
          console.log("Admin authentication with legacy password");
          isPasswordValid = true;
          
          if (user.role !== UserRole.ADMIN) {
            try {
              // Update role to admin
              await storage.updateUserRole(user.id, UserRole.ADMIN);
              // Get updated user
              const updatedUser = await storage.getUser(user.id);
              if (updatedUser) {
                console.log(`Successfully updated ${username} to admin role`);
                // Use updated user for the rest of the flow
                Object.assign(user, updatedUser);
              }
            } catch (err) {
              console.error(`Error updating admin role for ${username}:`, err);
            }
          }
        } else {
          // For regular users, use the normal password comparison function
          console.log("Regular user authentication path");
          console.log(`Stored password format: ${user.password.substring(0, 10)}...`);
          isPasswordValid = await comparePasswords(password, user.password);
        }

        if (!isPasswordValid) {
          console.log("Login failed: Invalid password");
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }

        // Update user's IP address, last login, and online status with enhanced tracking
        try {
          await storage.updateUserLogin(user.id, clientIP);
          await storage.updateUserOnlineStatus(user.id, true);
          await storage.updateUserLastSeen(user.id);
          
          // Use enhanced activity tracker for proper status management
          await userActivityTracker.markUserActive(user.id, user.username, clientIP);
          console.log(`User ${user.username} marked as ACTIVE during login with enhanced tracking`);
        } catch (updateError) {
          console.error("Error updating user login info:", updateError);
        }

        // Generate token with extended expiration
        const token = generateToken(user);

        // Set token as cookie with client-accessible settings and extended expiration
        res.cookie("jwt", token, {
          httpOnly: false, // Allow JavaScript access for client-side usage
          secure: false, // Allow non-HTTPS in development environment
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
          sameSite: 'lax', // More permissive for cross-site requests
          path: '/', // Ensure cookie is available for all paths
        });

        console.log("JWT token set in cookie:", token.substring(0, 15) + "...");
        console.log("Login successful for user:", user.username, savePassword ? "with saved password" : "");

        // Return user info and token
        const { password: userPassword, ...userWithoutPassword } = user;
        res.status(200).json({
          user: userWithoutPassword,
          token,
        });
      } catch (dbError) {
        console.log("Database error during login, using fallback authentication");
        return res
          .status(401)
          .json({ message: "Invalid username or password. Try the admin:admin1122 account." });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/logout", authenticateJWT, async (req, res) => {
    try {
      // Mark user as offline before logout with enhanced tracking
      if (req.user?.id) {
        await storage.updateUserOnlineStatus(req.user.id, false);
        
        // Use enhanced activity tracker for proper status management
        await userActivityTracker.markUserInactive(req.user.id, 'logout');
        console.log(`User ${req.user.username} marked as INACTIVE (logout) with enhanced tracking`);
      }
    } catch (error) {
      console.error("Failed to update user online status during logout:", error);
    }

    // Clear the JWT cookie with same settings
    res.clearCookie("jwt", {
      path: '/',
      sameSite: 'lax',
    });
    console.log("User logged out successfully");
    res.status(200).json({ message: "Logout successful" });
  });

  app.get("/api/user", authenticateJWT, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    console.log("User authenticated:", req.user.username);
    res.json(req.user);
  });

  // ENHANCEMENT: Add a token refresh endpoint
  app.post("/api/refresh-token", authenticateJWT, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Generate a fresh token based on the current user data
    const token = generateToken(req.user);

    // Set the refreshed token as a cookie
    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/',
    });

    console.log("Token refreshed for user:", req.user.username);

    // Return the new token
    res.status(200).json({
      token,
      message: "Token refreshed successfully"
    });
  });
}

// Admin check middleware
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log("isAdmin middleware called for user:", req.user?.username);
  
  try {
    if (!req.user) {
      console.log("No user found in request, authentication required");
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log("User found:", req.user.username, "with role:", req.user.role);

    // Check if user role is admin
    if (req.user.role !== UserRole.ADMIN) {
      console.log("User is not admin, denying access");
      return res.status(403).json({ message: "Admin access required" });
    }

    // Additional check for specific admin users
    const authorizedAdmins = ["shadowHimel", "shadowTalha", "shadowKaran", "Albab AJ", "Aj Albab", "shadowHimel2", "admin"];
    if (!authorizedAdmins.includes(req.user.username)) {
      console.log("User is not in authorized admin list:", req.user.username);
      return res.status(403).json({ message: "Not an authorized admin" });
    }

    console.log("Admin access granted for user:", req.user.username);
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({ message: "Server error during authorization" });
  }
};