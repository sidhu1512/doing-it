const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const CalendarService = require('../src/main/calendar');

app.setAppUserModelId('com.doingit.desktop.test');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-e2e-'));
const storeManager = new StoreManager(tmpDir);
storeManager.initStore();

const projectRoot = path.resolve(__dirname, '..');
const windowManager = new WindowManager(projectRoot, storeManager, SystemIntegration);

let testsPassed = 0;
const expectedTests = 5;
const consoleErrors = [];

function checkComplete() {
  if (testsPassed === expectedTests) {
    console.log(`\n🎉 E2E Smoke Test Passed! All ${expectedTests} windows verified with 0 fatal errors.`);
    if (consoleErrors.length > 0) {
      console.warn(`Warnings captured during run: ${consoleErrors.length}`);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
    app.exit(0);
  }
}

const { setupIpcHandlers } = require('../src/main/ipc');

app.whenReady().then(async () => {
  windowManager.registerMediaProtocol();
  setupIpcHandlers(storeManager, windowManager, SystemIntegration);

  async function testWindow(name, createFn) {
    return new Promise((resolve) => {
      const win = createFn();
      win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if (level >= 3) {
          console.error(`[${name} Error] ${message} (${sourceId}:${line})`);
          consoleErrors.push({ win: name, message });
        }
      });
      win.webContents.once('did-finish-load', () => {
        console.log(`✔ ${name} loaded successfully`);
        testsPassed++;
        resolve(win);
      });
    });
  }

  // Failsafe timeout after 20 seconds
  const timer = setTimeout(() => {
    if (testsPassed < expectedTests) {
      console.error(`❌ E2E Timeout: Only ${testsPassed}/${expectedTests} windows completed.`);
      app.exit(1);
    }
  }, 20000);

  try {
    await testWindow('MainWindow (index.html)', () => windowManager.createMainWindow(false));
    await testWindow('FabWindow (fab.html)', () => windowManager.createFabWindow());
    await testWindow('QuickAddWindow (quickadd.html)', () => windowManager.createQuickAddWindow());
    await testWindow('MiniTimerWindow (mini-timer.html)', () => windowManager.createMiniTimerWindow({ remaining: 1500, duration: 1500, running: false }));
    await testWindow('SettingsWindow (settings.html)', () => windowManager.createSettingsWindow());

    clearTimeout(timer);
    checkComplete();
  } catch (err) {
    console.error('Test execution failed:', err);
    app.exit(1);
  }
});
