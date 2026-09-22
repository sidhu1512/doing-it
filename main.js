const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
  Notification,
  powerMonitor,
  clipboard
} = require('electron');
const path = require('path');
const fs = require('fs');

const StoreManager = require('./src/main/store');
const WindowManager = require('./src/main/windows');
const SystemIntegration = require('./src/main/system');
const { setupIpcHandlers } = require('./src/main/ipc');

// ─── App Identity ────────────────────────────────────────────
app.setAppUserModelId('com.doingit.desktop');

// ─── Single Instance Lock ────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  let storeManager;
  let windowManager;
  let tray = null;
  let isQuitting = false;

  // Handle uninstaller dialog if invoked
  if (process.argv.includes('--uninstall-prompt')) {
    app.whenReady().then(() => {
      const win = new BrowserWindow({
        width: 400,
        height: 260,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
      });
      win.loadFile(path.join(__dirname, 'uninstall.html'));
      const { ipcMain } = require('electron');
      ipcMain.on('uninstall-response', (event, doDelete) => {
        app.exit(doDelete ? 1 : 0);
      });
    });
  } else {
    // ─── Tray Management ─────────────────────────────────────
    function createTray() {
      if (tray !== null) return;

      const trayIconPath = path.join(__dirname, 'assets', 'tray_icon.png');
      const icoPath = path.join(__dirname, 'assets', 'icon.ico');

      let icon;
      try {
        icon = nativeImage.createFromPath(trayIconPath);
        if (icon.isEmpty()) throw new Error('empty');
      } catch (e) {
        try {
          icon = nativeImage.createFromPath(icoPath);
          if (icon.isEmpty()) throw new Error('empty');
          icon = icon.resize({ width: 16, height: 16 });
        } catch (e2) {
          icon = nativeImage.createFromDataURL(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVQ4T2NkoBAwUqifYdQABtKDgJGRkRHG//fv339GJCY4DCCbQQ0vIGoAOQlp1AAGXEFI9SAEACgTCBE92KfqAAAAAElFTkSuQmCC'
          );
        }
      }

      tray = new Tray(icon);
      tray.setToolTip('Doing It');

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open Doing It',
          click: () => windowManager.openMainFromFab()
        },
        {
          label: 'Quick Add...',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => windowManager.createQuickAddWindow()
        },
        { type: 'separator' },
        {
          label: 'Quit Doing It',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]);

      tray.setContextMenu(contextMenu);
      tray.on('click', () => windowManager.openMainFromFab());
    }

    // ─── App Lifecycle ───────────────────────────────────────
    app.on('second-instance', () => {
      if (windowManager) {
        windowManager.openMainFromFab();
      }
    });

    app.whenReady().then(async () => {
      // 1. Initialize Store Service
      storeManager = new StoreManager(app.getPath('userData'));
      storeManager.initStore();

      // 2. Initialize Window Manager & Secure Protocol
      windowManager = new WindowManager(__dirname, storeManager, SystemIntegration);
      windowManager.registerMediaProtocol();

      // 3. Auto-start on Windows Login (Only in production when packaged, never raw electron.exe)
      try {
        if (app.isPackaged) {
          const launchAtStartup = !!storeManager.storeData.settings?.launchAtStartup;
          app.setLoginItemSettings({
            openAtLogin: launchAtStartup,
            path: process.execPath,
            args: ['--autostart']
          });
        } else {
          // In development mode, ensure naked electron.exe is NEVER registered in startup!
          app.setLoginItemSettings({
            openAtLogin: false
          });
        }
      } catch (err) {
        console.error('[Main] Auto-start setting error:', err);
      }

      // 4. Create Tray
      createTray();

      // 5. Create Main Window (if started with --autostart on boot, start quietly in background)
      const isAutostart = process.argv.includes('--autostart');
      windowManager.createMainWindow(isAutostart, (pos) => {
        storeManager.storeData.windowPosition = pos;
        storeManager.saveStore();
      });

      // 6. Setup IPC Handlers
      setupIpcHandlers(storeManager, windowManager, SystemIntegration);

      // 7. Setup Global Shortcuts
      setupShortcuts(storeManager, windowManager, SystemIntegration);

      // 8. Power Monitors
      powerMonitor.on('lock-screen', () => {
        if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
          windowManager.mainWindow.webContents.send('timer-pause');
        }
      });

      powerMonitor.on('unlock-screen', () => {
        if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
          windowManager.mainWindow.webContents.send('timer-resumed');
        }
      });

      // 9. Silent Image Garbage Collection
      setTimeout(() => {
        runImageGarbageCollection(storeManager);
      }, 30000);
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
      if (tray) {
        tray.destroy();
        tray = null;
      }
    });

    app.on('window-all-closed', () => {
      // Don't quit — Tray or FAB keeps app active in the background
    });
  }
}

// ─────────────────────────────────────────────────────────────
// GLOBAL SHORTCUTS
// ─────────────────────────────────────────────────────────────
function setupShortcuts(storeManager, windowManager, system) {
  // Ctrl+Shift+N: Toggle Window
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (!windowManager.mainWindow || windowManager.mainWindow.isDestroyed()) {
      windowManager.createMainWindow(false);
      return;
    }

    if (windowManager.mainWindow.isVisible()) {
      windowManager.hideMainWindow();
    } else {
      windowManager.showMainWindow();
    }
  });

  // Ctrl+Shift+A: Global Quick Add
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    windowManager.createQuickAddWindow();
  });

  // Ctrl+Shift+C: Global Context-Aware Clipboard Capture
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    system.triggerNativeCopy(() => {
      setTimeout(async () => {
        const newText = clipboard.readText().trim();
        if (!newText) return;

        const activeTitle = await system.getActiveWindowTitle();

        if (!storeManager.storeData.notes) storeManager.storeData.notes = [];
        storeManager.storeData.notes.unshift({
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          text: newText,
          category: 'personal',
          context: activeTitle || null,
          timestamp: new Date().toISOString()
        });

        storeManager.saveStore();
        windowManager.broadcastDataChanged('clipboard');

        if (Notification.isSupported()) {
          const preview = newText.length > 60 ? newText.substring(0, 60) + '...' : newText;
          new Notification({
            title: 'Clipped to Doing It',
            body: preview,
            silent: true
          }).show();
        }
      }, 350);
    });
  });
}

function runImageGarbageCollection(storeManager) {
  try {
    const storeFilePath = storeManager.getStoreFilePath();
    const imagesDir = path.join(path.dirname(storeFilePath), 'images');
    if (!fs.existsSync(imagesDir)) return;

    const referencedImages = new Set();
    (storeManager.storeData.notes || []).forEach(n => {
      if (n.image) referencedImages.add(path.basename(n.image));
    });

    const files = fs.readdirSync(imagesDir);
    let cleaned = 0;
    files.forEach(f => {
      if (f.endsWith('.png') && !referencedImages.has(f)) {
        try {
          fs.unlinkSync(path.join(imagesDir, f));
          cleaned++;
        } catch (e) {}
      }
    });

    if (cleaned > 0) console.log(`[GC] Cleaned ${cleaned} orphaned image(s)`);
  } catch (err) {
    console.error('[GC] Image GC failed:', err);
  }
}
