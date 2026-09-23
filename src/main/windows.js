const { BrowserWindow, screen, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

class WindowManager {
  constructor(projectRoot, storeManager, systemIntegration) {
    this.projectRoot = projectRoot;
    this.storeManager = storeManager;
    this.system = systemIntegration;

    this.mainWindow = null;
    this.fabWindow = null;
    this.quickAddWindow = null;
    this.miniTimerWindow = null;
    this.settingsWindow = null;

    this.isDocked = false;
    this.iconPath = path.join(this.projectRoot, 'assets', 'icon.ico');
    this.preloadPath = path.join(this.projectRoot, 'preload.js');
  }

  registerMediaProtocol() {
    // Registers a secure custom protocol to safely load local user images without disabling webSecurity
    protocol.registerFileProtocol('doingit-media', (request, callback) => {
      const url = request.url.replace(/^doingit-media:\/\//, '');
      let decodedPath = decodeURIComponent(url);

      // On Windows, Chromium URL parsing may prefix with a slash: /C:/... -> C:/...
      if (/^\/[a-zA-Z]:/.test(decodedPath)) {
        decodedPath = decodedPath.slice(1);
      }

      const normalized = path.normalize(decodedPath);

      try {
        if (fs.existsSync(normalized)) {
          return callback(normalized);
        }
        if (fs.existsSync(decodedPath)) {
          return callback(decodedPath);
        }
      } catch (err) {
        console.error('[WindowManager] Protocol error:', err);
      }
      return callback({ error: -6 }); // FILE_NOT_FOUND
    });
  }

  createMainWindow(initiallyHidden = false, onMove) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (!initiallyHidden) {
        this.showMainWindow();
      }
      return this.mainWindow;
    }

    const allDisplays = screen.getAllDisplays();
    let targetDisplay = this.system.getActiveDisplay();
    const savedPos = this.storeManager.storeData.windowPosition;

    if (savedPos) {
      const match = allDisplays.find(d => {
        const b = d.bounds;
        return savedPos.x >= b.x - 40 && savedPos.x < b.x + b.width + 40 &&
               savedPos.y >= b.y - 40 && savedPos.y < b.y + b.height + 40;
      });
      if (match) targetDisplay = match;
    }

    const { width: screenWidth, height: screenHeight } = targetDisplay.workAreaSize;
    const { x: dispX, y: dispY } = targetDisplay.workArea;
    const savedSize = this.storeManager.storeData.windowSize;
    const winWidth = savedSize?.width ? Math.min(Math.max(savedSize.width, 360), 680) : 400;
    const winHeight = savedSize?.height ? Math.min(Math.max(savedSize.height, 520), screenHeight) : 650;

    let x = savedPos ? savedPos.x : dispX + screenWidth - winWidth - 20;
    let y = savedPos ? savedPos.y : dispY + Math.round((screenHeight - winHeight) / 2);

    if (x < dispX - 40 || x > dispX + screenWidth - 60) x = dispX + screenWidth - winWidth - 20;
    if (y < dispY - 40 || y > dispY + screenHeight - 60) y = dispY + Math.round((screenHeight - winHeight) / 2);

    const isAlwaysOnTop = !!this.storeManager.storeData.settings?.alwaysOnTop;

    // *** PROTECTED INVARIANTS: frame: false, transparent: true, backgroundColor: '#00000000', icon ***
    this.mainWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      minWidth: 360,
      maxWidth: 680,
      minHeight: 520,
      maxHeight: Math.max(720, screenHeight),
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: isAlwaysOnTop,
      resizable: true,
      skipTaskbar: false,
      hasShadow: true,
      title: 'Doing It',
      icon: this.iconPath,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true, // HARDENED
        backgroundThrottling: false // Keeps timers running accurately
      }
    });

    this.mainWindow.loadFile(path.join(this.projectRoot, 'index.html'));

    this.mainWindow.once('ready-to-show', () => {
      if (initiallyHidden) {
        if (!this.storeManager.storeData.settings.disableFab) {
          this.createFabWindow();
          if (this.fabWindow) this.fabWindow.show();
        }
      } else {
        this.mainWindow.show();
        if (this.fabWindow && !this.fabWindow.isDestroyed()) this.fabWindow.hide();
      }
    });

    this.mainWindow.on('moved', () => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
      const [wx, wy] = this.mainWindow.getPosition();
      const [ww, wh] = this.mainWindow.getSize();

      // Check edge docking
      const dockResult = this.system.calculateDockState({ x: wx, y: wy, width: ww, height: wh });
      if (dockResult.isDocked !== this.isDocked) {
        this.isDocked = dockResult.isDocked;
        this.mainWindow.setBounds(dockResult.bounds, true);
        this.mainWindow.webContents.send('dock-state-changed', this.isDocked);
      }

      this.storeManager.storeData.windowPosition = { x: wx, y: wy };
      this.storeManager.saveStore();

      if (typeof onMove === 'function') {
        onMove({ x: wx, y: wy });
      }
    });

    let resizeTimer = null;
    this.mainWindow.on('resize', () => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
        const [ww, wh] = this.mainWindow.getSize();
        this.storeManager.storeData.windowSize = { width: ww, height: wh };
        this.storeManager.saveStore();
      }, 350);
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  showMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return this.createMainWindow(false);
    }

    if (this.mainWindow.isVisible()) {
      this.mainWindow.focus();
      return;
    }

    // Opacity mask avoids DWM transparent window flicker
    this.mainWindow.setOpacity(0);
    this.mainWindow.show();
    this.mainWindow.focus();

    setTimeout(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.setOpacity(1);
      }
    }, 50);

    if (this.fabWindow && !this.fabWindow.isDestroyed()) {
      this.fabWindow.hide();
    }
  }

  hideMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    this.mainWindow.hide();
    if (!this.storeManager.storeData.settings.disableFab) {
      this.createFabWindow();
      if (this.fabWindow && !this.fabWindow.isDestroyed()) {
        this.fabWindow.show();
      }
    }
  }

  minimizeToFab() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const settings = this.storeManager.storeData.settings;

    if (settings.disableFab) {
      this.mainWindow.minimize();
    } else {
      this.mainWindow.hide();
      this.createFabWindow();
      if (this.fabWindow && !this.fabWindow.isDestroyed()) {
        this.fabWindow.show();
      }
    }
  }

  openMainFromFab() {
    this.showMainWindow();
  }

  toggleFab(disableFab) {
    if (disableFab) {
      if (this.fabWindow && !this.fabWindow.isDestroyed()) {
        this.fabWindow.hide();
      }
    } else {
      if (!this.mainWindow || !this.mainWindow.isVisible()) {
        this.createFabWindow();
        if (this.fabWindow && !this.fabWindow.isDestroyed()) {
          this.fabWindow.show();
        }
      }
    }
  }

  createFabWindow(onMove) {
    if (this.fabWindow && !this.fabWindow.isDestroyed()) return this.fabWindow;

    const activeDisplay = this.system.getActiveDisplay();
    const { width: screenWidth, height: screenHeight } = activeDisplay.workAreaSize;
    const { x: dispX, y: dispY } = activeDisplay.workArea;
    const fabSize = 48;

    const savedFab = this.storeManager.storeData.fabPosition;
    let x = savedFab ? savedFab.x : dispX + screenWidth - fabSize - 20;
    let y = savedFab ? savedFab.y : dispY + Math.round(screenHeight / 2);

    if (x < dispX || x > dispX + screenWidth - fabSize) x = dispX + screenWidth - fabSize - 20;
    if (y < dispY || y > dispY + screenHeight - fabSize) y = dispY + Math.round(screenHeight / 2);

    this.fabWindow = new BrowserWindow({
      width: fabSize,
      height: fabSize,
      x,
      y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: true,
      title: 'Doing It FAB',
      icon: this.iconPath,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.fabWindow.loadFile(path.join(this.projectRoot, 'fab.html'));
    this.fabWindow.setAlwaysOnTop(true, 'screen-saver');

    this.fabWindow.on('moved', () => {
      if (!this.fabWindow || this.fabWindow.isDestroyed()) return;
      const [fx, fy] = this.fabWindow.getPosition();
      if (typeof onMove === 'function') onMove({ x: fx, y: fy });
    });

    this.fabWindow.on('closed', () => {
      this.fabWindow = null;
    });

    return this.fabWindow;
  }

  createQuickAddWindow(onSave) {
    if (this.quickAddWindow && !this.quickAddWindow.isDestroyed()) {
      this.quickAddWindow.show();
      this.quickAddWindow.focus();
      return this.quickAddWindow;
    }

    const activeDisplay = this.system.getActiveDisplay();
    const { width: dispWidth, height: dispHeight } = activeDisplay.workAreaSize;
    const { x: dispX, y: dispY } = activeDisplay.workArea;
    const qaWidth = 520;
    const qaHeight = 68;

    this.quickAddWindow = new BrowserWindow({
      width: qaWidth,
      height: qaHeight,
      x: dispX + Math.round((dispWidth - qaWidth) / 2),
      y: dispY + Math.round(dispHeight * 0.28),
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: true,
      show: false,
      title: 'Quick Add',
      icon: this.iconPath,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.quickAddWindow.loadFile(path.join(this.projectRoot, 'quickadd.html'));
    this.quickAddWindow.once('ready-to-show', () => this.quickAddWindow.show());

    this.quickAddWindow.on('blur', () => {
      if (this.quickAddWindow && !this.quickAddWindow.isDestroyed()) {
        this.quickAddWindow.close();
      }
    });

    this.quickAddWindow.on('closed', () => {
      this.quickAddWindow = null;
    });

    return this.quickAddWindow;
  }

  createMiniTimerWindow(initialState) {
    if (this.miniTimerWindow && !this.miniTimerWindow.isDestroyed()) {
      this.miniTimerWindow.show();
      return this.miniTimerWindow;
    }

    const activeDisplay = this.system.getActiveDisplay();
    const { width: dispWidth } = activeDisplay.workAreaSize;
    const { x: dispX, y: dispY } = activeDisplay.workArea;

    const miniW = 290;
    const miniH = 50;

    this.miniTimerWindow = new BrowserWindow({
      width: miniW,
      height: miniH,
      x: dispX + dispWidth - miniW - 24,
      y: dispY + 24,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      title: 'Focus Timer',
      icon: this.iconPath,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.miniTimerWindow.loadFile(path.join(this.projectRoot, 'mini-timer.html'));
    this.miniTimerWindow.setAlwaysOnTop(true, 'screen-saver');

    this.miniTimerWindow.webContents.once('did-finish-load', () => {
      if (this.miniTimerWindow && !this.miniTimerWindow.isDestroyed() && initialState) {
        this.miniTimerWindow.webContents.send('timer-sync', initialState);
      }
    });

    this.miniTimerWindow.on('closed', () => {
      this.miniTimerWindow = null;
    });

    // Sole floating companion: Hide main window and FAB
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();
    }
    if (this.fabWindow && !this.fabWindow.isDestroyed()) {
      this.fabWindow.hide();
    }
    return this.miniTimerWindow;
  }

  createSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 500,
      height: 650,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      alwaysOnTop: true,
      show: false,
      title: 'Settings - Doing It',
      icon: this.iconPath,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.settingsWindow.loadFile(path.join(this.projectRoot, 'settings.html'));
    this.settingsWindow.once('ready-to-show', () => {
      if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
        this.settingsWindow.show();
      }
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    return this.settingsWindow;
  }

  broadcastTheme(theme) {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('theme-updated', theme);
      }
    });
  }

  broadcastDataChanged(source) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('data-changed', source);
    }
  }

  syncTimer(state) {
    if (this.miniTimerWindow && !this.miniTimerWindow.isDestroyed()) {
      this.miniTimerWindow.webContents.send('timer-sync', state);
    }
    if (this.fabWindow && !this.fabWindow.isDestroyed()) {
      this.fabWindow.webContents.send('fab-timer-sync', state);
    }
  }

  undockMainWindow() {
    if (this.mainWindow && this.isDocked) {
      this.isDocked = false;
      const activeDisplay = this.system.getActiveDisplay();
      const workArea = activeDisplay.workArea;
      this.mainWindow.setBounds({
        x: workArea.x + workArea.width - 420,
        y: workArea.y + Math.round((workArea.height - 650) / 2),
        width: 400,
        height: 650
      }, true);
      this.mainWindow.webContents.send('dock-state-changed', false);
    }
  }

  toggleAlwaysOnTop() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return false;
    const current = this.mainWindow.isAlwaysOnTop();
    const next = !current;
    this.mainWindow.setAlwaysOnTop(next);
    if (!this.storeManager.storeData.settings) this.storeManager.storeData.settings = {};
    this.storeManager.storeData.settings.alwaysOnTop = next;
    this.storeManager.saveStore();
    return next;
  }

  isAlwaysOnTop() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return !!this.storeManager.storeData.settings?.alwaysOnTop;
    }
    return this.mainWindow.isAlwaysOnTop();
  }
}

module.exports = WindowManager;
