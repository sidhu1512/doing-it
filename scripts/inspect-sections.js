const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const docsPath = path.join(projectRoot, 'docs', 'index.html');
const outDir = path.join(projectRoot, 'site-screenshots', 'sections');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

app.whenReady().then(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Desktop 1440x960
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await win.loadFile(docsPath);
  await wait(1000);

  const sections = [
    { name: '01-hero', selector: '.hero-section' },
    { name: '02-stage', selector: '.stage-section' },
    { name: '03-ecosystem', selector: '#ecosystem' },
    { name: '04-lab', selector: '#lab' },
    { name: '05-features', selector: '#features' },
    { name: '06-architecture', selector: '#architecture' },
    { name: '07-shortcuts', selector: '#shortcuts' },
    { name: '08-faq', selector: '#faq' },
    { name: '09-download-footer', selector: '.download-section' }
  ];

  for (const sec of sections) {
    const rect = await win.webContents.executeJavaScript(`
      (() => {
        const el = document.querySelector('${sec.selector}');
        if (!el) return null;
        el.scrollIntoView();
        const r = el.getBoundingClientRect();
        return { top: window.scrollY + r.top, height: r.height, width: r.width };
      })()
    `);

    if (rect) {
      await wait(500);
      const img = await win.webContents.capturePage();
      fs.writeFileSync(path.join(outDir, `${sec.name}.png`), img.toPNG());
      console.log(`Captured ${sec.name} at scroll position`);
    } else {
      console.warn(`Could not find selector for ${sec.name}`);
    }
  }

  win.destroy();
  console.log('Done capturing all sections!');
  app.exit(0);
});
