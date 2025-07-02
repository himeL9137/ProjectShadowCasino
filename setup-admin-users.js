// Script to properly set up admin users with correct roles and passwords
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const updateUserToAdmin = async (username, password) => {
  try {
    console.log(`Setting up admin user: ${username}`);
    
    // Get access to storage directly
    const { storage } = await import('./server/storage.js');
    
    // Find the user
    let user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log(`User ${username} not found, creating new admin user...`);
      // Create the user if it doesn't exist
      user = await storage.createUser({
        username,
        email: `${username.toLowerCase()}@admin.com`,
        phone: '1234567890',
        password,
        role: 'admin'
      });
      console.log(`Created new admin user: ${username} (ID: ${user.id})`);
    } else {
      console.log(`User ${username} found with ID ${user.id}, updating to admin...`);
      
      // Update the role to admin and set the raw password
      const userId = user.id;
      
      // Update directly in storage
      // For in-memory storage, find user in the map and update
      if (storage.users && typeof storage.users.get === 'function') {
        const existingUser = storage.users.get(userId);
        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            role: 'admin',
            password  // Set raw password
          };
          storage.users.set(userId, updatedUser);
          console.log(`Updated ${username} to admin with raw password`);
        } else {
          console.log(`User ${username} with ID ${userId} not found in storage map`);
        }
      } else {
        console.log('Cannot find users map in storage, using alternative method');
        // For other storage implementations, try through the interface
        try {
          const updatedUser = await storage.updateUserRole(userId, 'admin');
          console.log(`Updated ${username} to admin role via interface`);
        } catch (error) {
          console.error('Failed to update user role:', error);
        }
      }
    }
    
    console.log(`Admin setup for ${username} completed`);
    return true;
  } catch (error) {
    console.error(`Error setting up admin user ${username}:`, error);
    return false;
  }
};

const setupAllAdmins = async () => {
  try {
    console.log('Starting admin users setup...');
    
    // Setup shadowHimel
    await updateUserToAdmin('shadowHimel', 'himel1122');
    
    // Setup Albab AJ
    await updateUserToAdmin('Albab AJ', 'albab1122');
    
    console.log('Admin users setup completed');
  } catch (error) {
    console.error('Error in admin setup:', error);
  }
};

// Run the setup
setupAllAdmins().catch(console.error);