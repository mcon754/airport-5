const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');
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

console.log(`${colors.bright}${colors.cyan}=== PWA Deployment Tool ===${colors.reset}\n`);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

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

// Main function
async function main() {
  try {
    // Ask for deployment type
    console.log(`${colors.yellow}Select deployment type:${colors.reset}`);
    console.log(`1. Local testing`);
    console.log(`2. GitHub Pages deployment`);
    
    const deployType = await prompt(`${colors.bright}Enter your choice (1 or 2): ${colors.reset}`);
    
    if (deployType === '1') {
      // Local testing
      await localTesting();
    } else if (deployType === '2') {
      // GitHub Pages deployment
      await githubDeployment();
    } else {
      console.log(`${colors.red}Invalid choice. Exiting.${colors.reset}`);
      return;
    }
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

// Local testing function
async function localTesting() {
  const localIp = getLocalIpAddress();
  
  console.log(`${colors.yellow}Starting development server for PWA testing...${colors.reset}`);
  console.log(`Your local IP address is: ${colors.bright}${localIp}${colors.reset}\n`);
  
  console.log(`${colors.green}Server starting at: ${colors.bright}http://${localIp}:3000${colors.reset}`);
  console.log(`${colors.yellow}On your mobile device:${colors.reset}`);
  console.log(`1. Open Chrome and go to: ${colors.bright}http://${localIp}:3000${colors.reset}`);
  console.log(`2. Use the app for a few seconds`);
  console.log(`3. Tap the menu (three dots) and select "Install app" or "Add to Home Screen"`);
  console.log(`4. After installation, open the app from your home screen`);
  console.log(`5. Test offline functionality by enabling airplane mode\n`);
  
  console.log(`${colors.bright}${colors.cyan}Verifying Proper Installation:${colors.reset}`);
  console.log(`When properly installed, the app should:`);
  console.log(`- Open in its own window (not in the browser)`);
  console.log(`- Not show any browser address bar or navigation controls`);
  console.log(`- Work offline with full functionality\n`);
  
  console.log(`${colors.yellow}Press Ctrl+C when you're done testing${colors.reset}\n`);
  
  try {
    // Start the development server
    execSync('npm start', { stdio: 'inherit' });
  } catch (error) {
    // This will be reached when the user presses Ctrl+C
    console.log(`\n${colors.green}Local testing completed.${colors.reset}`);
  }
}

// GitHub Pages deployment function
async function githubDeployment() {
  // Check if gh-pages is installed
  let hasGhPages = false;
  try {
    require.resolve('gh-pages');
    hasGhPages = true;
  } catch (e) {
    console.log(`${colors.yellow}Installing gh-pages package...${colors.reset}`);
    execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
    console.log(`${colors.green}gh-pages package installed successfully.${colors.reset}\n`);
  }

  // Get GitHub username
  console.log(`${colors.yellow}We need to set up your GitHub Pages URL in package.json${colors.reset}`);
  const username = await prompt(`${colors.bright}Enter your GitHub username: ${colors.reset}`);
  
  if (!username) {
    console.log(`${colors.red}GitHub username is required.${colors.reset}`);
    return;
  }
  
  // Update package.json
  console.log(`${colors.yellow}Updating package.json...${colors.reset}`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.homepage = `https://${username}.github.io/airport-5`;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log(`${colors.green}package.json updated with homepage: ${packageJson.homepage}${colors.reset}\n`);
  
  // Update manifest.json for GitHub Pages
  console.log(`${colors.yellow}Updating manifest.json for GitHub Pages...${colors.reset}`);
  const manifestJson = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  manifestJson.start_url = "/airport-5/";
  manifestJson.scope = "/airport-5/";
  fs.writeFileSync('public/manifest.json', JSON.stringify(manifestJson, null, 2));
  console.log(`${colors.green}manifest.json updated for GitHub Pages deployment${colors.reset}\n`);
  
  // Build the app
  console.log(`${colors.yellow}Building the app...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}Build completed successfully.${colors.reset}\n`);
  
  // Deploy to GitHub Pages
  console.log(`${colors.yellow}Deploying to GitHub Pages...${colors.reset}`);
  execSync('npx gh-pages -d build', { stdio: 'inherit' });
  console.log(`${colors.green}Deployment completed successfully!${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.cyan}Your app is now deployed to:${colors.reset}`);
  console.log(`${colors.bright}${packageJson.homepage}${colors.reset}\n`);
  
  console.log(`${colors.yellow}It may take a few minutes for the site to be available.${colors.reset}`);
  console.log(`${colors.yellow}Make sure you have enabled GitHub Pages in your repository settings:${colors.reset}`);
  console.log(`1. Go to your repository on GitHub`);
  console.log(`2. Click on "Settings" > "Pages"`);
  console.log(`3. Ensure the source is set to "gh-pages branch"\n`);
  
  console.log(`${colors.bright}${colors.cyan}To install the PWA on your device:${colors.reset}`);
  console.log(`1. Open Chrome on your device`);
  console.log(`2. Navigate to ${packageJson.homepage}`);
  console.log(`3. Tap the menu (three dots) and select "Install app" or "Add to Home Screen"`);
  console.log(`4. The app should now install properly as a standalone app\n`);
  
  console.log(`${colors.bright}${colors.green}Thank you for using the PWA Deployment Tool!${colors.reset}`);
}

// Run the main function
main();