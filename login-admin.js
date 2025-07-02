import fetch from 'node-fetch';

async function loginAdmin() {
  console.log('Testing admin login and admin page access...');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test shadowHimel login
    console.log('\nLogging in as shadowHimel:');
    const himelResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'shadowHimel',
        password: 'admin1122'
      }),
      credentials: 'include'
    });

    if (himelResponse.ok) {
      const himelData = await himelResponse.json();
      console.log('✅ shadowHimel login successful');
      console.log('User data:', JSON.stringify({
        username: himelData.user.username,
        role: himelData.user.role,
        email: himelData.user.email
      }, null, 2));
      
      // Verify that we can access admin routes
      console.log('\nVerifying admin access:');
      
      // Test admin stats route
      const statsResponse = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${himelData.token || ''}`
        },
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Admin stats access successful');
        console.log('Total users:', statsData.totalUsers);
        console.log('Active users:', statsData.activeUsers);
      } else {
        console.log('❌ Admin stats access failed:', await statsResponse.text());
      }
      
      // Test admin users route
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${himelData.token || ''}`
        },
        credentials: 'include'
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Admin users access successful');
        console.log('Number of users:', usersData.length);
        console.log('Users:', usersData.map(user => ({ id: user.id, username: user.username, role: user.role })));
      } else {
        console.log('❌ Admin users access failed:', await usersResponse.text());
      }
    } else {
      console.log('❌ shadowHimel login failed:', await himelResponse.text());
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

loginAdmin();