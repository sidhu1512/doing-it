const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, screen, nativeImage, Notification, powerMonitor, dialog, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const { getLinkPreview } = require('link-preview-js');
const chrono = require('chrono-node');

// (no GPU hacks needed)

// ─── App Identity ────────────────────────────────────────────
app.setAppUserModelId('com.doingit.desktop');

// ─── Single Instance Lock ────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {

  if (process.argv.includes('--uninstall-prompt')) {
    app.whenReady().then(() => {
      const win = new BrowserWindow({
        width: 400, height: 260, transparent: true, frame: false, alwaysOnTop: true,
        resizable: false, webPreferences: { nodeIntegration: true, contextIsolation: false }
      });
      win.loadFile('uninstall.html');
      ipcMain.on('uninstall-response', (event, doDelete) => {
        app.exit(doDelete ? 1 : 0);
      });
    });
    // Prevent the rest of the application from initializing
  } else {

  // ─── Simple JSON Store ───────────────────────────────────

  let storeFile;
  let storeData = { notes: [], todos: [], reminders: [], moods: {}, pomodoro: { sessions: 0, totalMinutes: 0, lastDate: null }, windowPosition: null, fabPosition: null, settings: { savePath: null } };

  function getStoreFilePath() {
    const customPath = storeData.settings?.savePath;
    if (customPath && fs.existsSync(customPath)) {
      return path.join(customPath, 'doing-it-data.json');
    }
    return path.join(app.getPath('userData'), 'doing-it-data.json');
  }

  function initStore() {
    // First load from default location to get settings
    const defaultFile = path.join(app.getPath('userData'), 'doing-it-data.json');
    try {
      if (fs.existsSync(defaultFile)) {
        storeData = JSON.parse(fs.readFileSync(defaultFile, 'utf-8'));
      }
    } catch (e) {
      console.error('Failed to load default store:', e);
      // Try to restore from backup
      restoreFromBackup(defaultFile);
    }

    // If custom path is set, load from there instead
    if (storeData.settings?.savePath) {
      const customFile = path.join(storeData.settings.savePath, 'doing-it-data.json');
      try {
        if (fs.existsSync(customFile)) {
          storeData = JSON.parse(fs.readFileSync(customFile, 'utf-8'));
        }
      } catch (e) {
        console.error('Failed to load custom store:', e);
        restoreFromBackup(customFile);
      }
    }

    storeFile = getStoreFilePath();

    // Ensure settings object exists
    if (!storeData.settings) storeData.settings = { savePath: null };

    // Create rolling backup on launch
    createBackup();
  }

  function saveStore(data) {
    try {
      // Also save settings reference in default location
      const defaultFile = path.join(app.getPath('userData'), 'doing-it-data.json');
      if (storeFile !== defaultFile) {
        const settingsRef = { settings: data.settings };
        fs.writeFileSync(defaultFile, JSON.stringify(settingsRef, null, 2), 'utf-8');
      }
      fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save store:', e);
    }
  }

  // ─── Rolling Backups ────────────────────────────────────

  function createBackup() {
    try {
      if (!fs.existsSync(storeFile)) return;
      const backupDir = path.join(path.dirname(storeFile), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `doing-it-backup-${timestamp}.json`);
      fs.copyFileSync(storeFile, backupFile);

      // Keep only last 5 days of backups
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('doing-it-backup-') && f.endsWith('.json'))
        .sort();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 5);
      backups.forEach(f => {
        try {
          const filePath = path.join(backupDir, f);
          const stat = fs.statSync(filePath);
          if (stat.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          console.error('Failed to clean backup file:', f, cleanupErr);
        }
      });

      console.log('Backup created:', backupFile);
    } catch (e) {
      console.error('Backup failed:', e);
    }
  }

  function restoreFromBackup(targetFile) {
    try {
      const backupDir = path.join(path.dirname(targetFile), 'backups');
      if (!fs.existsSync(backupDir)) return;
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('doing-it-backup-') && f.endsWith('.json'))
        .sort();
      if (backups.length === 0) return;

      const latestBackup = path.join(backupDir, backups[backups.length - 1]);
      const data = fs.readFileSync(latestBackup, 'utf-8');
      storeData = JSON.parse(data);
      console.log('Restored from backup:', latestBackup);
    } catch (e) {
      console.error('Restore from backup failed:', e);
    }
  }

  // ──────────────────────────────────────────────────────────

  let mainWindow = null;   // The full widget panel
  let fabWindow = null;    // The floating action button (AssistiveTouch)
  let quickAddWindow = null; // Quick capture bar
  let miniTimerWindow = null; // PiP mini timer
  let settingsWindow = null; // Standalone Settings overlay
  let tray = null;
  let isQuitting = false;
  let isDocked = false;    // Screen edge docking state

  // ─── Floating Action Button (FAB) ─────────────────────────

  // ─── Helper: Get active display ─────────────────────────
  function getActiveDisplay() {
    const cursorPoint = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursorPoint);
  }

  function createFab() {
    if (fabWindow) return;

    const activeDisplay = getActiveDisplay();
    const { width: screenWidth, height: screenHeight } = activeDisplay.workAreaSize;
    const { x: dispX, y: dispY } = activeDisplay.workArea;
    const fabSize = 48;

    const savedFab = storeData.fabPosition;
    let x = savedFab ? savedFab.x : dispX + screenWidth - fabSize - 20;
    let y = savedFab ? savedFab.y : dispY + Math.round(screenHeight / 2);
    // Clamp to screen bounds
    if (x < dispX || x > dispX + screenWidth - fabSize) x = dispX + screenWidth - fabSize - 20;
    if (y < dispY || y > dispY + screenHeight - fabSize) y = dispY + Math.round(screenHeight / 2);

    fabWindow = new BrowserWindow({
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
      roundedCorners: false,
      title: 'Doing It',
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    fabWindow.loadFile('fab.html');
    fabWindow.setAlwaysOnTop(true, 'screen-saver');
    fabWindow.setOpacity(0.85);
    fabWindow.setVisibleOnAllWorkspaces && fabWindow.setVisibleOnAllWorkspaces(true);

    // Save FAB position on move
    fabWindow.on('moved', () => {
      if (fabWindow) {
        const [fx, fy] = fabWindow.getPosition();
        storeData.fabPosition = { x: fx, y: fy };
        saveStore(storeData);
      }
    });

    fabWindow.on('closed', () => {
      fabWindow = null;
    });
  }

  // ─── Main Widget Window ────────────────────────────────────

  function createMainWindow(initiallyHidden = false) {
    if (mainWindow) {
      if (!initiallyHidden) {
        mainWindow.show();
        mainWindow.focus();
      }
      return;
    }

    const activeDisplay = getActiveDisplay();
    const { width: screenWidth, height: screenHeight } = activeDisplay.workAreaSize;
    const { x: dispX, y: dispY } = activeDisplay.workArea;
    const winWidth = 400;
    const winHeight = 650;

    const savedPos = storeData.windowPosition;
    let x = savedPos ? savedPos.x : dispX + screenWidth - winWidth - 20;
    let y = savedPos ? savedPos.y : dispY + Math.round((screenHeight - winHeight) / 2);
    // Clamp to screen bounds
    if (x < dispX || x > dispX + screenWidth - 100) x = dispX + screenWidth - winWidth - 20;
    if (y < dispY || y > dispY + screenHeight - 100) y = dispY + Math.round((screenHeight - winHeight) / 2);

    // *** DO NOT CHANGE: transparent, frame, backgroundColor, or borderRadius ***
    // *** These control the app's signature rounded transparent look ***
    mainWindow = new BrowserWindow({
      width: winWidth,
      height: winHeight,
      x,
      y,
      show: false, // Wait for ready-to-show
      frame: false,       // DO NOT CHANGE — frameless window is required
      transparent: true,  // DO NOT CHANGE — enables CSS rounded corners
      backgroundColor: '#00000000', // DO NOT CHANGE — fully transparent background
      alwaysOnTop: false, // Main window should NOT float on top — only FAB does
      resizable: false,
      skipTaskbar: false,
      hasShadow: true,
      title: 'Doing It',
      icon: path.join(__dirname, 'assets', 'icon.ico'), // DO NOT CHANGE icon path
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false,
        backgroundThrottling: false  // CRITICAL: keeps timer running when window is hidden
      }
    });

    mainWindow.loadFile('index.html');


    mainWindow.once('ready-to-show', () => {
      if (initiallyHidden) {
        if (!fabWindow) createFab();
        if (fabWindow) fabWindow.show();
      } else {
        mainWindow.show();
        if (fabWindow) fabWindow.hide();
      }
    });

    // Save position on move + Edge Docking detection
    mainWindow.on('moved', () => {
      if (mainWindow) {
        const [wx, wy] = mainWindow.getPosition();
        storeData.windowPosition = { x: wx, y: wy };
        saveStore(storeData);

        // Edge docking: snap to sidebar if within 20px of screen edge
        const activeDisplay = screen.getDisplayNearestPoint({ x: wx, y: wy });
        const workArea = activeDisplay.workArea;
        const edgeThreshold = 20;

        if (wx <= workArea.x + edgeThreshold || wx + 400 >= workArea.x + workArea.width - edgeThreshold) {
          if (!isDocked) {
            isDocked = true;
            const dockX = wx <= workArea.x + edgeThreshold ? workArea.x : workArea.x + workArea.width - 400;
            mainWindow.setBounds({ x: dockX, y: workArea.y, width: 400, height: workArea.height }, true);
            mainWindow.setResizable(false);
            mainWindow.webContents.send('dock-state-changed', true);
          }
        } else {
          if (isDocked) {
            isDocked = false;
            mainWindow.setBounds({ x: wx, y: wy, width: 400, height: 650 }, true);
            mainWindow.setResizable(false);
            mainWindow.webContents.send('dock-state-changed', false);
          }
        }
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Hide the FAB while main window is visible
    if (fabWindow) {
      fabWindow.hide();
    }
  }

  function createSettingsWindow() {
    if (settingsWindow) return;

    settingsWindow = new BrowserWindow({
      width: 500,
      height: 650,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      alwaysOnTop: true,
      show: false, // Wait for ready-to-show
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    settingsWindow.loadFile('settings.html');

    settingsWindow.once('ready-to-show', () => {
      if (settingsWindow) settingsWindow.show();
    });

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  }

  // ─── Tray (backup access) ─────────────────────────────────

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
        // Fallback to inline icon
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
        click: () => openMainFromFab()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => openMainFromFab());
  }

  // ─── Actions ───────────────────────────────────────────────

  // Use proper hide/show with backgroundThrottling:false + opacity masking.
  // The off-screen approach caused Chromium to throttle setInterval timers.

  function hideMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) return;
    mainWindow.hide();
  }

  function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      // Already visible, just bring to front
      mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
      mainWindow.focus();
      setTimeout(() => mainWindow.setAlwaysOnTop(false), 100);
      return;
    }
    // Opacity mask to reduce DWM flicker on transparent windows
    mainWindow.setOpacity(0);
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
    mainWindow.focus();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setOpacity(1);
        mainWindow.setAlwaysOnTop(false);
      }
    }, 60);
  }

  function openMainFromFab() {
    if (mainWindow) {
      showMainWindow();
    } else {
      createMainWindow();
    }
  }

  function minimizeToFab() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  }

  function quitApp() {
    isQuitting = true;
    app.quit();
  }

  // ─── App Lifecycle ────────────────────────────────────────

  app.on('second-instance', () => {
    openMainFromFab();
  });

  app.whenReady().then(() => {
    initStore();

    // Auto-start on login
    app.setLoginItemSettings({
      openAtLogin: true,
      args: ['--autostart']
    });

    createTray();
    
    // Create main window and show it immediately (don't shrink to FAB on boot)
    createMainWindow(false); 

    // Settings Window lifecycle
    ipcMain.on('open-settings-window', () => {
      if (settingsWindow) {
        settingsWindow.focus();
      } else {
        createSettingsWindow();
      }
    });

    ipcMain.on('close-settings-window', () => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close();
      }
    });

    ipcMain.on('notify-settings-changed', () => {
      if (mainWindow) mainWindow.webContents.send('settings-changed');
    });

    // ─── IPC Handlers ──────────────────────────────────────
    ipcMain.handle('get-notes', () => storeData.notes || []);
    ipcMain.handle('save-notes', (_, notes) => {
      storeData.notes = notes;
      saveStore(storeData);
      return true;
    });

    ipcMain.handle('get-todos', () => storeData.todos || []);
    ipcMain.handle('save-todos', (_, todos) => {
      storeData.todos = todos;
      saveStore(storeData);
      return true;
    });

    ipcMain.handle('get-reminders', () => storeData.reminders || []);
    ipcMain.handle('save-reminders', (_, reminders) => {
      storeData.reminders = reminders;
      saveStore(storeData);
      return true;
    });

    ipcMain.handle('get-moods', () => storeData.moods || {});
    ipcMain.handle('save-moods', (_, moods) => {
      storeData.moods = moods;
      saveStore(storeData);
      return true;
    });

    ipcMain.handle('get-pomodoro', () => storeData.pomodoro || { sessions: 0, totalMinutes: 0, lastDate: null });
    ipcMain.handle('save-pomodoro', (_, state) => {
      storeData.pomodoro = state;
      saveStore(storeData);
      return true;
    });

    // ─── NLP Date Parsing ─────────────────────────────────
    ipcMain.handle('parse-nlp', (_, text) => {
      try {
        const results = chrono.parse(text);
        if (results && results.length > 0) {
          const d = results[0].start.date();
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const cleanText = text.replace(results[0].text, '').replace(/\s+/g, ' ').trim();
          return { date: dateStr, text: cleanText };
        }
        return { date: null, text };
      } catch (e) {
        console.error('NLP parse error:', e);
        return { date: null, text };
      }
    });

    // ─── Settings / BYOC IPC ──────────────────────────────
    ipcMain.handle('get-settings', () => storeData.settings || { savePath: null });
    ipcMain.handle('save-settings', (_, settings) => {
      const oldPath = storeFile;
      storeData.settings = settings;
      const newStoreFile = getStoreFilePath();

      // If path changed, copy data to new location
      if (newStoreFile !== oldPath && settings.savePath) {
        try {
          const dir = path.dirname(newStoreFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(newStoreFile, JSON.stringify(storeData, null, 2), 'utf-8');
          console.log('Data migrated to:', newStoreFile);
        } catch (e) {
          console.error('Failed to migrate data:', e);
        }
      }

      storeFile = newStoreFile;
      saveStore(storeData);
      return true;
    });

    ipcMain.handle('choose-directory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Choose save location for Doing It data'
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0];
    });

    ipcMain.handle('get-current-store-path', () => {
      return path.dirname(storeFile);
    });

    // Window controls from renderer
    ipcMain.on('close-window', () => quitApp());
    ipcMain.on('minimize-window', () => minimizeToFab());

    // FAB click from fab.html
    ipcMain.on('fab-clicked', () => openMainFromFab());

    // FAB drag support
    ipcMain.on('move-fab', (_, x, y) => {
      if (fabWindow) {
        fabWindow.setPosition(Math.round(x), Math.round(y), false);
        storeData.fabPosition = { x: Math.round(x), y: Math.round(y) };
        saveStore(storeData);
      }
    });

    ipcMain.handle('get-fab-position', () => {
      if (fabWindow) {
        const [x, y] = fabWindow.getPosition();
        return { x, y };
      }
      return { x: 0, y: 0 };
    });

    // System notifications
    ipcMain.on('show-notification', (_, title, body) => {
      if (Notification.isSupported()) {
        const notif = new Notification({ title, body, silent: false });
        notif.show();
      }
    });

    // ─── Quick Add Bar ────────────────────────────────────
    function createQuickAddWindow() {
      if (quickAddWindow) {
        quickAddWindow.show();
        quickAddWindow.focus();
        return;
      }

      const activeDisplay = getActiveDisplay();
      const { width: dispWidth, height: dispHeight } = activeDisplay.workAreaSize;
      const { x: dispX, y: dispY } = activeDisplay.workArea;
      const qaWidth = 520;
      const qaHeight = 68;

      quickAddWindow = new BrowserWindow({
        width: qaWidth,
        height: qaHeight,
        x: dispX + Math.round((dispWidth - qaWidth) / 2),
        y: dispY + Math.round(dispHeight * 0.3),
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: true,
        show: false,
        title: 'Quick Add',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      quickAddWindow.loadFile('quickadd.html');
      quickAddWindow.once('ready-to-show', () => quickAddWindow.show());

      quickAddWindow.on('blur', () => {
        if (quickAddWindow && !quickAddWindow.isDestroyed()) {
          quickAddWindow.close();
        }
      });

      quickAddWindow.on('closed', () => {
        quickAddWindow = null;
      });
    }

    ipcMain.on('quick-add-save', (_, text) => {
      if (!text || !text.trim()) {
        if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close();
        return;
      }

      const parsed = parseQuickAddText(text.trim());

      if (parsed.isTask) {
        if (!storeData.todos) storeData.todos = [];
        storeData.todos.unshift({
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          text: parsed.text,
          completed: false,
          priority: parsed.priority || 'none',
          dueDate: parsed.dueDate || null,
          timestamp: new Date().toISOString()
        });
      } else {
        if (!storeData.notes) storeData.notes = [];
        storeData.notes.unshift({
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          text: parsed.text,
          category: 'personal',
          timestamp: new Date().toISOString()
        });
      }

      saveStore(storeData);

      // Notify main window to refresh data
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('data-changed');
      }

      if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close();
    });

    ipcMain.on('quick-add-close', () => {
      if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close();
    });

    // ─── Smart Quick Add Parser ──────────────────────────
    function parseQuickAddText(text) {
      let isTask = false;
      let priority = 'none';
      let dueDate = null;
      let cleanText = text;

      // Extract explicit /task or /note
      if (/^\/task\b/i.test(cleanText)) {
        isTask = true;
        cleanText = cleanText.replace(/^\/task\s*/i, '').trim();
      } else if (/^\/note\b/i.test(cleanText)) {
        isTask = false;
        cleanText = cleanText.replace(/^\/note\s*/i, '').trim();
      }

      // Detect priority: !high, !h, #high
      const priMatch = cleanText.match(/[!#](high|medium|low|h|m|l)\b/i);
      if (priMatch) {
        const p = priMatch[1].toLowerCase();
        priority = p === 'h' ? 'high' : p === 'm' ? 'medium' : p === 'l' ? 'low' : p;
        cleanText = cleanText.replace(priMatch[0], '').trim();
        isTask = true;
      }

      // Use chrono for natural language date parsing
      try {
        const results = chrono.parse(cleanText);
        if (results && results.length > 0) {
          const _d = results[0].start.date();
          dueDate = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
          cleanText = cleanText.replace(results[0].text, '').replace(/\s+/g, ' ').trim();
          isTask = true; 
        }
      } catch (e) {
        console.error("Quick Add Chrono Error:", e);
      }

      // Fallback: If has due date or priority, force it to be a task
      if (dueDate || priority !== 'none') isTask = true;

      return { text: cleanText, isTask, priority, dueDate };
    }

    // ─── Rich Links ────────────────────────────────────────
    ipcMain.handle('fetch-link-preview', async (e, url) => {
      try {
        const data = await getLinkPreview(url, {
          imagesPropertyType: "og", // fetch OpenGraph image
          timeout: 4000
        });
        return {
          title: data.title,
          description: data.description,
          image: data.images ? data.images[0] : null,
          url: data.url
        };
      } catch (err) {
        console.error("Link preview fetch failed:", err);
        return null;
      }
    });

    // ─── Mini Timer (PiP) ─────────────────────────────────
    ipcMain.on('pop-out-timer', (_, timerState) => {
      createMiniTimerWindow(timerState);
    });

    ipcMain.on('mini-timer-close', () => {
      if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
        miniTimerWindow.close();
      }
      openMainFromFab();
    });

    ipcMain.on('mini-timer-update', (_, timerState) => {
      const state = {
        remaining: timerState.remaining,
        duration: timerState.duration,
        running: timerState.running
      };
      if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
        miniTimerWindow.webContents.send('timer-sync', timerState);
      }
      if (fabWindow && !fabWindow.isDestroyed()) {
        fabWindow.webContents.send('fab-timer-sync', state);
      }
    });

    function createMiniTimerWindow(initialState) {
      if (miniTimerWindow) {
        miniTimerWindow.show();
        return;
      }

      const activeDisplay = getActiveDisplay();
      const { width: dispWidth } = activeDisplay.workAreaSize;
      const { x: dispX, y: dispY } = activeDisplay.workArea;

      miniTimerWindow = new BrowserWindow({
        width: 180,
        height: 56,
        x: dispX + dispWidth - 200,
        y: dispY + 20,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: true,
        title: 'Focus Timer',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      miniTimerWindow.loadFile('mini-timer.html');
      miniTimerWindow.setAlwaysOnTop(true, 'screen-saver');

      miniTimerWindow.webContents.once('did-finish-load', () => {
        if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
          miniTimerWindow.webContents.send('timer-sync', initialState);
        }
      });

      miniTimerWindow.on('closed', () => {
        miniTimerWindow = null;
      });

      // Minimize main window when mini timer is shown
      minimizeToFab();
    }

    // Global shortcuts
    globalShortcut.register('CommandOrControl+Shift+N', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      
      if (mainWindow.isVisible()) {
        hideMainWindow();
      } else {
        showMainWindow();
      }
    });

    // ─── Global Clipboard Injection ──────────────────────
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      // 1. Fire a native Ctrl+C mechanical OS interrupt without stealing GUI Focus
      exec(`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^c')"`, { timeout: 1500 }, (err) => {
        
        // 2. Wait exactly 350ms for Windows to populate the clipboard buffer
        setTimeout(async () => {
          const newText = clipboard.readText().trim();
          
          if (!newText) return;

          if (!storeData.notes) storeData.notes = [];
          storeData.notes.unshift({
            id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
            text: newText,
            category: 'personal',
            timestamp: new Date().toISOString()
          });

          saveStore(storeData);

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('data-changed', 'clipboard');
          }

          if (Notification.isSupported()) {
            const preview = newText.length > 60 ? newText.substring(0, 60) + '...' : newText;
            const notif = new Notification({
              title: 'Clipped to Doing It',
              body: preview,
              silent: true
            });
            notif.show();
          }
        }, 350);
      });
    });

    // ─── Open File Path (for drag & drop shortcuts) ─────
    ipcMain.on('open-file-path', (_, filePath) => {
      if (filePath && typeof filePath === 'string') {
        shell.openPath(filePath).catch(err => console.error('Failed to open path:', err));
      }
    });

    // ─── Open External URL (for markdown links) ─────────
    ipcMain.on('open-external-url', (_, url) => {
      if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        shell.openExternal(url).catch(err => console.error('Failed to open URL:', err));
      }
    });

    // ─── Active Window Detection (PowerShell) ───────────
    ipcMain.handle('get-active-window', async () => {
      return new Promise((resolve) => {
        const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinAPI {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@
$h = [WinAPI]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[WinAPI]::GetWindowText($h, $sb, 512)
$sb.ToString()
`;
        exec(`powershell -NoProfile -Command "${ps.replace(/"/g, '\"').replace(/\n/g, ' ')}"`, { timeout: 2000 }, (err, stdout) => {
          if (err) { resolve(null); return; }
          const title = (stdout || '').trim();
          resolve(title || null);
        });
      });
    });

    // ─── Local Image Pasting ────────────────────────────
    ipcMain.handle('save-buffer-image', async (event, arrayBuffer) => {
      try {
        if (!arrayBuffer) return null;
        const Buffer = require('buffer').Buffer;
        const imgBuffer = Buffer.from(arrayBuffer);

        const storeFilePath = getStoreFilePath();
        const imagesDir = path.join(path.dirname(storeFilePath), 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        const fileName = `img-${Date.now()}.png`;
        const filePath = path.join(imagesDir, fileName);
        fs.writeFileSync(filePath, imgBuffer);

        return filePath;
      } catch (e) {
        console.error('Buffer image paste failed:', e);
        return null;
      }
    });

    ipcMain.handle('save-clipboard-image', async () => {
      try {
        let img = clipboard.readImage();
        
        if (img.isEmpty()) {
          const fileUrlBytes = clipboard.readBuffer('FileNameW');
          if (fileUrlBytes.length > 0) {
            const parsedUrl = fileUrlBytes.toString('utf16le').replace(/\0/g, '');
            if (parsedUrl && fs.existsSync(parsedUrl)) {
              if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(parsedUrl)) {
                const { nativeImage } = require('electron');
                img = nativeImage.createFromPath(parsedUrl);
              }
            }
          }
        }
        
        if (img.isEmpty()) return null;

        const storeFilePath = getStoreFilePath();
        const imagesDir = path.join(path.dirname(storeFilePath), 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        const fileName = `img-${Date.now()}.png`;
        const filePath = path.join(imagesDir, fileName);
        fs.writeFileSync(filePath, img.toPNG());

        return filePath;
      } catch (e) {
        console.error('Image paste failed:', e);
        return null;
      }
    });

    // ─── Focus Assist (Do Not Disturb) ─────────────────
    ipcMain.handle('toggle-focus-assist', async (_, state) => {
      try {
        const regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings';
        const value = state === 'on' ? 0 : 1;
        const ps = `New-ItemProperty -Path '${regPath}' -Name 'NOC_GLOBAL_SETTING_TOASTS_ENABLED' -Value ${value} -PropertyType DWORD -Force | Out-Null`;
        exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 3000 }, (err) => {
          if (err) console.error('Focus Assist toggle failed:', err);
        });
        return true;
      } catch (e) {
        console.error('Focus Assist error:', e);
        return false;
      }
    });

    // ─── Silent Image Garbage Collection ────────────────
    setTimeout(() => {
      try {
        const storeFilePath = getStoreFilePath();
        const imagesDir = path.join(path.dirname(storeFilePath), 'images');
        if (!fs.existsSync(imagesDir)) return;

        // Read the store to find referenced images
        let storeData = {};
        try { storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8')); } catch (e) { return; }
        const referencedImages = new Set();
        (storeData.notes || []).forEach(n => {
          if (n.image) referencedImages.add(path.basename(n.image));
        });

        // Scan images directory and delete orphans
        const files = fs.readdirSync(imagesDir);
        let cleaned = 0;
        files.forEach(f => {
          if (f.endsWith('.png') && !referencedImages.has(f)) {
            try {
              fs.unlinkSync(path.join(imagesDir, f));
              cleaned++;
            } catch (e) { /* ignore individual file errors */ }
          }
        });
        if (cleaned > 0) console.log(`Image GC: cleaned ${cleaned} orphaned image(s)`);
      } catch (e) {
        console.error('Image GC error:', e);
      }
    }, 30000); // Run 30 seconds after boot

    // ─── .ics Calendar Sync ─────────────────────────────
    ipcMain.handle('fetch-ics-calendar', async (_, icsUrl) => {
      if (!icsUrl || typeof icsUrl !== 'string') return [];

      return new Promise((resolve) => {
        const client = icsUrl.startsWith('https') ? https : http;
        const req = client.get(icsUrl, { timeout: 10000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const events = parseICS(data);
              resolve(events);
            } catch (e) {
              console.error('ICS parse error:', e);
              resolve([]);
            }
          });
        });
        req.on('error', (e) => {
          console.error('ICS fetch error:', e);
          resolve([]);
        });
        req.on('timeout', () => {
          req.destroy();
          console.error('ICS fetch timed out');
          resolve([]);
        });
      });
    });

    // Lightweight .ics parser
    function parseICS(icsText) {
      // Unfold lines per RFC 5545 (long lines are folded with CRLF + space/tab)
      icsText = icsText.replace(/\r?\n[ \t]/g, '');
      const events = [];
      const blocks = icsText.split('BEGIN:VEVENT');
      for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i].split('END:VEVENT')[0];
        const event = {};

        const summaryMatch = block.match(/SUMMARY[^:]*:(.*)/i);
        if (summaryMatch) event.summary = summaryMatch[1].trim();

        const dtStartMatch = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/i);
        if (dtStartMatch) {
          const d = dtStartMatch[1];
          event.date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
          if (d.length >= 13) {
            event.time = `${d.slice(9,11)}:${d.slice(11,13)}`;
          }
        }

        const dtEndMatch = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/i);
        if (dtEndMatch) {
          const d = dtEndMatch[1];
          event.endDate = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
        }

        const descMatch = block.match(/DESCRIPTION[^:]*:(.*)/i);
        if (descMatch) event.description = descMatch[1].trim().replace(/\\n/g, '\n');

        const locMatch = block.match(/LOCATION[^:]*:(.*)/i);
        if (locMatch) event.location = locMatch[1].trim();

        // Detect meeting links
        const meetingLinkMatch = (event.description || event.location || '').match(
          /(https:\/\/[^ ]*(?:zoom\.us|teams\.microsoft\.com|meet\.google\.com)[^ ]*)/i
        );
        if (meetingLinkMatch) event.meetingLink = meetingLinkMatch[1];

        if (event.summary && event.date) events.push(event);
      }
      return events;
    }

    // ─── Edge Dock IPC ──────────────────────────────────
    ipcMain.handle('get-dock-state', () => isDocked);

    ipcMain.on('undock-window', () => {
      if (mainWindow && isDocked) {
        isDocked = false;
        const activeDisplay = getActiveDisplay();
        const workArea = activeDisplay.workArea;
        mainWindow.setBounds({
          x: workArea.x + workArea.width - 420,
          y: workArea.y + Math.round((workArea.height - 650) / 2),
          width: 400,
          height: 650
        }, true);
        mainWindow.webContents.send('dock-state-changed', false);
      }
    });

    // ─── Smart Timer: Lock Screen Detection ──────────────
    powerMonitor.on('lock-screen', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer-pause');
      }
    });

    powerMonitor.on('unlock-screen', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer-resumed');
      }
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (tray) { tray.destroy(); tray = null; }
  });

  app.on('window-all-closed', () => {
    // Don't quit — FAB or tray keeps the app alive
  });
}
}
