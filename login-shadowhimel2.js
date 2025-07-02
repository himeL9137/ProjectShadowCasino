// ESM module to attempt admin login with shadowHimel2
import fetch from 'node-fetch';

// Attempt login with admin credentials
const loginAdmin = async () => {
  try {
    console.log('Attempting admin login with shadowHimel2...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'shadowHimel2',
        password: 'himel1122'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Extract the response body
    const contentType = loginResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const responseData = await loginResponse.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
      
      // If login succeeded, try accessing admin resources
      if (loginResponse.ok && responseData.token) {
        console.log('\nLogin successful! Trying to access admin resources with token...');
        
        // First try admin users list
        console.log('\nTrying to access admin users list...');
        const adminUsersResponse = await fetch('http://localhost:5000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${responseData.token}`
          }
        });
        
        console.log('Admin users response status:', adminUsersResponse.status);
        
        if (adminUsersResponse.ok) {
          const usersData = await adminUsersResponse.json();
          console.log('Admin users count:', usersData.length);
          console.log('First few users:', usersData.slice(0, 2));
        } else {
          console.log('Failed to get admin users:', await adminUsersResponse.text());
        }
        
        // Then try admin stats
        console.log('\nTrying to access admin stats...');
        const adminStatsResponse = await fetch('http://localhost:5000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${responseData.token}`
          }
        });
        
        console.log('Admin stats response status:', adminStatsResponse.status);
        
        if (adminStatsResponse.ok) {
          const statsData = await adminStatsResponse.json();
          console.log('Admin stats:', JSON.stringify(statsData, null, 2));
        } else {
          console.log('Failed to get admin stats:', await adminStatsResponse.text());
        }
      }
    } else {
      const textResponse = await loginResponse.text();
      console.log('Response (text):', textResponse.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Error in login attempt:', error);
  }
};

loginAdmin().catch(console.error);