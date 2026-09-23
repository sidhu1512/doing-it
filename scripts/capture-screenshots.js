const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const { setupIpcHandlers } = require('../src/main/ipc');

app.setAppUserModelId('com.doingit.desktop.capture');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-capture-'));
const storeManager = new StoreManager(tmpDir);
storeManager.initStore();

// Seed clean demo data for screenshots
storeManager.storeData.todos = [
  { id: 1, text: 'Finalize Doing It v4.3.5 release notes', completed: false, priority: 'high', dueDate: new Date().toISOString().split('T')[0] },
  { id: 2, text: 'Review Electron acrylic background & glassmorphism', completed: false, priority: 'medium', dueDate: null },
  { id: 3, text: 'Test Spotify desktop playback sync bar', completed: false, priority: 'none', dueDate: null },
  { id: 4, text: 'Push git tag and binary releases', completed: true, priority: 'high', dueDate: null }
];
storeManager.storeData.notes = [
  { id: 101, text: '### Engineering Architecture\n\n- Zero-latency local storage with atomic rename\n- Raycast-grade Command Palette (`Ctrl+K`)\n- Procedural ambient sound synthesis', pinned: true, timestamp: new Date().toISOString() },
  { id: 102, text: 'Check out the official documentation at https://github.com/sidhu1512/doing-it #docs', pinned: false, timestamp: new Date().toISOString() }
];
storeManager.storeData.settings = {
  theme: '',
  alwaysOnTop: true,
  spotify: {
    autoPlayOnFocus: true,
    autoPauseOnComplete: true
  }
};
storeManager.saveStore();

const projectRoot = path.resolve(__dirname, '..');
const windowManager = new WindowManager(projectRoot, storeManager, SystemIntegration);

const sleep = ms => new Promise(res => setTimeout(res, ms));

app.whenReady().then(async () => {
  windowManager.registerMediaProtocol();
  setupIpcHandlers(storeManager, windowManager, SystemIntegration);

  const mainWin = windowManager.createMainWindow();
  await new Promise(r => mainWin.webContents.once('did-finish-load', r));
  await sleep(1000);

  const imgsDir = path.join(projectRoot, 'imgs');
  if (!fs.existsSync(imgsDir)) fs.mkdirSync(imgsDir, { recursive: true });

  // 1. Capture Tasks View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'tasks');
    window.appStore.set('settingsOpen', false);
    window.appStore.set('paletteOpen', false);
  `);
  await sleep(600);
  let img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'tasks-view.png'), img.toPNG());
  console.log('✔ tasks-view.png captured');

  // 2. Capture Notes View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'notes');
  `);
  await sleep(600);
  img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'notes-view.png'), img.toPNG());
  console.log('✔ notes-view.png captured');

  // 3. Capture Focus View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'focus');
  `);
  await sleep(600);
  img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'focus-view.png'), img.toPNG());
  console.log('✔ focus-view.png captured');

  // 4. Capture Planner View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'planner');
  `);
  await sleep(600);
  img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'planner-view.png'), img.toPNG());
  console.log('✔ planner-view.png captured');

  // 5. Capture Settings Modal
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('settingsOpen', true);
  `);
  await sleep(600);
  img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'settings-view.png'), img.toPNG());
  console.log('✔ settings-view.png captured');

  // 6. Capture Command Palette
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('settingsOpen', false);
    window.appStore.set('paletteOpen', true);
  `);
  await sleep(600);
  img = await mainWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'palette-view.png'), img.toPNG());
  console.log('✔ palette-view.png captured');

  // 7. Mini Timer
  const miniWin = windowManager.createMiniTimerWindow({ remaining: 1420, duration: 1500, running: true, task: 'Finalize Doing It v4.3.5' });
  await new Promise(r => miniWin.webContents.once('did-finish-load', r));
  await sleep(600);
  img = await miniWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'mini-timer.png'), img.toPNG());
  console.log('✔ mini-timer.png captured');
  miniWin.close();

  // 8. Quick Add
  const quickWin = windowManager.createQuickAddWindow();
  await new Promise(r => quickWin.webContents.once('did-finish-load', r));
  await sleep(600);
  img = await quickWin.webContents.capturePage();
  fs.writeFileSync(path.join(imgsDir, 'quick-add.png'), img.toPNG());
  console.log('✔ quick-add.png captured');
  quickWin.close();

  mainWin.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log('🎉 All updated screenshots generated successfully!');
  app.exit(0);
});
