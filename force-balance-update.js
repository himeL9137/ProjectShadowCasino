// Force update shadowHimel's balance in the running server
const http = require('http');

// Create a direct HTTP request to the running server's admin endpoint
const postData = JSON.stringify({
  newBalance: "100",
  currency: "BDT",
  reason: "Admin balance reduction as requested",
  confirmed: true
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/users/1/funds',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoic2hhZG93SGltZWwiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDkyMDQ0ODAuNDksImV4cCI6MTc0OTI5MDg4MC40OX0.lDAmF5kZhQLEYhVaXPx91OOJbVvIvjI6UrVHgO8d5xo'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Balance update request completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();