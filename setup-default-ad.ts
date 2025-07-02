// Script to insert a default advertisement into the database
// Run this with: npx tsx setup-default-ad.ts

import fetch from 'node-fetch';

// The HTML for our default advertisement
const defaultAdHTML = `
<script>
var atOptions = { 
  'key' : 'a1234567890abcdef1234567890abcdef', 
  'format' : 'iframe', 
  'height' : 300, 
  'width' : 160, 
  'params' : {} 
};
document.write('<scr' + 'ipt type="text/javascript" src="http://www.example-ad-network.com/a/display.js"></scr' + 'ipt>');
</script>
`;

async function createDefaultAd() {
  try {
    // First, login as admin
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'shadowHimel',
        password: 'himel1122'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    const userData = await loginResponse.json();
    console.log(`Logged in as ${userData.username}`);
    
    // Get the cookies from the login response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Now create the advertisement
    const adResponse = await fetch('http://localhost:5000/api/admin/advertisement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        html: defaultAdHTML,
        frequency: 100,
        isEnabled: true,
        isDefault: true
      })
    });
    
    if (!adResponse.ok) {
      throw new Error(`Failed to create advertisement: ${adResponse.statusText}`);
    }
    
    const adData = await adResponse.json();
    console.log(`Default advertisement created with ID: ${adData.id}`);
    console.log('Success! The default permanent advertisement has been created.');
    
  } catch (error) {
    console.error('Error creating default advertisement:', error);
  }
}

createDefaultAd();