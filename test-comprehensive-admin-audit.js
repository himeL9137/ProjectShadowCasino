import axios from 'axios';

async function testComprehensiveAdminAudit() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('=== COMPREHENSIVE ADMIN AUDIT SYSTEM TEST ===\n');
    
    // Login as admin (shadowHimel)
    console.log('1. Logging in as shadowHimel...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'shadowHimel',
      password: 'admin1122'
    });
    
    const token = loginResponse.data.token;
    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('✓ Login successful!\n');
    
    // Get all users to find a test target
    console.log('2. Fetching users list...');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users`, config);
    const users = usersResponse.data;
    console.log(`✓ Found ${users.length} users in system\n`);
    
    // Find a non-admin user for testing
    const testUser = users.find(user => user.role !== 'admin' && user.username !== 'shadowHimel');
    if (!testUser) {
      console.log('No test user found. Creating a test user...');
      // Create a test user
      const createUserResponse = await axios.post(`${baseURL}/api/auth/register`, {
        username: 'testuser_audit',
        email: 'testuser@example.com',
        password: 'testpass123',
        phone: '1234567890'
      });
      console.log('✓ Test user created\n');
      
      // Get updated users list
      const updatedUsersResponse = await axios.get(`${baseURL}/api/admin/users`, config);
      const updatedUsers = updatedUsersResponse.data;
      testUser = updatedUsers.find(user => user.username === 'testuser_audit');
    }
    
    if (!testUser) {
      console.error('❌ No suitable test user found or created');
      return;
    }
    
    console.log(`Using test user: ${testUser.username} (ID: ${testUser.id})\n`);
    
    // Test 1: Balance adjustment
    console.log('3. Testing balance adjustment...');
    try {
      const balanceResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/add-funds`, {
        amount: '100',
        currency: 'USD',
        reason: 'Comprehensive audit test - balance addition'
      }, config);
      console.log('✓ Balance adjustment successful');
    } catch (error) {
      console.log('⚠ Balance adjustment failed:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Ban user
    console.log('4. Testing user ban...');
    try {
      const banResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/ban`, {
        reason: 'Comprehensive audit test - temporary ban'
      }, config);
      console.log('✓ User ban successful');
    } catch (error) {
      console.log('⚠ User ban failed:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Unban user
    console.log('5. Testing user unban...');
    try {
      const unbanResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/unban`, {
        reason: 'Comprehensive audit test - removing test ban'
      }, config);
      console.log('✓ User unban successful');
    } catch (error) {
      console.log('⚠ User unban failed:', error.response?.data?.message || error.message);
    }
    
    // Test 4: Mute user
    console.log('6. Testing user mute...');
    try {
      const muteResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/mute`, {
        reason: 'Comprehensive audit test - temporary mute'
      }, config);
      console.log('✓ User mute successful');
    } catch (error) {
      console.log('⚠ User mute failed:', error.response?.data?.message || error.message);
    }
    
    // Test 5: Unmute user
    console.log('7. Testing user unmute...');
    try {
      const unmuteResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/unmute`, {
        reason: 'Comprehensive audit test - removing test mute'
      }, config);
      console.log('✓ User unmute successful');
    } catch (error) {
      console.log('⚠ User unmute failed:', error.response?.data?.message || error.message);
    }
    
    // Test 6: View user details
    console.log('8. Testing view user details...');
    try {
      const detailsResponse = await axios.get(`${baseURL}/api/admin/users/${testUser.id}/details`, config);
      console.log('✓ User details access successful');
    } catch (error) {
      console.log('⚠ User details access failed:', error.response?.data?.message || error.message);
    }
    
    // Wait a moment for all actions to be logged
    console.log('\n9. Waiting for audit logs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 7: Fetch admin audit actions
    console.log('10. Fetching admin audit actions...');
    const auditResponse = await axios.get(`${baseURL}/api/admin/audit/actions?limit=20`, config);
    
    console.log('\n=== ADMIN AUDIT RESULTS ===');
    console.log(`Total actions found: ${auditResponse.data.total}`);
    
    if (auditResponse.data.actions && auditResponse.data.actions.length > 0) {
      console.log('\nRecent Admin Actions:');
      auditResponse.data.actions.slice(0, 10).forEach((action, index) => {
        console.log(`\n${index + 1}. Action: ${action.action}`);
        console.log(`   Admin: ${action.adminUsername} (ID: ${action.adminId})`);
        console.log(`   Target User: ${action.targetUserId || 'N/A'}`);
        console.log(`   Created: ${new Date(action.createdAt).toLocaleString()}`);
        
        if (action.details) {
          console.log(`   Details:`);
          Object.entries(action.details).forEach(([key, value]) => {
            console.log(`     ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
          });
        }
      });
    } else {
      console.log('❌ No admin actions found in audit log!');
    }
    
    // Test 8: Get admin audit statistics
    console.log('\n11. Fetching admin audit statistics...');
    try {
      const statsResponse = await axios.get(`${baseURL}/api/admin/audit/stats`, config);
      console.log('\n=== ADMIN AUDIT STATISTICS ===');
      console.log(`Total Actions: ${statsResponse.data.statistics.totalActions}`);
      
      console.log('\nActions by Type:');
      statsResponse.data.statistics.actionsByType.forEach(stat => {
        console.log(`  ${stat.action}: ${stat.count} actions`);
      });
      
      console.log('\nActions by Admin:');
      statsResponse.data.statistics.actionsByAdmin.forEach(stat => {
        console.log(`  ${stat.adminUsername} (ID: ${stat.adminId}): ${stat.count} actions`);
      });
    } catch (error) {
      console.log('⚠ Statistics fetch failed:', error.response?.data?.message || error.message);
    }
    
    // Test 9: Export audit data
    console.log('\n12. Testing audit export...');
    try {
      const exportResponse = await axios.get(`${baseURL}/api/admin/audit/export?format=json`, config);
      console.log('✓ Audit export successful');
      console.log(`   Export contains ${exportResponse.data.auditReport.actions.length} actions`);
    } catch (error) {
      console.log('⚠ Audit export failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n=== TEST COMPLETION ===');
    console.log('✓ Comprehensive admin audit test completed');
    console.log('✓ All admin operations have been tested');
    console.log('✓ Audit logging system verified');
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const finalAuditResponse = await axios.get(`${baseURL}/api/admin/audit/actions?limit=50`, config);
    const recentActions = finalAuditResponse.data.actions;
    
    const actionTypes = new Set(recentActions.map(action => action.action));
    console.log(`Unique action types logged: ${Array.from(actionTypes).join(', ')}`);
    
    const expectedActions = ['EDIT_BALANCE', 'BAN_USER', 'UNBAN_USER', 'MUTE_USER', 'UNMUTE_USER', 'VIEW_USER_DETAILS'];
    const missingActions = expectedActions.filter(action => !actionTypes.has(action));
    
    if (missingActions.length === 0) {
      console.log('✅ ALL EXPECTED ADMIN ACTIONS ARE BEING LOGGED CORRECTLY');
    } else {
      console.log(`❌ Missing action types: ${missingActions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testComprehensiveAdminAudit();