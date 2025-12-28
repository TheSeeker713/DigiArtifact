// Simple script to generate PWA icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create simple SVG-based icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// For now, create SVG files that can be used
// Note: PWA prefers PNG, but SVG works for most cases
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#cca43b"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="bold" fill="#0a0a0a" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>`;
  
  const svgPath = path.join(__dirname, '../public', `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created: icon-${size}.svg`);
});

console.log('\nNote: For production, convert these SVGs to PNGs using an image tool.');
console.log('For now, updating manifest to use SVG or fallback to logo.png');

