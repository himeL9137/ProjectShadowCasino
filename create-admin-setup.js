// Script to create and setup admin users properly
import fetch from 'node-fetch';

// Sequential operations to create and setup admin users
const createAndSetupAdmin = async () => {
  try {
    // Step 1: Register a new admin user with a properly formatted password
    console.log('Step 1: Registering new admin user shadowHimel2...');
    const registerResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'shadowHimel2',
        email: 'shadow2@example.com',
        phone: '11234567890',
        password: 'himel1122'
      })
    });
    
    let userId, token;
    
    if (registerResponse.ok) {
      const regData = await registerResponse.json();
      console.log('Registration successful!');
      console.log('User ID:', regData.user.id);
      console.log('Username:', regData.user.username);
      userId = regData.user.id;
      token = regData.token;
      
      // Step 2: Login with the new user
      console.log('\nStep 2: Logging in with new user...');
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
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('Login successful!');
        token = loginData.token;
        userId = loginData.user.id;
        
        // Now promote to admin manually by updating the database
        console.log('\nStep 3: Creating direct manual promotion endpoint...');
        // Create a temporary direct admin promotion route
        const setupResponse = await fetch('http://localhost:5000/api/admin-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Setup response:', setupResponse.status);
        if (setupResponse.ok) {
          const setupData = await setupResponse.json();
          console.log('Setup complete:', setupData);
        } else {
          console.log('Setup failed:', await setupResponse.text());
        }
      } else {
        console.log('Login failed:', await loginResponse.text());
      }
    } else {
      console.log('Registration failed:', await registerResponse.text());
    }
  } catch (error) {
    console.error('Error in setup:', error);
  }
};

createAndSetupAdmin().catch(console.error);