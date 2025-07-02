const fs = require('fs');

// Read the routes.ts file
const filePath = 'server/routes.ts';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Pattern to match admin routes with only isAdmin middleware
const pattern = /app\.(get|post|delete|put|patch)\("\/api\/admin\/[^"]+", isAdmin,/g;

// Replace with authenticateJWT middleware added
fileContent = fileContent.replace(pattern, (match, method) => {
  return `app.${method}("/api/admin/${match.split('/api/admin/')[1].replace('", isAdmin,', '", authenticateJWT, isAdmin,')}`; 
});

// Write the changes back to the file
fs.writeFileSync(filePath, fileContent);

console.log('Admin routes fixed successfully!');