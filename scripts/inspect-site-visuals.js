const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const docsPath = path.resolve(__dirname, '..', 'docs', 'index.html');
const outDir = path.resolve(__dirname, '..', 'site-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      offscreen: true,
      contextIsolation: false
    }
  });

  await win.loadFile(docsPath);
  await new Promise(r => setTimeout(r, 1200));

  // 1. Hero
  const imgHero = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '01-hero.png'), imgHero.toPNG());

  // 2. Scroll to Video Tour
  await win.webContents.executeJavaScript(`document.getElementById('video-tour').scrollIntoView();`);
  await new Promise(r => setTimeout(r, 600));
  const imgVideo = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '02-video-tour.png'), imgVideo.toPNG());

  // 3. Scroll to Parallax
  await win.webContents.executeJavaScript(`document.getElementById('parallax').scrollIntoView();`);
  await new Promise(r => setTimeout(r, 600));
  const imgParallax = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '03-parallax.png'), imgParallax.toPNG());

  // 4. Scroll to Demos
  await win.webContents.executeJavaScript(`document.getElementById('demos').scrollIntoView();`);
  await new Promise(r => setTimeout(r, 600));
  const imgDemos = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '04-demos.png'), imgDemos.toPNG());

  // 5. Scroll to Audio
  await win.webContents.executeJavaScript(`document.getElementById('audio').scrollIntoView();`);
  await new Promise(r => setTimeout(r, 600));
  const imgAudio = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '05-audio.png'), imgAudio.toPNG());

  // 6. Scroll to Features (Bento Grid)
  await win.webContents.executeJavaScript(`document.getElementById('features').scrollIntoView();`);
  await new Promise(r => setTimeout(r, 600));
  const imgBento = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '06-bento.png'), imgBento.toPNG());

  // 7. Open Raycast Modal
  await win.webContents.executeJavaScript(`
    const modal = document.getElementById('raycast-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const input = document.getElementById('raycast-search-input');
    input.value = 'focus';
    input.dispatchEvent(new Event('input'));
  `);
  await new Promise(r => setTimeout(r, 600));
  const imgRaycast = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, '07-raycast.png'), imgRaycast.toPNG());

  console.log('Site screenshots captured successfully!');
  win.close();
  app.exit(0);
});
