import axios from 'axios';

async function testBalanceAdjustment() {
  const baseURL = 'http://localhost:5000';
  
  try {
    // First, login as admin
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'shadowHimel',
      password: 'admin1122'
    }, {
      withCredentials: true
    });
    
    console.log('Login response data:', Object.keys(loginResponse.data));
    
    // Use cookies for authentication since JWT is in httpOnly cookie
    const headers = { 
      Cookie: loginResponse.headers['set-cookie']?.[0] || ''
    };
    
    console.log('✅ Logged in successfully as shadowHimel');
    
    // Get all users
    console.log('\nFetching all users...');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users`, { headers });
    const users = usersResponse.data;
    console.log(`✅ Found ${users.length} users`);
    
    // Find a test user (not the admin)
    const testUser = users.find(u => u.username !== 'shadowHimel' && u.id !== '1');
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }
    
    console.log(`\n📌 Testing with user: ${testUser.username}`);
    console.log(`Current balance: ${testUser.balance} ${testUser.currency}`);
    
    // Test 1: Add funds in same currency
    console.log('\n🔵 Test 1: Adding funds in same currency');
    const addSameCurrencyResponse = await axios.post(
      `${baseURL}/api/admin/users/${testUser.id}/add-funds`,
      {
        amount: '100',
        currency: testUser.currency,
        reason: 'Test addition'
      },
      { headers }
    );
    console.log('✅ Add funds response:', addSameCurrencyResponse.data);
    
    // Test 2: Add funds in different currency (USD to user's currency)
    console.log('\n🔵 Test 2: Adding funds in different currency (USD)');
    const addDifferentCurrencyResponse = await axios.post(
      `${baseURL}/api/admin/users/${testUser.id}/add-funds`,
      {
        amount: '50',
        currency: 'USD',
        reason: 'Test USD addition'
      },
      { headers }
    );
    console.log('✅ Add funds response:', addDifferentCurrencyResponse.data);
    
    // Test 3: Remove funds
    console.log('\n🔵 Test 3: Removing funds');
    const removeFundsResponse = await axios.post(
      `${baseURL}/api/admin/users/${testUser.id}/remove-funds`,
      {
        amount: '25',
        currency: testUser.currency,
        reason: 'Test removal'
      },
      { headers }
    );
    console.log('✅ Remove funds response:', removeFundsResponse.data);
    
    // Test 4: Test error handling - remove more than balance
    console.log('\n🔵 Test 4: Testing insufficient funds error');
    try {
      await axios.post(
        `${baseURL}/api/admin/users/${testUser.id}/remove-funds`,
        {
          amount: '999999',
          currency: testUser.currency,
          reason: 'Test excessive removal'
        },
        { headers }
      );
    } catch (error) {
      console.log('✅ Expected error:', error.response.data.message);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testBalanceAdjustment();