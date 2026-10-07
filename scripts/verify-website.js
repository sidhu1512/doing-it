const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');

function checkFile(relPath, minSize = 1) {
  const fullPath = path.join(docsDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
  const size = fs.statSync(fullPath).size;
  if (size < minSize) {
    throw new Error(`File ${relPath} is suspiciously small: ${size} bytes`);
  }
  console.log(`✔ Verified ${relPath} (${size} bytes)`);
}

console.log('--- 1. Checking Core Files ---');
checkFile('index.html', 5000);
checkFile('styles.css', 5000);
checkFile('app.js', 3000);

console.log('\n--- 2. Checking Favicon Suite ---');
checkFile('favicon.ico', 1000);
checkFile('favicon.svg', 500);
checkFile('assets/favicon.ico', 1000);
checkFile('assets/favicon.svg', 500);
checkFile('assets/favicon-32x32.png', 500);
checkFile('assets/favicon-16x16.png', 300);
checkFile('assets/apple-touch-icon.png', 1000);
checkFile('assets/icon.png', 1000);

console.log('\n--- 3. Checking All App Screenshots ---');
const requiredImgs = [
  'tasks-view.png',
  'diary-view.png',
  'analytics-view.png',
  'focus-view.png',
  'notes-view.png',
  'planner-view.png',
  'settings-view.png',
  'palette-view.png',
  'mini-timer.png',
  'quick-add.png',
  'fab-overlay.png'
];

requiredImgs.forEach(img => {
  checkFile(path.join('imgs', img), 1000);
});

console.log('\n--- 4. Checking Screen Recording Videos ---');
checkFile('assets/app-tour.webm', 100000);
checkFile('assets/hero-loop.webm', 100000);

console.log('\n--- 5. Checking HTML Links & Integrity ---');
const html = fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8');

// Check that favicon links in HTML point to existing files
const linkMatches = html.matchAll(/href="([^"#][^"]+)"/g);
for (const match of linkMatches) {
  const href = match[1];
  if (!href.startsWith('http') && !href.startsWith('data:')) {
    const assetPath = path.join(docsDir, href.split('?')[0]);
    if (!fs.existsSync(assetPath)) {
      throw new Error(`Broken local link in index.html: href="${href}" -> ${assetPath} does not exist`);
    }
  }
}
console.log('✔ All relative <a href> and <link href> targets exist on disk');

// Check that all image sources in HTML exist
const imgMatches = html.matchAll(/src="([^"#][^"]+)"/g);
for (const match of imgMatches) {
  const src = match[1];
  if (!src.startsWith('http') && !src.startsWith('data:')) {
    const assetPath = path.join(docsDir, src.split('?')[0]);
    if (!fs.existsSync(assetPath)) {
      throw new Error(`Broken image source in index.html: src="${src}" -> ${assetPath} does not exist`);
    }
  }
}
console.log('✔ All relative <img src> targets exist on disk');

// Check that favicon.svg contains ZERO raster base64 wraps
const svgContent = fs.readFileSync(path.join(docsDir, 'assets', 'favicon.svg'), 'utf8');
if (svgContent.includes('data:image/png;base64') || svgContent.includes('<image')) {
  throw new Error('FAIL: favicon.svg contains a raster <image> wrapper! Must be 100% pure vector XML.');
}
console.log('✔ Pure vector SVG favicon confirmed (zero base64 raster wraps)');

console.log('\n🎉 ALL WEBSITE STATIC CHECKS PASSED PERFECTLY!');
