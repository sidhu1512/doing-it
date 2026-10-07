const { app, BrowserWindow } = require('electron');
const path = require('path');

const docsIndexPath = path.resolve(__dirname, '..', 'docs', 'index.html');

const viewports = [
  { width: 320, height: 640, label: '320px (Mobile Small)' },
  { width: 375, height: 667, label: '375px (iPhone)' },
  { width: 414, height: 896, label: '414px (Mobile Large)' },
  { width: 768, height: 1024, label: '768px (Tablet)' },
  { width: 1024, height: 768, label: '1024px (iPad Pro / Small Laptop)' },
  { width: 1440, height: 900, label: '1440px (Desktop)' },
  { width: 1920, height: 1080, label: '1920px (Full HD 1080p)' },
  { width: 2560, height: 1440, label: '2560px (2K Desktop)' }
];

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: false
    }
  });

  const jsErrors = [];
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 3) { // Error level
      jsErrors.push(`[Console Error] ${message} (${sourceId}:${line})`);
    }
  });

  await win.loadFile(docsIndexPath);
  await new Promise(r => setTimeout(r, 1000));

  console.log('Testing Viewports for 0px Horizontal Overflow:');
  let hasFailure = false;

  for (const vp of viewports) {
    win.setSize(vp.width, vp.height);
    await new Promise(r => setTimeout(r, 400));

    const check = await win.webContents.executeJavaScript(`
      (() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const innerWidth = window.innerWidth;
        const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
        const overflow = maxScroll - innerWidth;
        return {
          innerWidth,
          scrollWidth: maxScroll,
          overflow: Math.max(0, overflow)
        };
      })()
    `);

    if (check.overflow > 0) {
      console.error(`❌ FAIL: ${vp.label} has ${check.overflow}px horizontal overflow! (innerWidth: ${check.innerWidth}, scrollWidth: ${check.scrollWidth})`);
      hasFailure = true;
    } else {
      console.log(`✔ PASS: ${vp.label} — 0px overflow (innerWidth: ${check.innerWidth}, scrollWidth: ${check.scrollWidth})`);
    }
  }

  if (jsErrors.length > 0) {
    console.error('\nJavaScript Errors Detected:');
    jsErrors.forEach(err => console.error(err));
    hasFailure = true;
  } else {
    console.log('\n✔ 0 Console Errors detected during full interactive initialization');
  }

  win.close();
  if (hasFailure) {
    console.error('\n❌ Responsive verification failed!');
    app.exit(1);
  } else {
    console.log('\n🎉 ALL VIEWPORTS 320px–2560px VERIFIED WITH 0px HORIZONTAL OVERFLOW!');
    app.exit(0);
  }
});
