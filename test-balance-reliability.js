
// Balance Update Reliability Test
// This script tests the reliability of balance updates

const fetch = require('node-fetch');
const readline = require('readline');

// Configuration
const baseUrl = 'http://localhost:5000'; // Change as needed
const username = 'testuser'; // Change to a valid test user
const password = 'testpassword'; // Change to valid password

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Test balance update reliability
async function testBalanceUpdateReliability() {
  try {
    console.log('===== BALANCE UPDATE RELIABILITY TEST =====');
    console.log('This test verifies that wallet balance updates correctly after game actions.');
    
    // Step 1: Login to get auth token
    console.log('\n1. Logging in...');
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!loginRes.ok) {
      const error = await loginRes.text();
      throw new Error(`Login failed: ${error}`);
    }
    
    const userData = await loginRes.json();
    const cookies = loginRes.headers.get('set-cookie');
    
    console.log(`Login successful for ${userData.username}`);
    console.log(`Initial balance: ${userData.balance} ${userData.currency}`);
    
    // Step 2: Get initial balance
    console.log('\n2. Fetching initial balance...');
    const initialBalanceRes = await fetch(`${baseUrl}/api/wallet/balance`, {
      headers: { Cookie: cookies }
    });
    
    if (!initialBalanceRes.ok) {
      const error = await initialBalanceRes.text();
      throw new Error(`Failed to get initial balance: ${error}`);
    }
    
    const initialBalance = await initialBalanceRes.json();
    console.log(`Initial balance: ${initialBalance.balance} ${initialBalance.currency}`);
    let currentBalance = parseFloat(initialBalance.balance);
    
    // Step 3: Place a bet and verify balance update
    console.log('\n3. Placing a bet...');
    const betAmount = 10;
    console.log(`Placing bet: ${betAmount} ${initialBalance.currency}`);
    
    const betRes = await fetch(`${baseUrl}/api/games/bet`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({
        gameType: 'DICE',
        betAmount: betAmount,
        currency: initialBalance.currency
      })
    });
    
    if (!betRes.ok) {
      const error = await betRes.text();
      throw new Error(`Bet failed: ${error}`);
    }
    
    const betData = await betRes.json();
    console.log(`Bet response: ${JSON.stringify(betData, null, 2)}`);
    
    // Step 4: Verify balance decreased by bet amount
    const expectedBalanceAfterBet = (currentBalance - betAmount).toFixed(2);
    console.log(`Expected balance after bet: ${expectedBalanceAfterBet}`);
    console.log(`Actual balance after bet: ${betData.balance}`);
    
    if (parseFloat(betData.balance) !== parseFloat(expectedBalanceAfterBet)) {
      console.warn(`⚠️ INCONSISTENCY DETECTED: Balance after bet doesn't match expected value`);
      console.warn(`Expected: ${expectedBalanceAfterBet}, Got: ${betData.balance}`);
    } else {
      console.log(`✅ Balance correctly decreased by bet amount`);
    }
    
    currentBalance = parseFloat(betData.balance);
    
    // Step 5: Simulate a win and verify balance update
    console.log('\n4. Simulating a win...');
    const winAmount = 20;
    console.log(`Processing win: ${winAmount} ${initialBalance.currency}`);
    
    const winRes = await fetch(`${baseUrl}/api/games/win`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({
        gameType: 'DICE',
        winAmount: winAmount,
        currency: initialBalance.currency,
        multiplier: 2.0
      })
    });
    
    if (!winRes.ok) {
      const error = await winRes.text();
      throw new Error(`Win processing failed: ${error}`);
    }
    
    const winData = await winRes.json();
    console.log(`Win response: ${JSON.stringify(winData, null, 2)}`);
    
    // Step 6: Verify balance increased by win amount
    const expectedBalanceAfterWin = (currentBalance + winAmount).toFixed(2);
    console.log(`Expected balance after win: ${expectedBalanceAfterWin}`);
    console.log(`Actual balance after win: ${winData.balance}`);
    
    if (parseFloat(winData.balance) !== parseFloat(expectedBalanceAfterWin)) {
      console.warn(`⚠️ INCONSISTENCY DETECTED: Balance after win doesn't match expected value`);
      console.warn(`Expected: ${expectedBalanceAfterWin}, Got: ${winData.balance}`);
    } else {
      console.log(`✅ Balance correctly increased by win amount`);
    }
    
    // Step 7: Verify with a direct balance check
    console.log('\n5. Verifying final balance with API...');
    const finalBalanceRes = await fetch(`${baseUrl}/api/wallet/balance`, {
      headers: { Cookie: cookies }
    });
    
    if (!finalBalanceRes.ok) {
      const error = await finalBalanceRes.text();
      throw new Error(`Failed to get final balance: ${error}`);
    }
    
    const finalBalance = await finalBalanceRes.json();
    console.log(`Final verified balance: ${finalBalance.balance} ${finalBalance.currency}`);
    
    if (parseFloat(finalBalance.balance) !== parseFloat(winData.balance)) {
      console.error(`❌ CRITICAL ERROR: Final balance check doesn't match last transaction response`);
      console.error(`Transaction response: ${winData.balance}, Direct API check: ${finalBalance.balance}`);
    } else {
      console.log(`✅ SUCCESS: Balance verification successful!`);
    }
    
    console.log('\n===== TEST COMPLETED =====');
    console.log(`Starting balance: ${initialBalance.balance}`);
    console.log(`Ending balance: ${finalBalance.balance}`);
    console.log(`Expected net change: ${(winAmount - betAmount).toFixed(2)}`);
    console.log(`Actual net change: ${(parseFloat(finalBalance.balance) - parseFloat(initialBalance.balance)).toFixed(2)}`);
    
    rl.close();
  } catch (error) {
    console.error('Test failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Start the test
testBalanceUpdateReliability();
