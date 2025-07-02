import fetch from 'node-fetch';

// Test user credentials
const username = 'shadowHimel';
const password = 'himel1122';

// Base URL
const baseUrl = 'http://localhost:5000';

// Test sequence
async function testBalanceUpdates() {
  try {
    console.log('Starting balance update test...');
    
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
    
    // Step 2: Check initial balance
    console.log('\n2. Checking initial wallet balance...');
    const initialBalanceRes = await fetch(`${baseUrl}/api/wallet/balance`, {
      headers: { Cookie: cookies }
    });
    
    if (!initialBalanceRes.ok) {
      const error = await initialBalanceRes.text();
      throw new Error(`Failed to get initial balance: ${error}`);
    }
    
    const initialBalance = await initialBalanceRes.json();
    console.log(`Current balance: ${initialBalance.balance} ${initialBalance.currency}`);
    
    // Step 3: Make a deposit
    console.log('\n3. Making a deposit...');
    const depositAmount = 100;
    const depositRes = await fetch(`${baseUrl}/api/wallet/deposit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({ 
        amount: depositAmount, 
        currency: initialBalance.currency
      })
    });
    
    if (!depositRes.ok) {
      const error = await depositRes.text();
      throw new Error(`Deposit failed: ${error}`);
    }
    
    const depositResult = await depositRes.json();
    console.log(`Deposit result: ${depositResult.message}`);
    console.log(`New balance: ${depositResult.balance} ${depositResult.currency}`);
    
    // Step 4: Place a bet
    console.log('\n4. Placing a bet (should reduce balance)...');
    const betAmount = 50;
    const betRes = await fetch(`${baseUrl}/api/games/bet`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({ 
        gameType: 'SLOTS',
        betAmount: betAmount, 
        currency: depositResult.currency
      })
    });
    
    if (!betRes.ok) {
      const error = await betRes.text();
      throw new Error(`Bet placement failed: ${error}`);
    }
    
    const betResult = await betRes.json();
    console.log(`Bet placed: ${betResult.message}`);
    console.log(`Balance after bet: ${betResult.balance} ${betResult.currency}`);
    
    // Step 5: Record a win
    console.log('\n5. Recording a win (should increase balance)...');
    const winAmount = 120;
    const multiplier = 2.4;
    const winRes = await fetch(`${baseUrl}/api/games/win`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify({ 
        gameType: 'SLOTS',
        winAmount: winAmount,
        multiplier: multiplier,
        currency: betResult.currency,
        gameData: { spins: 10, combination: "7-7-7" }
      })
    });
    
    if (!winRes.ok) {
      const error = await winRes.text();
      throw new Error(`Win recording failed: ${error}`);
    }
    
    const winResult = await winRes.json();
    console.log(`Win recorded: ${winResult.message}`);
    console.log(`Balance after win: ${winResult.balance} ${winResult.currency}`);
    
    // Step 6: Check transaction history
    console.log('\n6. Checking transaction history...');
    const historyRes = await fetch(`${baseUrl}/api/wallet/transactions`, {
      headers: { Cookie: cookies }
    });
    
    if (!historyRes.ok) {
      const error = await historyRes.text();
      throw new Error(`Failed to get transaction history: ${error}`);
    }
    
    const transactions = await historyRes.json();
    console.log(`Transaction history (last ${transactions.length} transactions):`);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Type: ${tx.type}, Amount: ${tx.amount} ${tx.currency}, Status: ${tx.status}`);
    });
    
    // Step 7: Check game history
    console.log('\n7. Checking game history...');
    const gameHistoryRes = await fetch(`${baseUrl}/api/games/history`, {
      headers: { Cookie: cookies }
    });
    
    if (!gameHistoryRes.ok) {
      const error = await gameHistoryRes.text();
      throw new Error(`Failed to get game history: ${error}`);
    }
    
    const gameHistory = await gameHistoryRes.json();
    console.log(`Game history (last ${gameHistory.length} games):`);
    
    gameHistory.forEach((game, index) => {
      console.log(`${index + 1}. Game: ${game.gameType}, Win: ${game.isWin ? 'Yes' : 'No'}, Amount: ${game.winAmount || '0'}`);
    });
    
    console.log('\nBalance update test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testBalanceUpdates();