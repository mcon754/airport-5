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

console.log(`${colors.bright}${colors.cyan}=== PWA Icon Generator ===${colors.reset}\n`);
console.log(`${colors.yellow}This script will help you generate proper icons for your PWA.${colors.reset}\n`);

// Check if ImageMagick is installed
let hasImageMagick = false;
try {
  execSync('magick --version', { stdio: 'ignore' });
  hasImageMagick = true;
} catch (e) {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    hasImageMagick = true;
  } catch (e) {
    console.log(`${colors.red}ImageMagick is not installed or not in your PATH.${colors.reset}`);
  }
}

// Instructions for generating icons
console.log(`${colors.bright}To generate proper PWA icons:${colors.reset}\n`);

if (hasImageMagick) {
  console.log(`${colors.green}ImageMagick is installed! You can use these commands:${colors.reset}\n`);
  
  console.log(`1. Generate a 192x192 icon:`);
  console.log(`   ${colors.cyan}magick convert -resize 192x192 your-source-image.png public/logo192.png${colors.reset}\n`);
  
  console.log(`2. Generate a 512x512 icon:`);
  console.log(`   ${colors.cyan}magick convert -resize 512x512 your-source-image.png public/logo512.png${colors.reset}\n`);
  
  console.log(`3. Generate a 64x64 favicon:`);
  console.log(`   ${colors.cyan}magick convert -resize 64x64 your-source-image.png public/favicon.ico${colors.reset}\n`);
} else {
  console.log(`${colors.yellow}Option 1: Install ImageMagick${colors.reset}`);
  console.log(`1. Download from https://imagemagick.org/script/download.php`);
  console.log(`2. After installation, run this script again\n`);
  
  console.log(`${colors.yellow}Option 2: Use an online tool${colors.reset}`);
  console.log(`1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator`);
  console.log(`2. Upload your source image`);
  console.log(`3. Download the generated icons`);
  console.log(`4. Place them in the public folder with these names:`);
  console.log(`   - logo192.png (192x192)`);
  console.log(`   - logo512.png (512x512)`);
  console.log(`   - favicon.ico (64x64)\n`);
}

console.log(`${colors.yellow}Option 3: Use a simple colored icon${colors.reset}`);
console.log(`If you don't have a source image, you can create a simple colored icon with this command:`);
console.log(`${colors.cyan}npm run generate:simple-icons${colors.reset}\n`);

// Function to create a simple colored icon
function createSimpleIcon() {
  console.log(`${colors.yellow}Creating simple colored icons...${colors.reset}`);
  
  // Create an HTML file that will generate the icons
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Simple Icon Generator</title>
  <style>
    body { margin: 0; padding: 0; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas192" width="192" height="192"></canvas>
  <canvas id="canvas512" width="512" height="512"></canvas>
  
  <script>
    // Function to draw a simple icon
    function drawIcon(canvas, size) {
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#4c97ea';
      ctx.fillRect(0, 0, size, size);
      
      // Task list icon
      ctx.fillStyle = 'white';
      
      // Draw three lines representing tasks
      const lineHeight = size * 0.1;
      const lineWidth = size * 0.6;
      const startX = size * 0.2;
      const startY = size * 0.3;
      const spacing = size * 0.15;
      
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(startX, startY + (i * spacing), lineWidth, lineHeight);
      }
      
      // Draw checkmark
      ctx.strokeStyle = 'white';
      ctx.lineWidth = size * 0.08;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(size * 0.3, size * 0.7);
      ctx.lineTo(size * 0.45, size * 0.85);
      ctx.lineTo(size * 0.7, size * 0.5);
      ctx.stroke();
    }
    
    // Draw icons
    drawIcon(document.getElementById('canvas192'), 192);
    drawIcon(document.getElementById('canvas512'), 512);
    
    // Download functions
    function downloadCanvas(canvas, filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Download after a short delay
    setTimeout(() => {
      downloadCanvas(document.getElementById('canvas192'), 'logo192.png');
      setTimeout(() => {
        downloadCanvas(document.getElementById('canvas512'), 'logo512.png');
        setTimeout(() => {
          alert('Icons generated! Move them to the public folder of your project.');
        }, 500);
      }, 500);
    }, 500);
  </script>
</body>
</html>
  `;
  
  // Write the HTML file
  fs.writeFileSync('icon-generator.html', htmlContent);
  
  console.log(`${colors.green}Created icon-generator.html${colors.reset}`);
  console.log(`${colors.yellow}Please open this file in your browser to generate and download the icons.${colors.reset}`);
  console.log(`${colors.yellow}After downloading, move the icons to the public folder.${colors.reset}`);
  
  // Try to open the file in the default browser
  try {
    const openCommand = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${openCommand} icon-generator.html`);
  } catch (e) {
    console.log(`${colors.yellow}Please open the file manually: ${path.resolve('icon-generator.html')}${colors.reset}`);
  }
}

// Check if the user wants to create simple icons
if (process.argv.includes('--create-simple-icons')) {
  createSimpleIcon();
}

console.log(`${colors.bright}${colors.cyan}After generating icons:${colors.reset}`);
console.log(`1. Place the icons in the public folder`);
console.log(`2. Restart your development server`);
console.log(`3. Try installing the PWA again\n`);

console.log(`${colors.bright}${colors.green}For more information, see INSTALL_GUIDE.md${colors.reset}`);