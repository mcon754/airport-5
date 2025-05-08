const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== Task Manager PWA Deployment Script ===${colors.reset}\n`);

// Step 1: Build the app
console.log(`${colors.yellow}Step 1: Building the app...${colors.reset}`);
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Build completed successfully${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 2: Copy service worker to build folder
console.log(`${colors.yellow}Step 2: Ensuring service worker is in build folder...${colors.reset}`);
try {
  fs.copyFileSync(
    path.join(__dirname, 'public', 'service-worker.js'),
    path.join(__dirname, 'build', 'service-worker.js')
  );
  console.log(`${colors.green}✓ Service worker copied to build folder${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to copy service worker: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 3: Provide deployment options
console.log(`${colors.bright}${colors.cyan}Deployment Options:${colors.reset}`);
console.log(`
1. ${colors.bright}Deploy to GitHub Pages:${colors.reset}
   - Install gh-pages: npm install --save-dev gh-pages
   - Add to package.json: "homepage": "https://yourusername.github.io/repo-name"
   - Add to package.json scripts: 
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   - Run: npm run deploy

2. ${colors.bright}Deploy to Netlify:${colors.reset}
   - Install Netlify CLI: npm install -g netlify-cli
   - Run: netlify deploy
   - Follow the prompts to deploy

3. ${colors.bright}Deploy to Firebase:${colors.reset}
   - Install Firebase tools: npm install -g firebase-tools
   - Run: firebase login
   - Run: firebase init hosting
   - Run: firebase deploy

4. ${colors.bright}Deploy to Vercel:${colors.reset}
   - Install Vercel CLI: npm install -g vercel
   - Run: vercel
   - Follow the prompts to deploy
`);

console.log(`${colors.bright}${colors.cyan}Installing on Android:${colors.reset}`);
console.log(`
1. Deploy your app using one of the methods above
2. Open Chrome on your Android device
3. Navigate to your deployed app URL
4. Use the app for a few seconds
5. Chrome should show a prompt "Add to Home Screen"
6. If not, tap the menu (three dots) and select "Add to Home Screen"
7. Confirm the installation
`);

console.log(`${colors.green}${colors.bright}Your PWA is ready to be deployed and installed!${colors.reset}`);