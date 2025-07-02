// List all users in memory storage for debugging
import { storage } from './server/storage.js';

async function listAllUsers() {
  try {
    console.log('Attempting to list all users from storage directly...');
    const users = await storage.getAllUsers();
    
    console.log(`Found ${users.length} users in database:`);
    
    // Print each user with important attributes
    users.forEach((user, index) => {
      console.log(`\nUser #${index + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Balance: ${user.balance} ${user.currency}`);
      console.log(`  - Banned: ${user.isBanned}`);
      console.log(`  - Muted: ${user.isMuted}`);
      console.log(`  - Created: ${user.createdAt}`);
      // Don't log passwords even in debugging scripts
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
}

listAllUsers().catch(console.error);