#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

class PerfectActivityTester {
  constructor() {
    this.cookies = '';
    this.testResults = [];
  }

  async log(message, success = true) {
    const status = success ? '✅' : '❌';
    const logMessage = `${status} ${message}`;
    console.log(logMessage);
    this.testResults.push({ message, success });
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies,
          ...headers
        },
        data,
        timeout: 10000
      };

      const response = await axios(config);
      
      // Extract cookies if present
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie']
          .map(cookie => cookie.split(';')[0])
          .join('; ');
      }

      return response;
    } catch (error) {
      throw new Error(`Request failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
    }
  }

  async testPerfectActivitySystem() {
    console.log('🚀 TESTING PERFECT USER ACTIVITY TRACKING SYSTEM\n');

    try {
      // Step 1: Login as shadowHimel admin
      await this.log('Attempting admin login...');
      const loginResponse = await this.makeRequest('POST', '/api/login', {
        username: 'shadowHimel',
        password: 'admin1122'  // Correct admin password
      });

      if (loginResponse.status === 200) {
        await this.log('✨ Admin login successful');
        const userData = loginResponse.data.user;
        await this.log(`Logged in as: ${userData.username} (${userData.role})`);
      }

    } catch (error) {
      // Try alternative login
      try {
        await this.log('Trying alternative admin credentials...');
        const altLoginResponse = await this.makeRequest('POST', '/api/login', {
          username: 'shadowHimel',
          password: 'admin123'
        });
        
        if (altLoginResponse.status === 200) {
          await this.log('✨ Alternative admin login successful');
        }
      } catch (altError) {
        await this.log(`Admin login failed: ${error.message}`, false);
        return;
      }
    }

    // Step 2: Test admin users endpoint
    try {
      await this.log('Fetching admin users data with activity tracking...');
      const usersResponse = await this.makeRequest('GET', '/api/admin/users');
      
      if (usersResponse.status === 200) {
        const users = usersResponse.data;
        await this.log(`Retrieved ${users.length} users from admin panel`);
        
        // Analyze activity data
        const activeUsers = users.filter(user => user.isOnline);
        const offlineUsers = users.filter(user => !user.isOnline);
        
        await this.log(`Active users: ${activeUsers.length}`);
        await this.log(`Offline users: ${offlineUsers.length}`);
        
        // Display detailed user status
        for (const user of users) {
          const status = user.isOnline ? 'ACTIVE' : 'OFFLINE';
          const lastSeen = user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never';
          await this.log(`  ${user.username}: ${status} (Last seen: ${lastSeen})`);
        }
      }
    } catch (error) {
      await this.log(`Admin users endpoint failed: ${error.message}`, false);
    }

    // Step 3: Test activity status debugging endpoint
    try {
      await this.log('Testing activity tracker debugging endpoint...');
      const activityResponse = await this.makeRequest('GET', '/api/admin/activity-status');
      
      if (activityResponse.status === 200) {
        const activityData = activityResponse.data;
        await this.log('Activity tracker status retrieved successfully');
        await this.log(`Total active sessions: ${activityData.summary.totalActive}`);
        await this.log(`Total tracked sessions: ${activityData.summary.totalTracked}`);
        await this.log(`Active users: ${activityData.summary.activeUsers.join(', ') || 'None'}`);
        
        // Display detailed session info
        for (const session of activityData.activeUsers) {
          const timeSince = Math.round(session.timeSinceLastActivity / 1000);
          await this.log(`  ${session.username}: Active ${timeSince}s ago`);
        }
      }
    } catch (error) {
      await this.log(`Activity status endpoint failed: ${error.message}`, false);
    }

    // Step 4: Test user activity by making multiple requests
    try {
      await this.log('Testing activity tracking with multiple requests...');
      
      for (let i = 1; i <= 3; i++) {
        await this.makeRequest('GET', '/api/user');
        await this.log(`Request ${i}: User activity should be tracked`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
      
      await this.log('Multiple requests completed - activity should be updated');
    } catch (error) {
      await this.log(`Activity tracking test failed: ${error.message}`, false);
    }

    // Step 5: Final verification
    try {
      await this.log('Final verification of activity tracking...');
      const finalUsersResponse = await this.makeRequest('GET', '/api/admin/users');
      
      if (finalUsersResponse.status === 200) {
        const users = finalUsersResponse.data;
        const currentUser = users.find(u => u.username === 'shadowHimel');
        
        if (currentUser) {
          const status = currentUser.isOnline ? 'ACTIVE' : 'OFFLINE';
          await this.log(`Current user status: ${status}`);
          
          if (currentUser.isOnline) {
            await this.log('🎉 PERFECT! Activity tracking is working correctly');
          } else {
            await this.log('⚠️ User should be active but shows as offline', false);
          }
        }
      }
    } catch (error) {
      await this.log(`Final verification failed: ${error.message}`, false);
    }

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    const successful = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    console.log(`Successful tests: ${successful}/${total}`);
    
    if (successful === total) {
      console.log('🏆 ALL TESTS PASSED - ACTIVITY TRACKING IS PERFECT!');
    } else {
      console.log('❌ Some tests failed - system needs refinement');
    }
  }
}

// Run the test
const tester = new PerfectActivityTester();
tester.testPerfectActivitySystem().catch(console.error);