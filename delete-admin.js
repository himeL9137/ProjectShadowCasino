
import fetch from 'node-fetch';

async function deleteAdminUser() {
  try {
    // First login as an admin to get authentication token
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Albab AJ',
        password: 'admin1122'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Admin login failed');
    }

    const { token } = await loginResponse.json();

    // Get all users to find shadowHimel2's ID
    const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const users = await usersResponse.json();
    const userToDelete = users.find(u => u.username === 'shadowHimel2');

    if (!userToDelete) {
      console.log('User shadowHimel2 not found');
      return;
    }

    // Delete the user
    const deleteResponse = await fetch(`http://localhost:5000/api/admin/users/${userToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.ok) {
      console.log('Successfully deleted user shadowHimel2');
    } else {
      console.log('Failed to delete user:', await deleteResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteAdminUser();
