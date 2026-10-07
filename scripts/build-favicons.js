const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoRaw = require('png-to-ico');
const pngToIco = pngToIcoRaw.default || pngToIcoRaw;

const projectRoot = path.resolve(__dirname, '..');
const docsAssets = path.join(projectRoot, 'docs', 'assets');
const docsDir = path.join(projectRoot, 'docs');

// Ultra-high-contrast, razor-sharp vector favicon designed for 16x16 readability
// 1. High-contrast gradient background (Electric Cyan to Royal Indigo) with glowing border
// 2. Thick, bold geometry (60px strokes and solid fills) that maintain crisp 2px+ definition at 16x16
// 3. 0% sub-pixel blur - no soft filters that wash out at low resolutions
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#00f0ff"/>
    </linearGradient>
  </defs>

  <!-- High-Visibility Radiant Squircle with Cyan Rim -->
  <rect x="24" y="24" width="464" height="464" rx="124" fill="url(#favBg)"/>
  <rect x="24" y="24" width="464" height="464" rx="124" fill="none" stroke="#38bdf8" stroke-width="28"/>
  <rect x="42" y="42" width="428" height="428" rx="106" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="8"/>

  <!-- Left Organic Brain Arc (Bold Solid White - 52px stroke) -->
  <path d="M 230 115 C 145 115 88 170 88 256 C 88 305 120 340 148 355 C 120 380 118 415 145 435 C 180 455 220 425 230 405" 
        fill="none" stroke="#ffffff" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 225 200 C 165 200 145 230 152 265 C 160 295 195 305 225 305" 
        fill="none" stroke="#ffffff" stroke-width="48" stroke-linecap="round"/>

  <!-- Right Cyber Neural Matrix (Electric Cyan - 50px stroke) -->
  <path d="M 282 115 C 367 115 424 170 424 256 C 424 305 392 340 364 355 C 392 380 394 415 367 435 C 332 455 292 425 282 405" 
        fill="none" stroke="url(#neonCyan)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="282" y1="200" x2="355" y2="235" stroke="url(#neonCyan)" stroke-width="48" stroke-linecap="round"/>
  <line x1="355" y1="235" x2="330" y2="315" stroke="url(#neonCyan)" stroke-width="48" stroke-linecap="round"/>
  <line x1="330" y1="315" x2="282" y2="315" stroke="url(#neonCyan)" stroke-width="48" stroke-linecap="round"/>

  <!-- Center Focal High-Energy Bolt (Solid Crisp Filled Silhouette) -->
  <polygon points="256,90 310,230 250,230 274,380 190,260 240,260" fill="url(#boltGrad)" stroke="#0369a1" stroke-width="12" stroke-linejoin="round"/>

  <!-- High-Visibility Synapse Nodes -->
  <circle cx="282" cy="115" r="26" fill="#ffffff" stroke="#0284c7" stroke-width="8"/>
  <circle cx="424" cy="256" r="26" fill="#00f0ff" stroke="#ffffff" stroke-width="8"/>
  <circle cx="355" cy="235" r="28" fill="#ffffff" stroke="#00f0ff" stroke-width="8"/>
  <circle cx="367" cy="435" r="26" fill="#00f0ff" stroke="#ffffff" stroke-width="8"/>
</svg>`;

async function build() {
  console.log('Building high-contrast, razor-sharp vector favicon suite...');

  // 1. Write pure vector SVG to docs/assets/favicon.svg and docs/favicon.svg
  fs.writeFileSync(path.join(docsAssets, 'favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(docsDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✔ Pure vector SVG favicon written (zero base64 raster wraps)');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Render master 512x512 PNG
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(docsAssets, 'icon.png'), png512);
  fs.writeFileSync(path.join(docsDir, 'icon.png'), png512);
  fs.writeFileSync(path.join(projectRoot, 'assets', 'icon.png'), png512);
  console.log('✔ Master 512x512 icon.png rendered');

  // 3. Render 180x180 Apple Touch Icon
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(docsAssets, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(docsDir, 'apple-touch-icon.png'), png180);
  console.log('✔ 180x180 apple-touch-icon.png rendered');

  // 4. Render 48x48 PNG
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(docsAssets, 'favicon-48x48.png'), png48);
  fs.writeFileSync(path.join(docsDir, 'favicon-48x48.png'), png48);

  // 5. Render 32x32 PNG
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(docsAssets, 'favicon-32x32.png'), png32);
  fs.writeFileSync(path.join(docsDir, 'favicon-32x32.png'), png32);
  console.log('✔ 32x32 favicon-32x32.png rendered');

  // 6. Render 16x16 PNG
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  fs.writeFileSync(path.join(docsAssets, 'favicon-16x16.png'), png16);
  fs.writeFileSync(path.join(docsDir, 'favicon-16x16.png'), png16);
  console.log('✔ 16x16 favicon-16x16.png rendered');

  // 7. Multi-resolution ICO (16, 32, 48)
  const icoBuffer = await pngToIco([png16, png32, png48]);
  fs.writeFileSync(path.join(docsDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(docsAssets, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(projectRoot, 'assets', 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(projectRoot, 'build', 'icon.ico'), icoBuffer);
  console.log('✔ Multi-resolution favicon.ico (16/32/48) written to docs/favicon.ico and docs/assets/favicon.ico');

  console.log('🎉 Complete Favicon Suite generated successfully!');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
