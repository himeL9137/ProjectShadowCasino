// Script to create Notion databases and sample data
const { exec } = require('child_process');
const path = require('path');

console.log('Starting Notion setup script...');

// Path to the setup script
const setupScriptPath = path.join(process.cwd(), 'server', 'setup-notion.ts');

// Run the script using tsx
const child = exec(`npx tsx ${setupScriptPath}`);

child.stdout.on('data', (data) => {
  console.log(`Setup output: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`Setup error: ${data}`);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('Notion setup completed successfully');
  } else {
    console.error(`Notion setup failed with code ${code}`);
  }
});