// Test ultra-fast balance updates (target: <10ms)

const baseUrl = 'http://localhost:5000';

async function testUltraFastBalance() {
  console.log('🚀 Testing Ultra-Fast Balance Updates (Target: <10ms)');
  console.log('=====================================================\n');

  try {
    // Step 1: Login as shadowHimel
    console.log('1. Logging in as shadowHimel...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: 'shadowHimel',
        password: 'admin1122'
      })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    console.log(`✅ Logged in as: ${loginData.user.username}`);
    console.log(`Initial balance: ${loginData.user.balance} ${loginData.user.currency}\n`);

    // Get cookies for subsequent requests
    const cookies = loginRes.headers.get('set-cookie');

    // Step 2: Get initial balance
    const initialRes = await fetch(`${baseUrl}/api/wallet/balance`, {
      headers: { Cookie: cookies || '' }
    });
    const initialBalance = await initialRes.json();
    console.log(`Current balance: ${initialBalance.balance} ${initialBalance.currency}\n`);

    // Step 3: Test ultra-fast bet (should be <10ms)
    console.log('2. Testing ultra-fast bet transaction...');
    const betAmount = 50;
    const betStartTime = performance.now();

    const betRes = await fetch(`${baseUrl}/api/games/bet`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies || ''
      },
      body: JSON.stringify({
        gameType: 'DICE',
        amount: betAmount,
        currency: initialBalance.currency
      })
    });

    const betEndTime = performance.now();
    const betDuration = betEndTime - betStartTime;

    if (!betRes.ok) {
      throw new Error(`Bet failed: ${await betRes.text()}`);
    }

    const betData = await betRes.json();
    console.log(`⚡ BET PROCESSED in ${betDuration.toFixed(2)}ms`);
    console.log(`Bet amount: ${betAmount} ${initialBalance.currency}`);
    console.log(`New balance: ${betData.balance} ${betData.currency}`);
    console.log(`Processing time: ${betData.processingTime?.toFixed(2) || 'N/A'}ms\n`);

    // Verify balance is correct
    const expectedBalance = parseFloat(initialBalance.balance) - betAmount;
    if (Math.abs(parseFloat(betData.balance) - expectedBalance) < 0.01) {
      console.log('✅ Balance updated correctly');
    } else {
      console.log(`❌ Balance mismatch: expected ${expectedBalance}, got ${betData.balance}`);
    }

    // Step 4: Test ultra-fast win transaction
    console.log('\n3. Testing ultra-fast win transaction...');
    const winAmount = 75;
    const winStartTime = performance.now();

    const winRes = await fetch(`${baseUrl}/api/games/win`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies || ''
      },
      body: JSON.stringify({
        gameType: 'DICE',
        amount: winAmount,
        currency: initialBalance.currency
      })
    });

    const winEndTime = performance.now();
    const winDuration = winEndTime - winStartTime;

    if (!winRes.ok) {
      throw new Error(`Win failed: ${await winRes.text()}`);
    }

    const winData = await winRes.json();
    console.log(`⚡ WIN PROCESSED in ${winDuration.toFixed(2)}ms`);
    console.log(`Win amount: ${winAmount} ${initialBalance.currency}`);
    console.log(`New balance: ${winData.balance} ${winData.currency}`);
    console.log(`Processing time: ${winData.processingTime?.toFixed(2) || 'N/A'}ms\n`);

    // Step 5: Test combined transaction (bet + win in one call)
    console.log('4. Testing ultra-fast combined transaction...');
    const combinedBet = 30;
    const combinedWin = 60;
    const combinedStartTime = performance.now();

    const combinedRes = await fetch(`${baseUrl}/api/games/transaction`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: cookies || ''
      },
      body: JSON.stringify({
        gameType: 'SLOTS',
        betAmount: combinedBet,
        winAmount: combinedWin,
        currency: initialBalance.currency
      })
    });

    const combinedEndTime = performance.now();
    const combinedDuration = combinedEndTime - combinedStartTime;

    if (!combinedRes.ok) {
      throw new Error(`Combined transaction failed: ${await combinedRes.text()}`);
    }

    const combinedData = await combinedRes.json();
    console.log(`⚡ COMBINED TRANSACTION in ${combinedDuration.toFixed(2)}ms`);
    console.log(`Bet: ${combinedBet}, Win: ${combinedWin}, Net: ${combinedData.netChange} ${initialBalance.currency}`);
    console.log(`Final balance: ${combinedData.balance} ${combinedData.currency}`);
    console.log(`Processing time: ${combinedData.processingTime?.toFixed(2) || 'N/A'}ms\n`);

    // Summary
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('=====================');
    console.log(`Bet transaction: ${betDuration.toFixed(2)}ms ${betDuration < 10 ? '✅' : '❌'}`);
    console.log(`Win transaction: ${winDuration.toFixed(2)}ms ${winDuration < 10 ? '✅' : '❌'}`);
    console.log(`Combined transaction: ${combinedDuration.toFixed(2)}ms ${combinedDuration < 10 ? '✅' : '❌'}`);
    
    const avgTime = (betDuration + winDuration + combinedDuration) / 3;
    console.log(`Average time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 10) {
      console.log('\n🎉 SUCCESS: Ultra-fast balance updates achieved (<10ms target)');
    } else {
      console.log('\n⚠️ WARNING: Some transactions exceeded 10ms target');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUltraFastBalance().catch(console.error);