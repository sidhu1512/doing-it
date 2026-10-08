const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
let pngToIco = require('png-to-ico');
if (pngToIco && pngToIco.default) pngToIco = pngToIco.default;

async function generate() {
  const rootDir = path.resolve(__dirname, '..');
  const iconSrc = path.join(rootDir, 'assets', 'icon.png');
  const docsAssetsDir = path.join(rootDir, 'docs', 'assets');
  const docsDir = path.join(rootDir, 'docs');

  if (!fs.existsSync(docsAssetsDir)) {
    fs.mkdirSync(docsAssetsDir, { recursive: true });
  }

  console.log('Reading canonical icon:', iconSrc);
  const { data, info } = await sharp(iconSrc)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const numPixels = info.width * info.height;

  // 1. Generate White Icon (For Dark Theme / Dark Tabs)
  const whiteData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    whiteData[i] = 255;     // R
    whiteData[i + 1] = 255; // G
    whiteData[i + 2] = 255; // B
    whiteData[i + 3] = a;   // Alpha
  }

  // 2. Generate Charcoal Icon (For Light Theme / Light Tabs)
  const darkData = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    darkData[i] = 24;     // #18181b
    darkData[i + 1] = 24;
    darkData[i + 2] = 27;
    darkData[i + 3] = a;
  }

  const whiteMasterBuf = await sharp(whiteData, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  const darkMasterBuf = await sharp(darkData, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  // Save 512x512 masters
  const white512Buf = await sharp(whiteMasterBuf).resize(512, 512, { fit: 'contain' }).png().toBuffer();
  const dark512Buf = await sharp(darkMasterBuf).resize(512, 512, { fit: 'contain' }).png().toBuffer();

  fs.writeFileSync(path.join(docsAssetsDir, 'favicon-dark.png'), white512Buf);
  fs.writeFileSync(path.join(docsAssetsDir, 'favicon-light.png'), dark512Buf);

  // Sizes to generate
  const sizes = [16, 32, 48, 180];
  const darkThemePngPaths = [];
  const lightThemePngPaths = [];

  for (const s of sizes) {
    const wBuf = await sharp(whiteMasterBuf).resize(s, s, { fit: 'contain' }).png().toBuffer();
    const dBuf = await sharp(darkMasterBuf).resize(s, s, { fit: 'contain' }).png().toBuffer();

    const wPath = path.join(docsAssetsDir, `favicon-dark-${s}x${s}.png`);
    const dPath = path.join(docsAssetsDir, `favicon-light-${s}x${s}.png`);

    fs.writeFileSync(wPath, wBuf);
    fs.writeFileSync(dPath, dBuf);

    if (s <= 48) {
      darkThemePngPaths.push(wPath);
      lightThemePngPaths.push(dPath);
    }

    if (s === 180) {
      fs.writeFileSync(path.join(docsAssetsDir, 'apple-touch-icon.png'), dBuf);
      fs.writeFileSync(path.join(docsAssetsDir, 'apple-touch-icon-dark.png'), wBuf);
    }

    // Also write standard names for light/fallback
    fs.writeFileSync(path.join(docsAssetsDir, `favicon-${s}x${s}.png`), dBuf);
    fs.writeFileSync(path.join(docsDir, `favicon-${s}x${s}.png`), dBuf);
    fs.writeFileSync(path.join(docsDir, `favicon-dark-${s}x${s}.png`), wBuf);
  }

  // Generate ICO files
  console.log('Generating ICO files...');
  const darkIcoBuf = await pngToIco(darkThemePngPaths);
  const lightIcoBuf = await pngToIco(lightThemePngPaths);

  fs.writeFileSync(path.join(docsDir, 'favicon-dark.ico'), darkIcoBuf);
  fs.writeFileSync(path.join(docsDir, 'favicon-light.ico'), lightIcoBuf);
  fs.writeFileSync(path.join(docsDir, 'favicon.ico'), darkIcoBuf); // default to dark-theme white icon for standard root

  // Generate SVG Favicons
  console.log('Generating SVG Favicons...');
  const whiteB64 = white512Buf.toString('base64');
  const darkB64 = dark512Buf.toString('base64');

  // 1. Pure White SVG (for Dark Theme)
  const svgDarkTheme = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,${whiteB64}" />
</svg>`;
  fs.writeFileSync(path.join(docsAssetsDir, 'favicon-dark.svg'), svgDarkTheme);

  // 2. Pure Charcoal SVG (for Light Theme)
  const svgLightTheme = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,${darkB64}" />
</svg>`;
  fs.writeFileSync(path.join(docsAssetsDir, 'favicon-light.svg'), svgLightTheme);

  // 3. Adaptive SVG (evaluates prefers-color-scheme)
  const svgAdaptive = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <style>
    .brain-light { display: none; }
    .brain-dark { display: block; }
    @media (prefers-color-scheme: dark) {
      .brain-light { display: block !important; }
      .brain-dark { display: none !important; }
    }
  </style>
  <!-- Light theme tab: dark icon -->
  <g class="brain-dark">
    <image width="512" height="512" href="data:image/png;base64,${darkB64}" />
  </g>
  <!-- Dark theme tab: white icon -->
  <g class="brain-light">
    <image width="512" height="512" href="data:image/png;base64,${whiteB64}" />
  </g>
</svg>`;
  fs.writeFileSync(path.join(docsAssetsDir, 'favicon.svg'), svgAdaptive);
  fs.writeFileSync(path.join(docsDir, 'favicon.svg'), svgAdaptive);
  fs.writeFileSync(path.join(docsDir, 'favicon-dark.svg'), svgDarkTheme);
  fs.writeFileSync(path.join(docsDir, 'favicon-light.svg'), svgLightTheme);

  console.log('All favicon assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
