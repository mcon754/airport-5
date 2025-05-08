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

console.log(`${colors.bright}${colors.cyan}=== Installing Deployment Dependencies ===${colors.reset}\n`);

// Install gh-pages package
console.log(`${colors.yellow}Installing gh-pages package for GitHub Pages deployment...${colors.reset}`);
try {
  execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
  console.log(`${colors.green}✓ gh-pages package installed successfully${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to install gh-pages: ${error.message}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.bright}${colors.green}Deployment dependencies installed successfully!${colors.reset}`);
console.log(`
${colors.bright}Next steps:${colors.reset}

1. ${colors.yellow}Set your repository URL in package.json:${colors.reset}
   Add this line to your package.json:
   ${colors.cyan}"homepage": "https://yourusername.github.io/repo-name"${colors.reset}

2. ${colors.yellow}Deploy your app:${colors.reset}
   Run: ${colors.cyan}npm run deploy${colors.reset}

3. ${colors.yellow}Install on your Android phone:${colors.reset}
   - Open Chrome on your Android device
   - Navigate to your deployed app URL
   - Use the app for a few seconds
   - Chrome should show a prompt "Add to Home Screen"
   - If not, tap the menu (three dots) and select "Add to Home Screen"
   - Confirm the installation
`);