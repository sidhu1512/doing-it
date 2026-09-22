const { ipcMain, dialog, Notification, shell, clipboard, nativeImage, app } = require('electron');
const path = require('path');
const fs = require('fs');
const chrono = require('chrono-node');
const { getLinkPreview } = require('link-preview-js');

function setupIpcHandlers(storeManager, windowManager, system) {
  // Store CRUD
  ipcMain.handle('get-notes', () => storeManager.storeData.notes || []);
  ipcMain.handle('save-notes', (_, notes) => {
    storeManager.storeData.notes = notes;
    storeManager.saveStore();
    return true;
  });

  ipcMain.handle('get-todos', () => storeManager.storeData.todos || []);
  ipcMain.handle('save-todos', (_, todos) => {
    storeManager.storeData.todos = todos;
    storeManager.saveStore();
    return true;
  });

  ipcMain.handle('get-reminders', () => storeManager.storeData.reminders || []);
  ipcMain.handle('save-reminders', (_, reminders) => {
    storeManager.storeData.reminders = reminders;
    storeManager.saveStore();
    return true;
  });

  ipcMain.handle('get-moods', () => storeManager.storeData.moods || {});
  ipcMain.handle('save-moods', (_, moods) => {
    storeManager.storeData.moods = moods;
    storeManager.saveStore();
    return true;
  });

  ipcMain.handle('get-pomodoro', () => storeManager.storeData.pomodoro);
  ipcMain.handle('save-pomodoro', (_, state) => {
    storeManager.storeData.pomodoro = state;
    storeManager.saveStore();
    return true;
  });

  // Settings & Storage Migration
  ipcMain.handle('get-settings', () => storeManager.storeData.settings || { savePath: null });
  ipcMain.handle('save-settings', (_, settings) => {
    const oldPath = storeManager.storeData.settings?.savePath;
    storeManager.storeData.settings = settings;

    if (settings.savePath && settings.savePath !== oldPath) {
      storeManager.migrateSavePath(settings.savePath);
    } else {
      storeManager.saveStore();
    }

    if (settings.theme !== undefined) {
      windowManager.broadcastTheme(settings.theme);
    }

    if (settings.launchAtStartup !== undefined && app.isPackaged) {
      try {
        app.setLoginItemSettings({
          openAtLogin: !!settings.launchAtStartup,
          path: process.execPath,
          args: ['--autostart']
        });
      } catch (e) {
        console.error('[IPC] Failed to update login item settings:', e);
      }
    }

    return true;
  });

  ipcMain.handle('choose-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Choose storage location for Doing It data'
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('get-current-store-path', () => {
    return path.dirname(storeManager.getStoreFilePath());
  });

  // Windows Controls
  ipcMain.on('close-window', () => {
    const { app } = require('electron');
    app.quit();
  });
  ipcMain.on('minimize-window', () => windowManager.minimizeToFab());

  // Settings In-App Panel
  ipcMain.on('open-settings-window', () => {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.showMainWindow();
      windowManager.mainWindow.webContents.send('open-inapp-settings');
    }
  });
  ipcMain.on('close-settings-window', () => {
    if (windowManager.settingsWindow && !windowManager.settingsWindow.isDestroyed()) {
      windowManager.settingsWindow.close();
    }
  });
  ipcMain.on('notify-settings-changed', () => {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.mainWindow.webContents.send('settings-changed');
    }
  });

  // App Uninstallation Trigger
  ipcMain.on('uninstall-app', () => {
    const { spawn } = require('child_process');
    const { app, dialog } = require('electron');
    const appDir = path.dirname(process.execPath);
    const uninstallerPath = path.join(appDir, 'Uninstall Doing It.exe');

    if (fs.existsSync(uninstallerPath)) {
      spawn(uninstallerPath, [], { detached: true, stdio: 'ignore' });
      app.quit();
    } else {
      const localUninstaller = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'doing-it', 'Uninstall Doing It.exe');
      if (fs.existsSync(localUninstaller)) {
        spawn(localUninstaller, [], { detached: true, stdio: 'ignore' });
        app.quit();
      } else {
        dialog.showMessageBoxSync({
          type: 'info',
          title: 'Uninstall Doing It',
          message: 'Running in development mode. To uninstall the installed app, run "Uninstall Doing It" from your Windows Start Menu.'
        });
      }
    }
  });

  // FAB Events
  ipcMain.on('fab-clicked', () => windowManager.openMainFromFab());
  ipcMain.on('move-fab', (_, x, y) => {
    if (windowManager.fabWindow && !windowManager.fabWindow.isDestroyed()) {
      windowManager.fabWindow.setPosition(Math.round(x), Math.round(y), false);
      storeManager.storeData.fabPosition = { x: Math.round(x), y: Math.round(y) };
      storeManager.saveStore();
    }
  });
  ipcMain.handle('get-fab-position', () => {
    if (windowManager.fabWindow && !windowManager.fabWindow.isDestroyed()) {
      const [x, y] = windowManager.fabWindow.getPosition();
      return { x, y };
    }
    return storeManager.storeData.fabPosition || { x: 0, y: 0 };
  });
  ipcMain.handle('toggle-fab', (_, disableFab) => {
    windowManager.toggleFab(disableFab);
    return true;
  });

  // Quick Add
  ipcMain.on('quick-add-save', (_, text) => {
    if (!text || !text.trim()) {
      if (windowManager.quickAddWindow && !windowManager.quickAddWindow.isDestroyed()) {
        windowManager.quickAddWindow.close();
      }
      return;
    }

    const parsed = parseQuickAddText(text.trim());

    if (parsed.isTask) {
      if (!storeManager.storeData.todos) storeManager.storeData.todos = [];
      storeManager.storeData.todos.unshift({
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        text: parsed.text,
        completed: false,
        priority: parsed.priority || 'none',
        dueDate: parsed.dueDate || null,
        timestamp: new Date().toISOString()
      });
    } else {
      if (!storeManager.storeData.notes) storeManager.storeData.notes = [];
      storeManager.storeData.notes.unshift({
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        text: parsed.text,
        category: 'personal',
        timestamp: new Date().toISOString()
      });
    }

    storeManager.saveStore();
    windowManager.broadcastDataChanged('quickadd');

    if (windowManager.quickAddWindow && !windowManager.quickAddWindow.isDestroyed()) {
      windowManager.quickAddWindow.close();
    }
  });

  ipcMain.on('quick-add-close', () => {
    if (windowManager.quickAddWindow && !windowManager.quickAddWindow.isDestroyed()) {
      windowManager.quickAddWindow.close();
    }
  });

  // Mini Timer (PiP)
  ipcMain.on('pop-out-timer', (_, timerState) => {
    windowManager.createMiniTimerWindow(timerState);
  });

  ipcMain.on('mini-timer-close', () => {
    if (windowManager.miniTimerWindow && !windowManager.miniTimerWindow.isDestroyed()) {
      windowManager.miniTimerWindow.close();
    }
    windowManager.openMainFromFab();
  });

  ipcMain.on('mini-timer-update', (_, timerState) => {
    windowManager.syncTimer(timerState);
  });

  ipcMain.on('mini-timer-toggle-play', () => {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.mainWindow.webContents.send('timer-toggle-from-mini');
    }
  });

  ipcMain.on('mini-timer-complete-task', () => {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.mainWindow.webContents.send('timer-complete-task-from-mini');
    }
  });

  // Notifications
  ipcMain.on('show-notification', (_, title, body) => {
    if (Notification.isSupported()) {
      const notif = new Notification({ title, body, silent: false });
      notif.show();
    }
  });

  // NLP Date Parsing
  ipcMain.handle('parse-nlp', (_, text) => {
    try {
      const results = chrono.parse(text);
      if (results && results.length > 0) {
        const d = results[0].start.date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const cleanText = text.replace(results[0].text, '').replace(/\s+/g, ' ').trim();
        return { date: dateStr, text: cleanText };
      }
      return { date: null, text };
    } catch (e) {
      console.error('[IPC] Chrono error:', e);
      return { date: null, text };
    }
  });

  // Rich Link Previews
  ipcMain.handle('fetch-link-preview', async (_, url) => {
    try {
      const data = await getLinkPreview(url, {
        imagesPropertyType: 'og',
        timeout: 4000
      });
      return {
        title: data.title,
        description: data.description,
        image: data.images ? data.images[0] : null,
        url: data.url
      };
    } catch (err) {
      return null;
    }
  });

  // Calendar Sync
  const CalendarService = require('./calendar');
  ipcMain.handle('fetch-ics-calendar', async (_, url) => {
    return CalendarService.fetchIcs(url);
  });

  // Shell & Files
  ipcMain.on('open-file-path', (_, filePath) => {
    if (filePath && typeof filePath === 'string') {
      shell.openPath(filePath).catch(err => console.error('[IPC] openPath error:', err));
    }
  });

  ipcMain.on('open-external-url', (_, url) => {
    if (url && typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url).catch(err => console.error('[IPC] openExternal error:', err));
    }
  });

  // Spotify Native Integration
  ipcMain.handle('get-spotify-status', async () => {
    return system.getSpotifyStatus();
  });

  ipcMain.handle('spotify-media-command', async (_, command) => {
    return system.sendMediaCommand(command);
  });

  ipcMain.on('open-spotify-uri', (_, uri) => {
    if (uri && typeof uri === 'string') {
      if (uri.startsWith('spotify:') || /^https?:\/\//i.test(uri)) {
        shell.openExternal(uri).catch(() => {
          if (uri.startsWith('spotify:playlist:')) {
            const id = uri.replace('spotify:playlist:', '');
            shell.openExternal(`https://open.spotify.com/playlist/${id}`).catch(() => {});
          } else if (uri.startsWith('spotify:track:')) {
            const id = uri.replace('spotify:track:', '');
            shell.openExternal(`https://open.spotify.com/track/${id}`).catch(() => {});
          }
        });
      }
    }
  });

  // Active Window & System
  ipcMain.handle('get-active-window', async () => {
    return system.getActiveWindowTitle();
  });

  ipcMain.handle('toggle-focus-assist', async (_, state) => {
    return system.toggleFocusAssist(state);
  });

  ipcMain.handle('get-dock-state', () => windowManager.isDocked);
  ipcMain.on('undock-window', () => windowManager.undockMainWindow());

  // Image Saving
  ipcMain.handle('save-buffer-image', async (_, arrayBuffer) => {
    try {
      if (!arrayBuffer) return null;
      const imgBuffer = Buffer.from(arrayBuffer);
      const storeFilePath = storeManager.getStoreFilePath();
      const imagesDir = path.join(path.dirname(storeFilePath), 'images');
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      const fileName = `img-${Date.now()}.png`;
      const filePath = path.join(imagesDir, fileName);
      fs.writeFileSync(filePath, imgBuffer);
      return filePath;
    } catch (e) {
      console.error('[IPC] Buffer image save error:', e);
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
          if (parsedUrl && fs.existsSync(parsedUrl) && /\.(png|jpe?g|gif|webp|bmp)$/i.test(parsedUrl)) {
            img = nativeImage.createFromPath(parsedUrl);
          }
        }
      }

      if (img.isEmpty()) return null;

      const storeFilePath = storeManager.getStoreFilePath();
      const imagesDir = path.join(path.dirname(storeFilePath), 'images');
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      const fileName = `img-${Date.now()}.png`;
      const filePath = path.join(imagesDir, fileName);
      fs.writeFileSync(filePath, img.toPNG());
      return filePath;
    } catch (e) {
      console.error('[IPC] Clipboard image save error:', e);
      return null;
    }
  });
}

