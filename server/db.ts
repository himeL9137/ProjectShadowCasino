import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// DATABASE DISABLED: Database connection commented out for in-memory storage mode
// Keeping this file available for when database is re-enabled

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - using in-memory storage instead");
  // Create a dummy pool and db for compatibility
  export const pool = null;
  export const db = null;
} else {
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
}