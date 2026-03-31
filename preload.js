const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Notes
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),

  // Todos
  getTodos: () => ipcRenderer.invoke('get-todos'),
  saveTodos: (todos) => ipcRenderer.invoke('save-todos', todos),

  // Reminders
  getReminders: () => ipcRenderer.invoke('get-reminders'),
  saveReminders: (reminders) => ipcRenderer.invoke('save-reminders', reminders),

  // Pomodoro
  getPomodoro: () => ipcRenderer.invoke('get-pomodoro'),
  savePomodoro: (state) => ipcRenderer.invoke('save-pomodoro', state),

  // Moods
  getMoods: () => ipcRenderer.invoke('get-moods'),
  saveMoods: (moods) => ipcRenderer.invoke('save-moods', moods),

  // Settings / BYOC
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  getCurrentStorePath: () => ipcRenderer.invoke('get-current-store-path'),
  openSettingsWindow: () => ipcRenderer.send('open-settings-window'),
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'),
  notifySettingsChanged: () => ipcRenderer.send('notify-settings-changed'),
  onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', () => callback()),

  // Window controls
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  // FAB
  fabClicked: () => ipcRenderer.send('fab-clicked'),
  moveFab: (x, y) => ipcRenderer.send('move-fab', x, y),
  getFabPosition: () => ipcRenderer.invoke('get-fab-position'),
  toggleFab: (disableFab) => ipcRenderer.invoke('toggle-fab', disableFab),

  // System notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),

  // Quick Add
  quickAddSave: (text) => ipcRenderer.send('quick-add-save', text),
  quickAddClose: () => ipcRenderer.send('quick-add-close'),

  // Mini Timer (PiP)
  popOutTimer: (timerState) => ipcRenderer.send('pop-out-timer', timerState),
  miniTimerClose: () => ipcRenderer.send('mini-timer-close'),
  miniTimerUpdate: (timerState) => ipcRenderer.send('mini-timer-update', timerState),
  onTimerSync: (callback) => ipcRenderer.on('timer-sync', (_, state) => callback(state)),
  onFabTimerSync: (callback) => ipcRenderer.on('fab-timer-sync', (_, state) => callback(state)),

  // Smart Timer (lock screen)
  onTimerPause: (callback) => ipcRenderer.on('timer-pause', () => callback()),
  onTimerResume: (callback) => ipcRenderer.on('timer-resumed', () => callback()),

  // File shortcuts (drag & drop)
  openFilePath: (filePath) => ipcRenderer.send('open-file-path', filePath),

  // External URLs (markdown links)
  openExternalUrl: (url) => ipcRenderer.send('open-external-url', url),

  // Active Window Detection
  getActiveWindow: () => ipcRenderer.invoke('get-active-window'),

  // Image Pasting
  saveClipboardImage: () => ipcRenderer.invoke('save-clipboard-image'),
  saveBufferImage: (buffer) => ipcRenderer.invoke('save-buffer-image', buffer),

  // NLP / Parsing
  parseNLP: (text) => ipcRenderer.invoke('parse-nlp', text),
  fetchLinkPreview: (url) => ipcRenderer.invoke('fetch-link-preview', url),

  // .ics Calendar Sync
  fetchIcsCalendar: (url) => ipcRenderer.invoke('fetch-ics-calendar', url),

  // Edge Docking
  getDockState: () => ipcRenderer.invoke('get-dock-state'),
  undockWindow: () => ipcRenderer.send('undock-window'),
  onDockStateChanged: (callback) => ipcRenderer.on('dock-state-changed', (_, docked) => callback(docked)),

  // Focus Assist (DND)
  toggleFocusAssist: (state) => ipcRenderer.invoke('toggle-focus-assist', state),

  // Data sync (from quick add / clipboard)
  onDataChanged: (callback) => ipcRenderer.on('data-changed', (_, source) => callback(source))
});
