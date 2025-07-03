// Test script to verify user online status tracking
import fetch from 'node-fetch';

const BASE_URL = 'https://c8f2e524-7088-4fd3-9d93-e39442a2b581-00-3gce10ojecka5.pike.replit.dev';

async function testUserStatus() {
  console.log('Starting user status test...');
  
  try {
    // Create a new test user
    const newUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'password123',
      phone: '01234567890',
      firstName: 'Test',
      lastName: 'User',
      currency: 'USD'
    };
    
    console.log('Creating new user:', newUser.username);
    
    const registerResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser)
    });
    
    if (registerResponse.ok) {
      const cookie = registerResponse.headers.get('set-cookie');
      console.log('User created successfully');
      
      // Test admin endpoint to check user status
      const adminResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Cookie': 'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6InNoYWRvd0hpbWVsIiwiZW1haWwiOiJzaGFkb3dAZXhhbXBsZS5jb20iLCJwaG9uZSI6IjAxMjM0NTY3ODkwIiwicmF3UGFzc3dvcmQiOiJhZG1pbjExMjIiLCJiYWxhbmNlIjoiNjEwMjkuMDAiLCJjdXJyZW5jeSI6IkJEVCIsInJvbGUiOiJhZG1pbiIsImZpcnN0TmFtZSI6bnVsbCwibGFzdE5hbWUiOm51bGwsInByb2ZpbGVJbWFnZVVybCI6bnVsbCwiaXNNdXRlZCI6ZmFsc2UsImlzQmFubmVkIjpmYWxzZSwicHJvZmlsZVBpY3R1cmUiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjUtMDctMDNUMTY6MjA6MjUuODI4WiIsInVwZGF0ZWRBdCI6IjIwMjUtMDctMDNUMTY6MjA6MjUuODI4WiIsImlwQWRkcmVzcyI6bnVsbCwibGFzdExvZ2luIjpudWxsLCJyZWZlcnJhbENvZGUiOm51bGwsInJlZmVycmVkQnkiOm51bGwsInRvdGFsUmVmZXJyYWxzIjowLCJyZWZlcnJhbEVhcm5pbmdzIjoiMCIsImlzc3VlZEF0IjoxNzUxNTU5ODU2OTQ5LCJzZXNzaW9uSWQiOiJmOTRiNjkyMmJlMzk0NzlhMTJkYmRjZGM4ZGIwNTQ3YiIsImlhdCI6MTc1MTU1OTg1NiwiZXhwIjoxNzU0MTUxODU2fQ.pIkdG26vqB-8ZTPgptsBZKrxG7VOZeb0vyDLQ_HcrvI'
        }
      });
      
      if (adminResponse.ok) {
        const users = await adminResponse.json();
        console.log('Users with online status:');
        users.forEach(user => {
          console.log(`${user.username}: ${user.isOnline ? 'Online' : 'Offline'}`);
        });
      } else {
        console.error('Failed to fetch users:', adminResponse.status);
      }
      
    } else {
      console.error('Failed to create user:', registerResponse.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUserStatus();