const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const composePath = path.join(__dirname, 'compose.yaml');
const envPath = path.join(__dirname, 'client', '.env');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function openConnection(ip) {
  console.log(`Exposing BeaverIDE to local Wi-Fi at http://${ip}:5173...`);
  
  let composeContent = fs.readFileSync(composePath, 'utf8');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update compose.yaml ports and CLIENT_ORIGIN
  composeContent = composeContent
    .replace(/-\s+127\.0\.0\.1:3000:3000/g, '- 3000:3000')
    .replace(/-\s+127\.0\.0\.1:5173:5173/g, '- 5173:5173')
    .replace(/CLIENT_ORIGIN:\s*http:\/\/[^\s]+/g, `CLIENT_ORIGIN: http://${ip}:5173`);

  // Update client/.env VITE_API_URL
  envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=http://${ip}:3000`);

  fs.writeFileSync(composePath, composeContent, 'utf8');
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('Config files updated successfully. Starting containers...');
  execSync('docker compose down && docker compose up -d', { stdio: 'inherit' });
  console.log(`\n🎉 Expose Complete! Share this URL with collaborators:`);
  console.log(`👉 http://${ip}:5173\n`);
}

function closeConnection() {
  console.log('Restricting BeaverIDE back to localhost...');

  let composeContent = fs.readFileSync(composePath, 'utf8');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Revert compose.yaml ports and CLIENT_ORIGIN to localhost
  composeContent = composeContent
    .replace(/-\s+3000:3000/g, '- 127.0.0.1:3000:3000')
    .replace(/-\s+5173:5173/g, '- 127.0.0.1:5173:5173')
    .replace(/CLIENT_ORIGIN:\s*http:\/\/[^\s]+/g, 'CLIENT_ORIGIN: http://localhost:5173');

  // Revert client/.env VITE_API_URL to localhost
  envContent = envContent.replace(/VITE_API_URL=.*/g, 'VITE_API_URL=http://localhost:3000');

  fs.writeFileSync(composePath, composeContent, 'utf8');
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('Config files reverted successfully. Starting containers...');
  execSync('docker compose down && docker compose up -d', { stdio: 'inherit' });
  console.log('\n🔒 Restricted to localhost successfully!\n');
}

// Main execution block
const ip = getLocalIp();
if (ip === 'localhost') {
  console.error('Error: Could not determine local Wi-Fi IP address.');
  process.exit(1);
}

// 1. Expose connection
openConnection(ip);

console.log('------------------------------------------------------------');
console.log('Press [Ctrl + C] to stop sharing and restore localhost mode.');
console.log('------------------------------------------------------------');

// Keep process running
const interval = setInterval(() => {}, 1000);

let isCleaningUp = false;
function handleExit() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  clearInterval(interval);
  closeConnection();
  process.exit(0);
}

// Capture interrupts
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
