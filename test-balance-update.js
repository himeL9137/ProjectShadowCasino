import fetch from 'node-fetch';

// Function to test balance updates
async function testBalanceUpdates() {
  console.log('Starting balance update tests...');
  
  // Login first to get auth token
  console.log('Logging in to get auth token...');
  let response;
  try {
    response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'shadowHimel',
        password: 'admin1122'
      })
    });
    
    const loginData = await response.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('No token returned from login');
      return;
    }
    
    // Set auth header for next requests
    const token = loginData.token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Get current balance
    console.log('\nFetching current balance...');
    response = await fetch('http://localhost:5000/api/wallet/balance', {
      headers
    });
    
    const balanceData = await response.json();
    console.log('Current balance:', balanceData);
    
    // Process a deposit to test balance update
    console.log('\nMaking a deposit to test balance update...');
    response = await fetch('http://localhost:5000/api/wallet/deposit', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: 100,
        paymentMethod: 'Test'
      })
    });
    
    const depositData = await response.json();
    console.log('Deposit response:', depositData);
    
    // Get updated balance to verify
    console.log('\nFetching updated balance...');
    response = await fetch('http://localhost:5000/api/wallet/balance', {
      headers
    });
    
    const updatedBalanceData = await response.json();
    console.log('Updated balance:', updatedBalanceData);
    
    // Test currency conversion
    console.log('\nChanging currency to USD...');
    response = await fetch('http://localhost:5000/api/wallet/change-currency', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        currency: 'USD'
      })
    });
    
    const currencyData = await response.json();
    console.log('Currency change response:', currencyData);
    
    // Get final balance to verify
    console.log('\nFetching final balance after currency change...');
    response = await fetch('http://localhost:5000/api/wallet/balance', {
      headers
    });
    
    const finalBalanceData = await response.json();
    console.log('Final balance:', finalBalanceData);
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testBalanceUpdates();