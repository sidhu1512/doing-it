const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const docsPath = path.join(projectRoot, 'docs', 'index.html');
const outScreenshots = path.join(projectRoot, 'site-screenshots');
if (!fs.existsSync(outScreenshots)) fs.mkdirSync(outScreenshots, { recursive: true });

const viewports = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 960 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'ultrawide-2560', width: 2560, height: 1440 },
  { name: '4k-3840', width: 3840, height: 2160 }
];

app.whenReady().then(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let allPass = true;

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    useContentSize: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await win.loadFile(docsPath);

  for (const vp of viewports) {
    win.setContentSize(vp.width, vp.height);
    await wait(600);

    const check = await win.webContents.executeJavaScript(`
      (() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const innerWidth = window.innerWidth;
        const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
        const overflow = Math.max(0, maxScroll - innerWidth);

        const overflowingElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > innerWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: typeof el.className === 'string' ? el.className : '',
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            });
          }
        }

        return {
          docWidth,
          scrollWidth,
          bodyScrollWidth,
          innerWidth,
          overflow,
          overflowingElements: overflowingElements.slice(0, 5)
        };
      })()
    `);

    console.log(`[Viewport: ${vp.name} (${vp.width}x${vp.height})] Overflow: ${check.overflow}px (scrollWidth: ${check.scrollWidth}, bodyScrollWidth: ${check.bodyScrollWidth}, innerWidth: ${check.innerWidth})`);

    if (check.overflow > 0) {
      console.error(`❌ Overflow detected on ${vp.name}: ${check.overflow}px`);
      console.error('Overflowing elements:', JSON.stringify(check.overflowingElements, null, 2));
      allPass = false;
    } else {
      console.log(`✔ 0px horizontal overflow verified on ${vp.name}`);
    }

    // Capture screenshot of hero and stage
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(outScreenshots, `viewport-${vp.name}.png`), img.toPNG());
  }

  win.destroy();
  console.log(allPass ? '\n🎉 ALL VIEWPORTS VERIFIED WITH 0PX OVERFLOW!' : '\n❌ OVERFLOW FAILURES FOUND');
  app.exit(allPass ? 0 : 1);
});
