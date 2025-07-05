#!/usr/bin/env node

// Test script to create redirect links and verify the AutoRedirect system is working

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function main() {
    try {
        console.log('🔧 Testing AutoRedirect Link Management System');
        
        // First login as admin
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            username: 'shadowHimel',
            password: 'shadowhimel123'
        });
        
        console.log('✅ Logged in successfully');
        
        // Extract cookie from login response
        const cookies = loginResponse.headers['set-cookie'];
        let authToken = '';
        if (cookies) {
            const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
            if (tokenCookie) {
                authToken = tokenCookie.split(';')[0];
            }
        }
        
        console.log('🍪 Auth cookie:', authToken);
        
        // Create test redirect links
        const testLinks = [
            {
                url: 'https://www.google.com',
                intervalMinutes: 1, // 1 minute for quick testing
                isActive: true
            },
            {
                url: 'https://www.github.com',
                intervalMinutes: 2, // 2 minutes
                isActive: true
            }
        ];
        
        for (const link of testLinks) {
            const createResponse = await axios.post(`${BASE_URL}/api/admin/redirect-links`, link, {
                headers: {
                    'Cookie': authToken,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ Created redirect link: ${link.url} (${link.intervalMinutes} min intervals)`);
        }
        
        // Check active links
        const activeLinksResponse = await axios.get(`${BASE_URL}/api/redirect-links/active`);
        console.log(`📋 Active redirect links:`, activeLinksResponse.data);
        
        console.log('🚀 Test complete! AutoRedirect should now be working with these links.');
        console.log('📊 Check browser console for AutoRedirect debug logs');
        console.log('⏰ Links will redirect every 1-2 minutes');
        
    } catch (error) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

main();