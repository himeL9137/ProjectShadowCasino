import { readFileSync, writeFileSync } from 'fs';

// Read the routes file
let content = readFileSync('./server/routes.ts', 'utf-8');

// Replace all instances of storage.getUser(req.user.id) with storage.getUser(String(req.user.id))
content = content.replace(/storage\.getUser\(req\.user\.id\)/g, 'storage.getUser(String(req.user.id))');

// Replace instances in other patterns too
content = content.replace(/storage\.getUser\(userId\)/g, 'storage.getUser(String(userId))');
content = content.replace(/storage\.getUser\(user\.id\)/g, 'storage.getUser(String(user.id))');
content = content.replace(/storage\.updateUser\(req\.user\.id/g, 'storage.updateUser(String(req.user.id)');
content = content.replace(/storage\.updateUserBalance\(req\.user\.id/g, 'storage.updateUserBalance(String(req.user.id)');
content = content.replace(/storage\.createTransaction\(req\.user\.id/g, 'storage.createTransaction(String(req.user.id)');
content = content.replace(/storage\.getTransactionsByUserId\(req\.user\.id/g, 'storage.getTransactionsByUserId(String(req.user.id)');

// Write the fixed content back
writeFileSync('./server/routes.ts', content);

console.log('Fixed all user ID lookups in routes.ts');

// Now fix wallet.ts
let walletContent = readFileSync('./server/wallet.ts', 'utf-8');
walletContent = walletContent.replace(/storage\.getUser\(req\.user\.id\)/g, 'storage.getUser(String(req.user.id))');
walletContent = walletContent.replace(/req\.user\.id/g, 'String(req.user.id)');
writeFileSync('./server/wallet.ts', walletContent);

console.log('Fixed all user ID lookups in wallet.ts');

// Fix admin.ts
let adminContent = readFileSync('./server/admin.ts', 'utf-8');
adminContent = adminContent.replace(/storage\.getUser\(req\.user\.id\)/g, 'storage.getUser(String(req.user.id))');
adminContent = adminContent.replace(/storage\.getUser\(userId\)/g, 'storage.getUser(String(userId))');
writeFileSync('./server/admin.ts', adminContent);

console.log('Fixed all user ID lookups in admin.ts');

// Fix games.ts
let gamesContent = readFileSync('./server/games.ts', 'utf-8');
gamesContent = gamesContent.replace(/storage\.getUser\(userId\)/g, 'storage.getUser(String(userId))');
gamesContent = gamesContent.replace(/storage\.updateUserBalance\(userId/g, 'storage.updateUserBalance(String(userId)');
gamesContent = gamesContent.replace(/storage\.createTransaction\(userId/g, 'storage.createTransaction(String(userId)');
writeFileSync('./server/games.ts', gamesContent);

console.log('Fixed all user ID lookups in games.ts');