import { db } from './server/db';
import { users } from './shared/schema';
import { UserRole } from './shared/schema';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { eq } from 'drizzle-orm';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

async function createAdminUsers() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // 1. Check if shadowHimel exists and create or update
    console.log('Checking for existing user: shadowHimel');
    const existingHimel = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'shadowHimel')
    });

    if (existingHimel) {
      console.log('User shadowHimel already exists, updating to admin...');
      await db.update(users)
        .set({ 
          role: UserRole.ADMIN,
          password: 'admin1122', // Set the new password
          balance: '10000' // Give a good balance
        })
        .where(eq(users.id, existingHimel.id));
      console.log('User shadowHimel updated to admin role');
    } else {
      console.log('Creating admin user: shadowHimel');
      await db.insert(users).values({
        username: 'shadowHimel',
        email: 'shadowHimel@example.com',
        phone: '01234567890',
        password: 'admin1122',
        balance: '10000',
        role: UserRole.ADMIN
      });
      console.log('Admin user shadowHimel created');
    }

    // 2. Check if Aj Albab exists and create or update
    console.log('Checking for existing user: Aj Albab');
    const existingAlbab = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'Aj Albab')
    });

    if (existingAlbab) {
      console.log('User Aj Albab already exists, updating to admin...');
      await db.update(users)
        .set({ 
          role: UserRole.ADMIN,
          password: 'admin1122', // Set the new password
          balance: '10000' // Give a good balance
        })
        .where(eq(users.id, existingAlbab.id));
      console.log('User Aj Albab updated to admin role');
    } else {
      console.log('Creating admin user: Aj Albab');
      await db.insert(users).values({
        username: 'Aj Albab',
        email: 'ajalbab@example.com',
        phone: '09876543210',
        password: 'admin1122',
        balance: '10000',
        role: UserRole.ADMIN
      });
      console.log('Admin user Aj Albab created');
    }

    console.log('✅ Admin users created or updated successfully');
  } catch (error) {
    console.error('Error creating admin users:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

createAdminUsers().catch(console.error);