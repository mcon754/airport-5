const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Ensure the public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  console.error('Public directory not found. Make sure you run this script from the project root.');
  process.exit(1);
}

// Function to generate an icon with the airplane symbol
function generateIcon(size) {
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear with transparent background
  ctx.clearRect(0, 0, size, size);
  
  // Draw white circle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Add a subtle border to make the white circle visible on white backgrounds
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = size * 0.01;
  ctx.stroke();
  
  // Draw airplane symbol (50% bigger and centered)
  ctx.fillStyle = 'black';
  // Increase font size by 50% (from 0.5 to 0.75)
  ctx.font = `bold ${size * 0.75}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Position in the center, but moved down by 5%
  ctx.fillText('✈', size/2, size/2 + (size * 0.05));
  
  return canvas;
}

// Generate and save icons
async function generateIcons() {
  try {
    console.log('Generating icons with airplane symbol...');
    
    // Generate 192x192 icon
    const canvas192 = generateIcon(192);
    const buffer192 = canvas192.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'logo192.png'), buffer192);
    console.log('Created logo192.png');
    
    // Generate 512x512 icon
    const canvas512 = generateIcon(512);
    const buffer512 = canvas512.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'logo512.png'), buffer512);
    console.log('Created logo512.png');
    
    // Generate 64x64 icon for favicon
    // Note: This creates a PNG, you'll need to convert it to ICO format
    // For simplicity, we'll just create the PNG version
    const canvas64 = generateIcon(64);
    const buffer64 = canvas64.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, 'favicon64.png'), buffer64);
    console.log('Created favicon64.png (you\'ll need to convert this to ICO format)');
    
    console.log('\nIcon generation complete!');
    console.log('\nNOTE: To use these icons, you need to:');
    console.log('1. Convert favicon64.png to favicon.ico (using an online converter)');
    console.log('2. Replace the existing favicon.ico with your converted file');
    console.log('3. The PNG files (logo192.png and logo512.png) can be used directly');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons();