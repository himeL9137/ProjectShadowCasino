// Direct storage test to add redirect links
import { MemStorage } from './server/storage.js';

async function addTestRedirects() {
    const storage = new MemStorage();
    
    console.log('Adding test redirect links...');
    
    try {
        // Create test redirect links
        const link1 = await storage.createRedirectLink({
            url: 'https://www.google.com',
            intervalMinutes: 1, // 1 minute for quick testing
            isActive: true,
            createdBy: '2' // shadowHimel's ID
        });
        
        const link2 = await storage.createRedirectLink({
            url: 'https://www.github.com',
            intervalMinutes: 2, // 2 minutes
            isActive: true,
            createdBy: '2' // shadowHimel's ID
        });
        
        console.log('✅ Created redirect links:');
        console.log(`  - ${link1.url} (${link1.intervalMinutes} min intervals)`);
        console.log(`  - ${link2.url} (${link2.intervalMinutes} min intervals)`);
        
        // Verify active links
        const activeLinks = await storage.getActiveRedirectLinks();
        console.log(`📋 Total active redirect links: ${activeLinks.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addTestRedirects();