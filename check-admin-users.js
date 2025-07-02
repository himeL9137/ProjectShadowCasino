// ESM module to check admin users and login functionality
import fetch from 'node-fetch';

// Self-executing async function
const checkAdminUsers = async () => {
  try {
    // Check if the server is running and responding
    console.log('Testing connection to server...');
    const baseUrl = 'http://localhost:5000';
    
    try {
      // First try a simple GET request to make sure the server responds
      const homeResponse = await fetch(`${baseUrl}/`);
      const contentType = homeResponse.headers.get('content-type') || '';
      console.log('Server responded with status:', homeResponse.status);
      console.log('Content type:', contentType);
      
      if (contentType.includes('html')) {
        console.log('Server appears to be running correctly.');
      }
    } catch (e) {
      console.error('Error connecting to server:', e.message);
      console.log('Make sure the server is running on port 5000');
      return;
    }
    
    // Now attempt to access our user-exists endpoint
    console.log('\nChecking admin users in database...');
    
    // Try shadowHimel
    try {
      const shadowHimelResponse = await fetch(`${baseUrl}/api/user-exists?username=shadowHimel`);
      if (shadowHimelResponse.ok) {
        const shadowHimelData = await shadowHimelResponse.json();
        console.log('shadowHimel user exists:', shadowHimelData.exists);
        console.log('Is admin:', shadowHimelData.isAdmin);
      } else {
        console.log('Failed to check shadowHimel:', shadowHimelResponse.status);
      }
    } catch (error) {
      console.error('Error checking shadowHimel:', error.message);
    }
    
    // Try Albab AJ
    try {
      const albabResponse = await fetch(`${baseUrl}/api/user-exists?username=Albab%20AJ`);
      if (albabResponse.ok) {
        const albabData = await albabResponse.json();
        console.log('Albab AJ user exists:', albabData.exists);
        console.log('Is admin:', albabData.isAdmin);
      } else {
        console.log('Failed to check Albab AJ:', albabResponse.status);
      }
    } catch (error) {
      console.error('Error checking Albab AJ:', error.message);
    }
    
    // Now try admin routes (should fail without auth)
    console.log('\nAttempting to access admin routes without auth (should fail)...');
    try {
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
      console.log('Status:', usersResponse.status);
      if (!usersResponse.ok) {
        const responseText = await usersResponse.text();
        console.log('Response:', responseText.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('Error accessing admin users:', error.message);
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
};

checkAdminUsers().catch(console.error);