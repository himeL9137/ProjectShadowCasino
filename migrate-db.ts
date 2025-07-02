import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Running migrations...');
  // This will create all tables that are defined in your schema but don't exist in the database
  await db.execute(/*sql*/`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      balance NUMERIC NOT NULL DEFAULT '0',
      currency TEXT NOT NULL DEFAULT 'USD',
      role TEXT NOT NULL DEFAULT 'user',
      is_muted BOOLEAN NOT NULL DEFAULT false,
      is_banned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      last_login TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount NUMERIC NOT NULL,
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      game_type TEXT NOT NULL,
      bet_amount NUMERIC NOT NULL,
      win_amount NUMERIC,
      multiplier REAL,
      is_win BOOLEAN NOT NULL,
      currency TEXT NOT NULL,
      game_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES users(id),
      action_type TEXT NOT NULL,
      target_user_id INTEGER REFERENCES users(id),
      details JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS advertisements (
      id SERIAL PRIMARY KEY,
      script TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by INTEGER NOT NULL REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS game_settings (
      id SERIAL PRIMARY KEY,
      game_type TEXT NOT NULL UNIQUE,
      win_chance REAL NOT NULL DEFAULT 10,
      max_multiplier REAL NOT NULL DEFAULT 1.1,
      last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  console.log('✅ Database tables created');

  // Check if we have any admin users
  const result = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.role, 'admin')
  });

  if (!result) {
    console.log('Creating admin user...');
    // Create admin user
    await db.execute(/*sql*/`
      INSERT INTO users (username, email, phone, password, balance, role)
      VALUES ('admin', 'admin@example.com', '1234567890', 'admin1122', '10000', 'admin');
    `);
    console.log('✅ Admin user created');
  } else {
    console.log('Admin user already exists, skipping creation');
  }

  // Close the connection
  await pool.end();
  
  console.log('✅ Migration completed successfully');
}

main().catch((err) => {
  console.error('Error during migration:', err);
  process.exit(1);
});