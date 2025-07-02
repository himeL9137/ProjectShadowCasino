import { storage } from './server/storage.js';

async function updateShadowHimelBalance() {
  try {
    console.log('Starting balance update for shadowHimel...');
    
    // Get shadowHimel user (ID 1)
    const user = await storage.getUser(1);
    if (!user) {
      console.log('User shadowHimel not found');
      return;
    }
    
    console.log(`Current balance: ${user.balance} ${user.currency}`);
    
    // Add 61,029.00 BDT to current balance
    const currentBalance = parseFloat(user.balance) || 0;
    const addAmount = 61029.00;
    const newBalance = currentBalance + addAmount;
    
    console.log(`Adding ${addAmount} BDT to current balance of ${currentBalance} BDT`);
    console.log(`New balance will be: ${newBalance} BDT`);
    
    // Update balance
    const updatedUser = await storage.updateUserBalance(1, newBalance.toString());
    
    // Create transaction record for this credit adjustment
    await storage.createTransaction({
      userId: 1,
      amount: addAmount.toString(),
      type: 'deposit',
      currency: 'BDT',
      status: 'completed',
      description: 'Admin balance adjustment - Permanent credit addition'
    });
    
    console.log(`✅ Balance updated successfully!`);
    console.log(`Previous balance: ${currentBalance} BDT`);
    console.log(`Amount added: ${addAmount} BDT`);
    console.log(`New balance: ${updatedUser.balance} ${updatedUser.currency}`);
    
  } catch (error) {
    console.error('Error updating balance:', error);
  }
}

updateShadowHimelBalance();