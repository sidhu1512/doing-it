const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createSocialCard({ width, height, isOg = false }) {
  // SVG background with rich mesh gradients, typography, badges, and layout
  const title = "Doing It";
  const tagline = "Local-First Desktop Productivity Overlay";
  const desc = "Always-on-top tasks, markdown notes, Pomodoro focus timer,\ndaily journal, audio memos, and iCalendar sync.";
  
  // App icon as base64
  const iconPath = path.resolve(__dirname, '../assets/icon.png');
  const iconBuf = fs.readFileSync(iconPath);
  const iconBase64 = `data:image/png;base64,${iconBuf.toString('base64')}`;

  const leftPad = isOg ? 64 : 72;
  const mockRight = isOg ? 680 : 730;
  const mockWidth = isOg ? 440 : 470;
  const mockHeight = isOg ? 510 : 520;
  const mockTop = isOg ? 60 : 60;

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background Gradients -->
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07080c" />
          <stop offset="50%" stop-color="#0b0e17" />
          <stop offset="100%" stop-color="#08090e" />
        </linearGradient>

        <radialGradient id="cyanGlow" cx="20%" cy="30%" r="55%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18" />
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#07080c" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="violetGlow" cx="75%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.22" />
          <stop offset="60%" stop-color="#6366f1" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#07080c" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.03" />
        </linearGradient>

        <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2" />
        </linearGradient>

        <!-- Drop Shadows -->
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
        </filter>
        <filter id="glowSubtle" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#38bdf8" flood-opacity="0.25" />
        </filter>
      </defs>

      <!-- Canvas Base -->
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect width="100%" height="100%" fill="url(#cyanGlow)" />
      <rect width="100%" height="100%" fill="url(#violetGlow)" />

      <!-- Outer framing border -->
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" rx="0" />

      <!-- Grid Overlay lines subtle -->
      <g stroke="rgba(255,255,255,0.02)" stroke-width="1">
        <line x1="0" y1="160" x2="${width}" y2="160" />
        <line x1="0" y1="320" x2="${width}" y2="320" />
        <line x1="0" y1="480" x2="${width}" y2="480" />
        <line x1="320" y1="0" x2="320" y2="${height}" />
        <line x1="640" y1="0" x2="640" y2="${height}" />
        <line x1="960" y1="0" x2="960" y2="${height}" />
      </g>

      <!-- LEFT COLUMN: Brand, Title, Description, Feature Badges -->
      <!-- App Header Badge -->
      <g transform="translate(${leftPad}, 64)">
        <!-- App Icon -->
        <rect x="0" y="0" width="56" height="56" rx="14" fill="#ffffff" stroke="rgba(255,255,255,0.2)" stroke-width="1" filter="url(#glowSubtle)" />
        <image href="${iconBase64}" x="7" y="7" width="42" height="42" />

        <!-- Title -->
        <text x="70" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#ffffff" letter-spacing="-0.03em">Doing It</text>

        <!-- Release Pill -->
        <rect x="226" y="14" width="72" height="28" rx="14" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.3)" stroke-width="1" />
        <text x="262" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#38bdf8" text-anchor="middle">v4.4.0</text>
      </g>

      <!-- Tagline -->
      <text x="${leftPad}" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${isOg ? 28 : 30}" font-weight="700" fill="#f1f5f9" letter-spacing="-0.02em">
        ${tagline}
      </text>

      <!-- Description lines -->
      <text x="${leftPad}" y="214" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="400" fill="#94a3b8" letter-spacing="-0.01em">
        Always-on-top tasks, markdown scratchpad, Pomodoro timer,
      </text>
      <text x="${leftPad}" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="400" fill="#94a3b8" letter-spacing="-0.01em">
        daily journal, voice memos, and iCalendar sync.
      </text>

      <!-- Feature Pill Badges (Clean SVG Vector Icons, Zero Emojis) -->
      <g transform="translate(${leftPad}, 280)">
        <!-- Row 1 -->
        <g transform="translate(0, 0)">
          <rect width="144" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v8l-2 2v2z"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Always-On-Top</text>
        </g>
        <g transform="translate(154, 0)">
          <rect width="134" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Focus Timer</text>
        </g>
        <g transform="translate(298, 0)">
          <rect width="154" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Markdown Notes</text>
        </g>

        <!-- Row 2 -->
        <g transform="translate(0, 42)">
          <rect width="136" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Daily Journal</text>
        </g>
        <g transform="translate(146, 42)">
          <rect width="138" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Voice Memos</text>
        </g>
        <g transform="translate(294, 42)">
          <rect width="144" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Calendar Sync</text>
        </g>

        <!-- Row 3 -->
        <g transform="translate(0, 84)">
          <rect width="160" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Command Palette</text>
        </g>
        <g transform="translate(170, 84)">
          <rect width="136" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Rhythm Stats</text>
        </g>
        <g transform="translate(316, 84)">
          <rect width="144" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="url(#cardBorder)" stroke-width="1" />
          <svg x="12" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">Ambient Sound</text>
        </g>
      </g>

      <!-- Trust & Platform Footer Bar -->
      <g transform="translate(${leftPad}, ${height - 90})">
        <rect width="${isOg ? 570 : 610}" height="48" rx="12" fill="rgba(15, 23, 42, 0.65)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        
        <!-- Windows Icon & OS -->
        <g transform="translate(18, 14)">
          <svg width="20" height="20" viewBox="0 0 88 88" fill="#38bdf8">
            <path d="M0 12.4L35.7 7.5V41.7H0V12.4ZM35.7 46.2V80.4L0 75.5V46.2H35.7ZM40.7 6.8L87.8 0V41.7H40.7V6.8ZM87.8 46.2L40.7 87.9V46.2H87.8Z" />
          </svg>
          <text x="28" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#f8fafc">Windows 11 / 10</text>
        </g>

        <!-- Divider -->
        <line x1="165" y1="12" x2="165" y2="36" stroke="rgba(255,255,255,0.12)" stroke-width="1" />

        <!-- Offline & Local First -->
        <g transform="translate(178, 14)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <text x="24" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#38bdf8">Local-First</text>
        </g>

        <!-- Divider -->
        <line x1="285" y1="12" x2="285" y2="36" stroke="rgba(255,255,255,0.12)" stroke-width="1" />

        <!-- No Accounts -->
        <g transform="translate(300, 14)">
          <text x="0" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">No Accounts Required</text>
        </g>

        <!-- Divider -->
        <line x1="465" y1="12" x2="465" y2="36" stroke="rgba(255,255,255,0.12)" stroke-width="1" />

        <!-- MIT License -->
        <g transform="translate(480, 14)">
          <text x="0" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#10b981">MIT License</text>
        </g>
      </g>

      <!-- RIGHT COLUMN: Window Mockup Frame with glowing backlight -->
      <g transform="translate(${mockRight}, ${mockTop})">
        <!-- Backlight Glow behind window -->
        <rect x="-15" y="-15" width="${mockWidth + 30}" height="${mockHeight + 30}" rx="24" fill="rgba(56, 189, 248, 0.08)" filter="url(#glowSubtle)" />
        <rect x="-5" y="-5" width="${mockWidth + 10}" height="${mockHeight + 10}" rx="18" fill="rgba(139, 92, 246, 0.12)" />
        
        <!-- Outer window border frame -->
        <rect x="0" y="0" width="${mockWidth}" height="${mockHeight}" rx="16" fill="#0d111a" stroke="url(#cardBorder)" stroke-width="1.5" filter="url(#shadow)" />
      </g>
    </svg>
  `;

  // Render SVG background
  const bgBuffer = await sharp(Buffer.from(svgOverlay)).png().toBuffer();

  // Load and scale UI screenshot into the mockup area
  const imgDir = path.resolve(__dirname, '../docs/imgs');
  const tasksImgPath = path.join(imgDir, 'tasks-view.png');
  
  // Resize screenshot to fit nicely inside the mockup frame
  const screenshotW = mockWidth - 8;
  const screenshotH = mockHeight - 8;
  const screenshotBuf = await sharp(tasksImgPath)
    .resize(screenshotW, screenshotH, {
      fit: 'cover',
      position: 'top'
    })
    // Apply rounded corners to match the window frame
    .composite([{
      input: Buffer.from(`
        <svg width="${screenshotW}" height="${screenshotH}">
          <rect x="0" y="0" width="${screenshotW}" height="${screenshotH}" rx="12" fill="#fff" />
        </svg>
      `),
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // Composite screenshot over the mockup frame
  const finalCard = await sharp(bgBuffer)
    .composite([
      {
        input: screenshotBuf,
        top: mockTop + 4,
        left: mockRight + 4
      }
    ])
    .png({ quality: 95 })
    .toBuffer();

  return finalCard;
}

async function main() {
  console.log('Generating high-resolution social preview cards...');

  // 1. Social Preview for GitHub repo (1280x640)
  const socialPreviewBuf = await createSocialCard({ width: 1280, height: 640, isOg: false });
  
  // 2. Open Graph Card for Website / Twitter (1200x630)
  const ogCardBuf = await createSocialCard({ width: 1200, height: 630, isOg: true });

  // Save to assets and docs/assets
  const paths = [
    { dir: path.resolve(__dirname, '../assets'), name: 'social-preview.png', buf: socialPreviewBuf },
    { dir: path.resolve(__dirname, '../assets'), name: 'og-card.png', buf: ogCardBuf },
    { dir: path.resolve(__dirname, '../docs/assets'), name: 'social-preview.png', buf: socialPreviewBuf },
    { dir: path.resolve(__dirname, '../docs/assets'), name: 'og-card.png', buf: ogCardBuf },
    { dir: path.resolve(__dirname, '../docs/imgs'), name: 'og-card.png', buf: ogCardBuf }
  ];

  for (const item of paths) {
    if (!fs.existsSync(item.dir)) {
      fs.mkdirSync(item.dir, { recursive: true });
    }
    const fullPath = path.join(item.dir, item.name);
    fs.writeFileSync(fullPath, item.buf);
    console.log(`Saved: ${fullPath} (${item.buf.length} bytes)`);
  }

  console.log('Done generating all cards successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
