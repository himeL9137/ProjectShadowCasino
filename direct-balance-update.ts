import { storage } from './server/storage';

async function updateBalance() {
  try {
    console.log('Updating shadowHimel balance to 100 BDT...');
    
    // Get current user
    const user = await storage.getUser(1);
    if (!user) {
      console.error('User shadowHimel not found');
      return;
    }
    
    console.log(`Current: ${user.balance} ${user.currency}`);
    
    // Update balance directly
    const updatedUser = await storage.updateUserBalance(1, '100');
    
    console.log(`Updated: ${updatedUser.balance} ${updatedUser.currency}`);
    console.log('Balance successfully reduced to 100 BDT');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateBalance();