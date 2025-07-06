import { storage } from './server/storage.js';
import { UserRole, Currency } from './shared/schema.js';

async function createNewAdmins() {
  try {
    console.log('Creating new admin users: shadowTalha and shadowKaran');

    // Create shadowTalha admin user
    const existingTalha = await storage.getUserByUsername('shadowTalha');
    if (existingTalha) {
      console.log('shadowTalha already exists, updating to admin...');
      await storage.updateUserRole(existingTalha.id, UserRole.ADMIN);
      // Give them a good balance like shadowHimel
      await storage.updateUserBalance(existingTalha.id, '61029.00');
      await storage.updateUserCurrency(existingTalha.id, Currency.BDT);
      console.log('shadowTalha updated to admin role with 61029.00 BDT');
    } else {
      console.log('Creating admin user: shadowTalha');
      const talhaUser = await storage.createUser({
        username: 'shadowTalha',
        email: 'shadowtalha@example.com',
        phone: '01234567891',
        password: 'talha1122',
        balance: '61029.00',
        currency: Currency.BDT,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false
      });
      console.log('Admin user shadowTalha created with ID:', talhaUser.id);
    }

    // Create shadowKaran admin user
    const existingKaran = await storage.getUserByUsername('shadowKaran');
    if (existingKaran) {
      console.log('shadowKaran already exists, updating to admin...');
      await storage.updateUserRole(existingKaran.id, UserRole.ADMIN);
      // Give them a good balance like shadowHimel
      await storage.updateUserBalance(existingKaran.id, '61029.00');
      await storage.updateUserCurrency(existingKaran.id, Currency.BDT);
      console.log('shadowKaran updated to admin role with 61029.00 BDT');
    } else {
      console.log('Creating admin user: shadowKaran');
      const karanUser = await storage.createUser({
        username: 'shadowKaran',
        email: 'shadowkaran@example.com',
        phone: '01234567892',
        password: 'karan1122',
        balance: '61029.00',
        currency: Currency.BDT,
        role: UserRole.ADMIN,
        isMuted: false,
        isBanned: false
      });
      console.log('Admin user shadowKaran created with ID:', karanUser.id);
    }

    console.log('✅ New admin users created successfully');
    console.log('Both shadowTalha and shadowKaran have:');
    console.log('- Admin role with full privileges');
    console.log('- 61029.00 BDT balance (same as shadowHimel)');
    console.log('- All admin panel access');
    console.log('- Advertisement system disabled (same as shadowHimel)');
    
  } catch (error) {
    console.error('Error creating new admin users:', error);
  }
}

createNewAdmins().catch(console.error);