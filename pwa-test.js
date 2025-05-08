const { execSync } = require('child_process');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== Task Manager PWA Test Tool ===${colors.reset}\n`);

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

const localIp = getLocalIpAddress();

console.log(`${colors.yellow}Starting development server for PWA testing...${colors.reset}`);
console.log(`Your local IP address is: ${colors.bright}${localIp}${colors.reset}\n`);

console.log(`${colors.green}Server starting at: ${colors.bright}http://${localIp}:3000${colors.reset}`);
console.log(`${colors.yellow}On your Android phone:${colors.reset}`);
console.log(`1. Open Chrome and go to: ${colors.bright}http://${localIp}:3000${colors.reset}`);
console.log(`2. Use the app for a few seconds`);
console.log(`3. Tap the menu (three dots) and select "Install app" or "Add to Home Screen"`);
console.log(`4. After installation, open the app from your home screen`);
console.log(`5. Test offline functionality by enabling airplane mode on your phone\n`);

console.log(`${colors.bright}${colors.cyan}Verifying Proper Installation:${colors.reset}`);
console.log(`When properly installed, the app should:`);
console.log(`- Open in its own window (not in the browser)`);
console.log(`- Not show any browser address bar or navigation controls`);
console.log(`- Display "Installed App" indicator in the top-right corner`);
console.log(`- Show a notification saying "App successfully installed!"`);
console.log(`- Work offline with full functionality\n`);

console.log(`${colors.bright}${colors.yellow}Troubleshooting:${colors.reset}`);
console.log(`If the app doesn't install properly:`);
console.log(`1. Make sure you're using Chrome (version 76 or later)`);
console.log(`2. Try clearing Chrome's cache and data`);
console.log(`3. See INSTALL_GUIDE.md for detailed troubleshooting steps\n`);

console.log(`${colors.yellow}Press Ctrl+C when you're done testing${colors.reset}\n`);

try {
  // Start the development server
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
}