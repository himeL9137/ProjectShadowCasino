import fetch from 'node-fetch';

async function testAdminLogin() {
  console.log('Testing admin login for shadowHimel and Aj Albab');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test shadowHimel login
    console.log('\nTesting shadowHimel login:');
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
      console.log('User data:', JSON.stringify(himelData, null, 2));
      
      // Test admin route access
      const himelAdminResponse = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${himelData.token || ''}`
        },
        credentials: 'include'
      });
      
      if (himelAdminResponse.ok) {
        console.log('✅ shadowHimel has admin access');
      } else {
        console.log('❌ shadowHimel does not have admin access:', await himelAdminResponse.text());
      }
    } else {
      console.log('❌ shadowHimel login failed:', await himelResponse.text());
    }
    
    // Test Aj Albab login
    console.log('\nTesting Aj Albab login:');
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
      console.log('User data:', JSON.stringify(albabData, null, 2));
      
      // Test admin route access
      const albabAdminResponse = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${albabData.token || ''}`
        },
        credentials: 'include'
      });
      
      if (albabAdminResponse.ok) {
        console.log('✅ Aj Albab has admin access');
      } else {
        console.log('❌ Aj Albab does not have admin access:', await albabAdminResponse.text());
      }
    } else {
      console.log('❌ Aj Albab login failed:', await albabResponse.text());
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testAdminLogin();