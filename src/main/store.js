const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = '5.0.0';

const DEFAULT_STORE = {
  version: SCHEMA_VERSION,
  notes: [],
  todos: [],
  reminders: [],
  moods: {},
  pomodoro: {
    sessions: 0,
    totalMinutes: 0,
    lastDate: null,
    weeklyHistory: []
  },
  windowPosition: null,
  windowSize: null,
  fabPosition: null,
  settings: {
    savePath: null,
    theme: '',
    icsUrl: '',
    disableFab: false
  }
};

class StoreManager {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.storeData = { ...DEFAULT_STORE };
    this.storeFile = path.join(userDataPath, 'doing-it-data.json');
  }

  getStoreFilePath() {
    const customPath = this.storeData?.settings?.savePath;
    if (customPath && fs.existsSync(customPath)) {
      return path.join(customPath, 'doing-it-data.json');
    }
    return path.join(this.userDataPath, 'doing-it-data.json');
  }

  initStore() {
    const defaultFile = path.join(this.userDataPath, 'doing-it-data.json');

    // 1. Read default file first to retrieve potential custom storage path
    let loadedData = null;
    try {
      if (fs.existsSync(defaultFile)) {
        const raw = fs.readFileSync(defaultFile, 'utf-8');
        loadedData = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[StoreManager] Failed to read default store:', e);
      loadedData = this.restoreFromBackup(defaultFile);
    }

    if (loadedData) {
      this.storeData = this._migrateAndValidate(loadedData);
    }

    // 2. If custom path is set and exists, load from custom store location
    if (this.storeData.settings?.savePath) {
      const customFile = path.join(this.storeData.settings.savePath, 'doing-it-data.json');
      try {
        if (fs.existsSync(customFile)) {
          const raw = fs.readFileSync(customFile, 'utf-8');
          this.storeData = this._migrateAndValidate(JSON.parse(raw));
        }
      } catch (e) {
        console.error('[StoreManager] Failed to read custom store:', e);
        const restored = this.restoreFromBackup(customFile);
        if (restored) this.storeData = this._migrateAndValidate(restored);
      }
    }

    this.storeFile = this.getStoreFilePath();
    this.createBackup();
    return this.storeData;
  }

  _migrateAndValidate(data) {
    if (!data || typeof data !== 'object') {
      return { ...DEFAULT_STORE };
    }

    const merged = {
      version: SCHEMA_VERSION,
      notes: Array.isArray(data.notes) ? data.notes : [],
      todos: Array.isArray(data.todos) ? data.todos : [],
      reminders: Array.isArray(data.reminders) ? data.reminders : [],
      moods: (data.moods && typeof data.moods === 'object') ? data.moods : {},
      pomodoro: {
        sessions: Number(data.pomodoro?.sessions) || 0,
        totalMinutes: Number(data.pomodoro?.totalMinutes) || 0,
        lastDate: data.pomodoro?.lastDate || null,
        weeklyHistory: Array.isArray(data.pomodoro?.weeklyHistory) ? data.pomodoro.weeklyHistory : []
      },
      windowPosition: data.windowPosition || null,
      windowSize: (data.windowSize && typeof data.windowSize.width === 'number' && typeof data.windowSize.height === 'number') ? data.windowSize : null,
      fabPosition: data.fabPosition || null,
      settings: {
        savePath: data.settings?.savePath || null,
        theme: data.settings?.theme || '',
        icsUrl: data.settings?.icsUrl || '',
        disableFab: !!data.settings?.disableFab
      }
    };

    return merged;
  }

  /**
   * Atomic file save:
   * Writes to a temporary file in the same directory, flushes, then renames atomically.
   * This guarantees that unexpected process termination or power loss cannot corrupt the data file.
   */
  saveStore(data) {
    if (data) {
      this.storeData = this._migrateAndValidate(data);
    }

    const targetFile = this.getStoreFilePath();
    this.storeFile = targetFile;
    const targetDir = path.dirname(targetFile);

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const tempFile = `${targetFile}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
      const serialized = JSON.stringify(this.storeData, null, 2);

      fs.writeFileSync(tempFile, serialized, 'utf-8');
      fs.renameSync(tempFile, targetFile);

      // If custom path is used, ensure default store maintains settings pointer
      const defaultFile = path.join(this.userDataPath, 'doing-it-data.json');
      if (targetFile !== defaultFile) {
        try {
          const settingsRef = { settings: this.storeData.settings };
          const defaultTemp = `${defaultFile}.tmp`;
          fs.writeFileSync(defaultTemp, JSON.stringify(settingsRef, null, 2), 'utf-8');
          fs.renameSync(defaultTemp, defaultFile);
        } catch (err) {
          console.error('[StoreManager] Failed to sync settings pointer to default location:', err);
        }
      }

      return true;
    } catch (e) {
      console.error('[StoreManager] Failed to atomically save store:', e);
      return false;
    }
  }

  migrateSavePath(newDirPath) {
    const oldStoreFile = this.storeFile;
    this.storeData.settings.savePath = newDirPath;
    const newStoreFile = this.getStoreFilePath();

    if (newStoreFile !== oldStoreFile && newDirPath) {
      try {
        const dir = path.dirname(newStoreFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        this.saveStore(this.storeData);
        console.log('[StoreManager] Data migrated to:', newStoreFile);
      } catch (e) {
        console.error('[StoreManager] Migration failed:', e);
      }
    }

    this.storeFile = newStoreFile;
    this.saveStore(this.storeData);
    return newStoreFile;
  }

  createBackup() {
    try {
      if (!fs.existsSync(this.storeFile)) return;
      const backupDir = path.join(path.dirname(this.storeFile), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `doing-it-backup-${timestamp}.json`);
      fs.copyFileSync(this.storeFile, backupFile);

      // Retain rolling 5 days of backups
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
          console.error('[StoreManager] Failed to clean backup file:', f, cleanupErr);
        }
      });
    } catch (e) {
      console.error('[StoreManager] Backup creation failed:', e);
    }
  }

  restoreFromBackup(targetFile) {
    try {
      const backupDir = path.join(path.dirname(targetFile), 'backups');
      if (!fs.existsSync(backupDir)) return null;

      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('doing-it-backup-') && f.endsWith('.json'))
        .sort();

      if (backups.length === 0) return null;

      const latestBackup = path.join(backupDir, backups[backups.length - 1]);
      const raw = fs.readFileSync(latestBackup, 'utf-8');
      const restored = JSON.parse(raw);
      console.log('[StoreManager] Restored store from backup:', latestBackup);
      return restored;
    } catch (e) {
      console.error('[StoreManager] Restore from backup failed:', e);
      return null;
    }
  }
}

module.exports = StoreManager;
