const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function buildHero() {
  const width = 1920;
  const height = 1080;

  // 1. Create elegant dark background matching GitHub profile dark mode
  const bgSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#161e2e" stop-opacity="0.9" />
          <stop offset="45%" stop-color="#0e131f" stop-opacity="0.98" />
          <stop offset="100%" stop-color="#080a0f" stop-opacity="1" />
        </radialGradient>
        <radialGradient id="spotlight" cx="50%" cy="25%" r="45%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.14" />
          <stop offset="60%" stop-color="#1d4ed8" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#080a0f" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#glow)" />
      <rect width="100%" height="100%" fill="url(#spotlight)" />
    </svg>
  `);

  const bg = await sharp(bgSvg).png().toBuffer();

  const imgDir = path.resolve(__dirname, '../docs/imgs');

  // Load and resize high-DPI captures
  // Center window: Tasks view
  const tasksBuf = await sharp(path.join(imgDir, 'tasks-view.png'))
    .resize(620, 864, { fit: 'contain' })
    .png()
    .toBuffer();

  // Left window: Day One Diary
  const diaryBuf = await sharp(path.join(imgDir, 'diary-view.png'))
    .resize(560, 780, { fit: 'contain' })
    .png()
    .toBuffer();

  // Right window: Circadian Rhythm Analytics
  const statsBuf = await sharp(path.join(imgDir, 'analytics-view.png'))
    .resize(560, 780, { fit: 'contain' })
    .png()
    .toBuffer();

  // Quick Add Overlay
  const quickAddBuf = await sharp(path.join(imgDir, 'quick-add.png'))
    .resize(720, 91, { fit: 'contain' })
    .png()
    .toBuffer();

  // Mini-Timer PiP
  const miniTimerBuf = await sharp(path.join(imgDir, 'mini-timer.png'))
    .resize(290, 52, { fit: 'contain' })
    .png()
    .toBuffer();

  const targetPath = path.resolve(__dirname, '../../profile-repo/img/doing-it.png');

  // Composite: Left Diary, Right Analytics, Center Tasks (in front), Quick Add (floating bottom)
  await sharp(bg)
    .composite([
      { input: diaryBuf, top: 155, left: 110 },
      { input: statsBuf, top: 155, left: 1250 },
      { input: tasksBuf, top: 110, left: 650 },
      { input: quickAddBuf, top: 925, left: 600 },
      { input: miniTimerBuf, top: 935, left: 1470 }
    ])
    .png({ quality: 95 })
    .toFile(targetPath);

  console.log('Successfully generated profile showcase:', targetPath);
}

buildHero().catch(err => {
  console.error('Error generating profile showcase:', err);
  process.exit(1);
});
