const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}=== GitHub Pages Deployment Tool ===${colors.reset}\n`);

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

// Main function
async function main() {
  try {
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
    
    console.log(`${colors.bright}${colors.cyan}To install the PWA on your Android device:${colors.reset}`);
    console.log(`1. Open Chrome on your Android device`);
    console.log(`2. Navigate to ${packageJson.homepage}`);
    console.log(`3. Tap the menu (three dots) and select "Install app" or "Add to Home Screen"`);
    console.log(`4. The app should now install properly as a standalone app\n`);
    
    console.log(`${colors.bright}${colors.green}Thank you for using the GitHub Pages Deployment Tool!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

// Run the main function
main();