function parseQuickAddText(text) {
  let isTask = false;
  let priority = 'none';
  let dueDate = null;
  let cleanText = text;

  if (/^\/task\b/i.test(cleanText)) {
    isTask = true;
    cleanText = cleanText.replace(/^\/task\s*/i, '').trim();
  } else if (/^\/note\b/i.test(cleanText)) {
    isTask = false;
    cleanText = cleanText.replace(/^\/note\s*/i, '').trim();
  }

  const priMatch = cleanText.match(/[!#](high|medium|low|h|m|l)\b/i);
  if (priMatch) {
    const p = priMatch[1].toLowerCase();
    priority = p === 'h' ? 'high' : p === 'm' ? 'medium' : p === 'l' ? 'low' : p;
    cleanText = cleanText.replace(priMatch[0], '').trim();
    isTask = true;
  }

  try {
    const results = chrono.parse(cleanText);
    if (results && results.length > 0) {
      const d = results[0].start.date();
      dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cleanText = cleanText.replace(results[0].text, '').replace(/\s+/g, ' ').trim();
      isTask = true;
    }
  } catch (e) {}

  if (dueDate || priority !== 'none') isTask = true;
  return { text: cleanText, isTask, priority, dueDate };
}

module.exports = { setupIpcHandlers, parseQuickAddText };
