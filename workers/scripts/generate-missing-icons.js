// Generate missing icon-144.png and icon-192.png
// This script creates PNG icons from the existing logo.png or generates simple placeholders

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Check if logo.png exists to use as source
const logoPath = path.join(publicDir, 'logo.png');
const icon144Path = path.join(publicDir, 'icon-144.png');
const icon192Path = path.join(publicDir, 'icon-192.png');

// Simple approach: Create a script that uses canvas if available, or creates SVG-based PNGs
// For now, we'll create a simple Node script that can be run with node-canvas or sharp
// If those aren't available, we'll create a fallback

function createSimplePNG(size, outputPath) {
  // Create a simple base64-encoded PNG (1x1 transparent, then we'll use a proper method)
  // Actually, let's use a different approach - create SVG and convert, or use a library
  
  // For immediate fix: Create a simple script that can be run
  // The user can run this with node-canvas or we can provide an alternative
  
  console.log(`Would generate icon-${size}.png at ${outputPath}`);
  console.log('Note: Install sharp or canvas to generate actual PNGs');
  console.log('For now, updating references to use logo.png as fallback');
}

// Check what exists
const logoExists = fs.existsSync(logoPath);
const icon144Exists = fs.existsSync(icon144Path);
const icon192Exists = fs.existsSync(icon192Path);

console.log('Icon Status:');
console.log(`  logo.png: ${logoExists ? 'EXISTS' : 'MISSING'}`);
console.log(`  icon-144.png: ${icon144Exists ? 'EXISTS' : 'MISSING'}`);
console.log(`  icon-192.png: ${icon192Exists ? 'EXISTS' : 'MISSING'}`);

if (!icon144Exists || !icon192Exists) {
  console.log('\nGenerating missing icons...');
  
  // Try to use sharp if available
  try {
    const sharp = require('sharp');
    
    if (logoExists) {
      // Generate from logo.png
      if (!icon144Exists) {
        sharp(logoPath)
          .resize(144, 144, { fit: 'contain', background: { r: 204, g: 164, b: 59, alpha: 1 } })
          .toFile(icon144Path)
          .then(() => console.log('✓ Generated icon-144.png'))
          .catch(err => console.error('Error generating icon-144.png:', err));
      }
      
      if (!icon192Exists) {
        sharp(logoPath)
          .resize(192, 192, { fit: 'contain', background: { r: 204, g: 164, b: 59, alpha: 1 } })
          .toFile(icon192Path)
          .then(() => console.log('✓ Generated icon-192.png'))
          .catch(err => console.error('Error generating icon-192.png:', err));
      }
    } else {
      // Generate simple placeholder
      const createPlaceholder = (size, path) => {
        sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 204, g: 164, b: 59, alpha: 1 }
          }
        })
        .composite([{
          input: Buffer.from(`
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
              <rect width="${size}" height="${size}" fill="#cca43b"/>
              <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="bold" fill="#0a0a0a" text-anchor="middle" dominant-baseline="middle">W</text>
            </svg>
          `),
          top: 0,
          left: 0
        }])
        .png()
        .toFile(path)
        .then(() => console.log(`✓ Generated ${path}`))
        .catch(err => console.error(`Error generating ${path}:`, err));
      };
      
      if (!icon144Exists) createPlaceholder(144, icon144Path);
      if (!icon192Exists) createPlaceholder(192, icon192Path);
    }
  } catch (err) {
    // Fallback: Create simple SVG files that can be converted later
    console.log('Sharp not available. Creating SVG placeholders...');
    
    const createSVGIcon = (size, outputPath) => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#cca43b"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="bold" fill="#0a0a0a" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>`;
      fs.writeFileSync(outputPath.replace('.png', '.svg'), svg);
      console.log(`Created ${outputPath.replace('.png', '.svg')} (convert to PNG manually)`);
    };
    
    if (!icon144Exists) createSVGIcon(144, icon144Path);
    if (!icon192Exists) createSVGIcon(192, icon192Path);
    
    console.log('\nTo generate PNGs:');
    console.log('1. Install sharp: npm install sharp');
    console.log('2. Or use an online SVG to PNG converter');
    console.log('3. Or update manifest.json to use logo.png for these sizes');
  }
}

console.log('\nDone!');

