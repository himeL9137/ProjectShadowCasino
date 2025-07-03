import axios from 'axios';

async function testAdminAudit() {
  const baseURL = 'http://localhost:5000';
  
  try {
    // Login as admin
    console.log('Logging in as shadowHimel...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'shadowHimel',
      password: 'admin1122'
    });
    
    const token = loginResponse.data.token;
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    console.log('Login successful!');
    
    // Perform an admin action (add funds to a test user)
    console.log('\nPerforming admin action (adding funds)...');
    try {
      const addFundsResponse = await axios.post(`${baseURL}/api/admin/users/2/add-funds`, {
        amount: 100,
        currency: 'USD',
        reason: 'Test admin action for audit trail'
      }, config);
      
      console.log('Funds added successfully:', addFundsResponse.data.message);
    } catch (error) {
      console.log('Add funds error:', error.response?.data?.message || error.message);
    }
    
    // Fetch admin audit actions
    console.log('\nFetching admin audit actions...');
    const auditResponse = await axios.get(`${baseURL}/api/admin/audit/actions?limit=10`, config);
    
    console.log('\nAdmin Actions Found:', auditResponse.data.total);
    console.log('\nRecent Admin Actions:');
    
    auditResponse.data.actions.forEach((action, index) => {
      console.log(`\n${index + 1}. Action: ${action.action}`);
      console.log(`   Admin: ${action.adminUsername} (ID: ${action.adminId})`);
      console.log(`   Target User: ${action.targetUserId || 'N/A'}`);
      console.log(`   Details:`, JSON.stringify(action.details, null, 2));
      console.log(`   Created At: ${new Date(action.createdAt).toLocaleString()}`);
    });
    
    // Get statistics
    console.log('\n\nFetching admin audit statistics...');
    const statsResponse = await axios.get(`${baseURL}/api/admin/audit/stats`, config);
    
    console.log('\nAdmin Action Statistics:');
    console.log('Total Actions:', statsResponse.data.statistics.totalActions);
    console.log('\nActions by Type:');
    statsResponse.data.statistics.actionsByType.forEach(stat => {
      console.log(`  ${stat.action}: ${stat.count}`);
    });
    console.log('\nActions by Admin:');
    statsResponse.data.statistics.actionsByAdmin.forEach(stat => {
      console.log(`  ${stat.adminUsername} (ID: ${stat.adminId}): ${stat.count} actions`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAdminAudit();