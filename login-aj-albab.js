import fetch from 'node-fetch';

async function loginAjAlbab() {
  console.log('Testing Aj Albab admin login and admin page access...');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test Aj Albab login
    console.log('\nLogging in as Aj Albab:');
    const albabResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Aj Albab',
        password: 'admin1122'
      }),
      credentials: 'include'
    });

    if (albabResponse.ok) {
      const albabData = await albabResponse.json();
      console.log('✅ Aj Albab login successful');
      console.log('User data:', JSON.stringify({
        username: albabData.user.username,
        role: albabData.user.role,
        email: albabData.user.email
      }, null, 2));
      
      // Verify that we can access admin routes
      console.log('\nVerifying admin access:');
      
      // Test admin stats route
      const statsResponse = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${albabData.token || ''}`
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
          'Authorization': `Bearer ${albabData.token || ''}`
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
      console.log('❌ Aj Albab login failed:', await albabResponse.text());
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

loginAjAlbab();