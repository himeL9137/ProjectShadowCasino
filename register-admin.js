// Script to register admin users directly
import fetch from 'node-fetch';

// Register the admin users directly through the API
const registerAdmin = async () => {
  try {
    console.log('Attempting to register shadowHimel admin user...');
    const registerShadowResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'shadowHimel',
        email: 'shadow@example.com',
        phone: '01234567890',
        password: 'himel1122'
      })
    });
    
    console.log('Registration response status:', registerShadowResponse.status);
    
    // Extract the response body
    const contentType = registerShadowResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const responseData = await registerShadowResponse.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } else {
      const textResponse = await registerShadowResponse.text();
      console.log('Response (text):', textResponse.substring(0, 100) + '...');
    }
    
    // Now register Albab AJ admin
    console.log('\nAttempting to register Albab AJ admin user...');
    const registerAlbabResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Albab AJ',
        email: 'albab@example.com',
        phone: '09876543210',
        password: 'albab1122'
      })
    });
    
    console.log('Registration response status:', registerAlbabResponse.status);
    
    // Extract the response body
    const albabContentType = registerAlbabResponse.headers.get('content-type') || '';
    if (albabContentType.includes('application/json')) {
      const responseData = await registerAlbabResponse.json();
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } else {
      const textResponse = await registerAlbabResponse.text();
      console.log('Response (text):', textResponse.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('Error in registration attempt:', error);
  }
};

registerAdmin().catch(console.error);