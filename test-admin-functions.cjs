const axios = require('axios');

async function testAdminFunctions() {
  const baseURL = 'http://localhost:5000';
  
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'shadowHimel',
      password: 'admin1122'
    }, {
      withCredentials: true
    });
    
    const userData = loginResponse.data;
    console.log('✅ Logged in successfully as shadowHimel');
    
    // Check if response is actually HTML
    if (typeof userData === 'string') {
      console.log('Response is HTML, not JSON. Check for redirect.');
    } else {
      console.log('User data:', userData);
    }
    
    // For authentication, we need to maintain axios session with cookies
    const axiosInstance = axios.create({
      baseURL: baseURL,
      withCredentials: true,
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
      }
    });
    
    // Step 2: Get all users
    console.log('\n2. Fetching all users...');
    const usersResponse = await axiosInstance.get('/api/admin/users');
    const users = usersResponse.data;
    console.log(`✅ Found ${users.length} users`);
    
    // Find a test user (not an admin)
    const testUser = users.find(u => u.username !== 'shadowHimel' && u.username !== 'shadowTalha' && u.username !== 'shadowKaran');
    if (!testUser) {
      console.log('❌ No test user found. Creating one...');
      const registerResponse = await axiosInstance.post('/api/auth/register', {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'password123',
        currency: 'USD'
      });
      testUser = registerResponse.data.user;
    }
    
    console.log(`\n📌 Testing with user: ${testUser.username} (ID: ${testUser.id})`);
    console.log(`Current status - Banned: ${testUser.isBanned}, Muted: ${testUser.isMuted}`);
    
    // Step 3: Test Mute/Unmute (Kick/Unkick)
    console.log('\n3. Testing Mute/Unmute functions...');
    
    // Mute user
    try {
      console.log('   - Muting user...');
      const muteResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/mute`,
        { reason: 'Test mute' }
      );
      console.log('   ✅ Mute successful:', muteResponse.data.message);
    } catch (error) {
      console.log('   ❌ Mute failed:', error.response?.data?.message || error.message);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Unmute user
    try {
      console.log('   - Unmuting user...');
      const unmuteResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/unmute`,
        { reason: 'Test unmute' }
      );
      console.log('   ✅ Unmute successful:', unmuteResponse.data.message);
    } catch (error) {
      console.log('   ❌ Unmute failed:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Test Ban/Unban
    console.log('\n4. Testing Ban/Unban functions...');
    
    // Ban user
    try {
      console.log('   - Banning user...');
      const banResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/ban`,
        { reason: 'Test ban' }
      );
      console.log('   ✅ Ban successful:', banResponse.data.message);
    } catch (error) {
      console.log('   ❌ Ban failed:', error.response?.data?.message || error.message);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Unban user
    try {
      console.log('   - Unbanning user...');
      const unbanResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/unban`,
        { reason: 'Test unban' }
      );
      console.log('   ✅ Unban successful:', unbanResponse.data.message);
    } catch (error) {
      console.log('   ❌ Unban failed:', error.response?.data?.message || error.message);
    }
    
    // Step 5: Test Balance Adjustment
    console.log('\n5. Testing Balance Adjustment functions...');
    
    // Add funds
    try {
      console.log('   - Adding funds...');
      const addResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/add-funds`,
        { 
          amount: '100',
          currency: 'USD',
          reason: 'Test add funds'
        }
      );
      console.log('   ✅ Add funds successful:', addResponse.data.message);
      console.log('   New balance:', addResponse.data.newBalance, addResponse.data.balanceCurrency);
    } catch (error) {
      console.log('   ❌ Add funds failed:', error.response?.data?.message || error.message);
    }
    
    // Remove funds
    try {
      console.log('   - Removing funds...');
      const removeResponse = await axiosInstance.post(
        `/api/admin/users/${testUser.id}/remove-funds`,
        { 
          amount: '50',
          currency: 'USD',
          reason: 'Test remove funds'
        }
      );
      console.log('   ✅ Remove funds successful:', removeResponse.data.message);
      console.log('   New balance:', removeResponse.data.newBalance, removeResponse.data.balanceCurrency);
    } catch (error) {
      console.log('   ❌ Remove funds failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testAdminFunctions();