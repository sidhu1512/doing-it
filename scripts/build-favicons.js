const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoRaw = require('png-to-ico');
const pngToIco = pngToIcoRaw.default || pngToIcoRaw;

const projectRoot = path.resolve(__dirname, '..');
const docsAssets = path.join(projectRoot, 'docs', 'assets');
const docsDir = path.join(projectRoot, 'docs');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="50%" stop-color="#0a101f"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- High-Contrast Obsidian Squircle -->
  <rect x="18" y="18" width="476" height="476" rx="118" fill="url(#bgGrad)" stroke="#38bdf8" stroke-width="18"/>
  <rect x="36" y="36" width="440" height="440" rx="100" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>

  <!-- Left Organic Brain (Brilliant Crisp White) -->
  <g fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 230 110 C 160 110 96 156 96 236 C 96 280 126 310 148 322 C 116 344 106 384 136 414 C 166 438 210 422 230 402" />
    <path d="M 230 186 C 176 186 150 216 156 256 C 162 292 200 300 230 300" />
    <path d="M 230 354 C 188 354 172 334 166 312" />
  </g>

  <!-- Center Seam Line -->
  <line x1="256" y1="92" x2="256" y2="420" stroke="rgba(56, 189, 248, 0.45)" stroke-width="8" stroke-dasharray="14 14" stroke-linecap="round"/>

  <!-- Right Neural Net (Electric Neon Cyan) -->
  <g fill="none" stroke="#38bdf8" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 282 110 C 352 110 416 156 416 236 C 416 280 386 310 364 322 C 396 344 406 384 376 414 C 346 438 302 422 282 402" />
    <line x1="282" y1="186" x2="354" y2="216" />
    <line x1="354" y1="216" x2="332" y2="296" />
    <line x1="332" y1="296" x2="282" y2="300" />
    <line x1="354" y1="216" x2="394" y2="266" />
    <line x1="332" y1="296" x2="354" y2="366" />
    <line x1="354" y1="366" x2="282" y2="354" />
  </g>

  <!-- Synapse Node Centers -->
  <g fill="#38bdf8">
    <circle cx="282" cy="110" r="16" fill="#ffffff"/>
    <circle cx="416" cy="236" r="16" fill="#38bdf8"/>
    <circle cx="354" cy="216" r="18" fill="#ffffff"/>
    <circle cx="332" cy="296" r="16" fill="#38bdf8"/>
    <circle cx="394" cy="266" r="15" fill="#ffffff"/>
    <circle cx="376" cy="414" r="16" fill="#38bdf8"/>
    <circle cx="354" cy="366" r="17" fill="#ffffff"/>
    <circle cx="282" cy="402" r="16" fill="#38bdf8"/>
  </g>

  <!-- Center High-Energy Bolt / Focus Glyph -->
  <polygon points="256,180 290,260 250,260 264,332 222,266 250,266" fill="#ffffff" stroke="#38bdf8" stroke-width="4"/>
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
