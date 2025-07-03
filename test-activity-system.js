const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testActivitySystem() {
  console.log('🔍 Testing User Activity Tracking System...\n');
  
  try {
    // Test 1: Try to login with different credentials to check system
    console.log('1. Testing authentication and user tracking...');
    
    const curlLogin = `curl -s -X POST http://localhost:5000/api/login \
      -H "Content-Type: application/json" \
      -d '{"username":"testuser","password":"testpass"}' \
      -c test_cookies.txt -w "%{http_code}"`;
    
    const loginResult = await execAsync(curlLogin);
    console.log('Login test result:', loginResult.stdout.trim());
    
    // Test 2: Check admin users endpoint without auth
    console.log('\n2. Testing admin users endpoint (should fail without auth)...');
    
    const curlAdminNoAuth = `curl -s http://localhost:5000/api/admin/users -w "%{http_code}"`;
    const noAuthResult = await execAsync(curlAdminNoAuth);
    console.log('No auth result:', noAuthResult.stdout.trim());
    
    // Test 3: Check activity tracker status
    console.log('\n3. Testing activity status endpoint...');
    
    const curlActivityNoAuth = `curl -s http://localhost:5000/api/admin/activity-status -w "%{http_code}"`;
    const activityResult = await execAsync(curlActivityNoAuth);
    console.log('Activity status (no auth):', activityResult.stdout.trim());
    
    // Test 4: Check what users exist
    console.log('\n4. Let me check the current server logs for user tracking...');
    console.log('✅ System tests completed. Checking application logs...');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testActivitySystem();