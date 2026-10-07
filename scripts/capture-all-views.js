const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const { setupIpcHandlers } = require('../src/main/ipc');

app.setAppUserModelId('com.doingit.desktop.capture');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-all-views-'));
const storeManager = new StoreManager(tmpDir);
storeManager.initStore();

const todayStr = new Date().toISOString().split('T')[0];

// 1. Rich Todos & Habits
storeManager.storeData.todos = [
  { id: 1, text: 'Ship Doing It v4.4 Aceternity UI Showcase', completed: false, priority: 'high', dueDate: todayStr },
  { id: 2, text: 'Review 24h Circadian Energy & Rhythm Score', completed: false, priority: 'medium', dueDate: todayStr },
  { id: 3, text: 'Sync RFC 5545 iCalendar Video Meeting Links', completed: false, priority: 'high', dueDate: todayStr },
  { id: 4, text: 'Daily Morning Deep Work Session', isHabit: true, streak: 8, completed: true },
  { id: 5, text: 'Synthesize Lo-Fi Ambient Soundscape & Binaural Beats', completed: true, priority: 'none', dueDate: null },
  { id: 6, text: 'Inspect Native Spotify Desktop Process Playback', completed: true, priority: 'medium', dueDate: null }
];

// 2. Day One Diary
storeManager.storeData.diary = [
  {
    id: 101,
    date: todayStr,
    time: '09:15',
    journal: 'work',
    title: 'Morning Flow State & High Intentions',
    text: 'Zero friction morning. Pinned Doing It next to VS Code. Captured 6 agenda items via Raycast Ctrl+K. Voice memo attached below summarizing architecture decisions.',
    mood: 'great',
    energy: 5,
    starred: true,
    tags: ['milestone', 'launch', 'deep-work'],
    context: 'Visual Studio Code',
    audio: {
      filePath: 'memo-launch.webm',
      mediaUrl: '',
      duration: 46
    }
  },
  {
    id: 102,
    date: todayStr,
    time: '14:30',
    journal: 'personal',
    title: 'Midday Architecture & Energy Check',
    text: 'Atomic staging JSON writes verified. The 100% local-first model feels instantaneous. Productivity rhythm score hit 94 today.',
    mood: 'good',
    energy: 4,
    starred: false,
    tags: ['engineering', 'design']
  }
];

// 3. Analytics & Focus History
storeManager.storeData.focusHistory = [
  { id: 201, date: todayStr, startTime: `${todayStr}T09:00:00Z`, durationMinutes: 50, taskTitle: 'Ship v4.4 Showcase', activeApps: ['VS Code', 'Chrome'] },
  { id: 202, date: todayStr, startTime: `${todayStr}T10:15:00Z`, durationMinutes: 45, taskTitle: 'Circadian Heuristics Engine', activeApps: ['VS Code'] },
  { id: 203, date: todayStr, startTime: `${todayStr}T11:30:00Z`, durationMinutes: 30, taskTitle: 'Day Planner Calendar Sync', activeApps: ['Outlook', 'VS Code'] },
  { id: 204, date: todayStr, startTime: `${todayStr}T14:00:00Z`, durationMinutes: 40, taskTitle: 'Spotify Native Integration', activeApps: ['Spotify', 'VS Code'] },
  { id: 205, date: todayStr, startTime: `${todayStr}T15:00:00Z`, durationMinutes: 35, taskTitle: 'Procedural Audio Synthesizer', activeApps: ['VS Code'] }
];

// Generate 40 days of focus history for dense GitHub-style heatmap
for (let d = 1; d <= 45; d++) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  const dStr = dt.toISOString().split('T')[0];
  const count = (d % 6 === 0) ? 1 : (d % 3 === 0) ? 4 : 3;
  for (let c = 0; c < count; c++) {
    storeManager.storeData.focusHistory.push({
      id: 300 + d * 10 + c,
      date: dStr,
      startTime: `${dStr}T10:00:00Z`,
      durationMinutes: 25 + (c * 10),
      taskTitle: 'Focused Engineering Sprint',
      activeApps: ['VS Code']
    });
  }
}

// 4. Notes & Scratchpad
storeManager.storeData.notes = [
  {
    id: 401,
    text: '### Engineering Architecture v4.4\n\n- **Local-First**: Atomic JSON staging prevents data corruption on crash\n- **Procedural Audio**: Web Audio zero-byte noise synthesizer\n- **Raycast Palette**: Global `Ctrl+K` entity & command routing\n- **Spotify Link**: Windows process link with live song polling\n\nCheck repository at https://github.com/sidhu1512/doing-it #docs',
    pinned: true,
    timestamp: new Date().toISOString()
  },
  {
    id: 402,
    text: '### Daily Scratchpad\n\n- [x] Polish dark obsidian theme (#030712)\n- [x] Verify razor-sharp multi-resolution favicons\n- [ ] Deploy live GitHub Pages release\n\n> "Productivity is deliberate focus sustained without friction."',
    pinned: false,
    timestamp: new Date().toISOString()
  }
];

// 5. Day Planner / Agenda
storeManager.storeData.calendar = {
  icsUrl: 'https://example.com/calendar.ics',
  lastSync: new Date().toISOString(),
  events: [
    {
      id: 'cal-1',
      title: 'Doing It v4.4 Sprint Architecture Sync',
      start: `${todayStr}T11:00:00`,
      end: `${todayStr}T11:45:00`,
      location: 'Google Meet',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingType: 'google-meet'
    },
    {
      id: 'cal-2',
      title: 'Design Review & Aceternity UI Showcase',
      start: `${todayStr}T14:30:00`,
      end: `${todayStr}T15:15:00`,
      location: 'Zoom Meeting',
      meetingUrl: 'https://zoom.us/j/1234567890',
      meetingType: 'zoom'
    }
  ]
};

// 6. Settings
storeManager.storeData.settings = {
  theme: '',
  alwaysOnTop: true,
  edgeDocking: true,
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

  const mainWin = windowManager.createMainWindow(false);
  await new Promise(r => mainWin.webContents.once('did-finish-load', r));
  await sleep(1200);

  const targetDirs = [
    path.join(projectRoot, 'imgs'),
    path.join(projectRoot, 'docs', 'imgs')
  ];

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  async function saveScreenshot(filename) {
    const img = await mainWin.webContents.capturePage();
    const png = img.toPNG();
    targetDirs.forEach(dir => {
      fs.writeFileSync(path.join(dir, filename), png);
    });
    console.log(`✔ Captured ${filename} (${img.getSize().width}x${img.getSize().height})`);
  }

  // 1. Tasks View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'tasks');
    window.appStore.set('settingsOpen', false);
    window.appStore.set('paletteOpen', false);
  `);
  await sleep(600);
  await saveScreenshot('tasks-view.png');

  // 2. Day One Diary View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'diary');
  `);
  await sleep(600);
  await saveScreenshot('diary-view.png');

  // 3. Analytics View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'analytics');
  `);
  await sleep(600);
  await saveScreenshot('analytics-view.png');

  // 4. Focus View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'focus');
  `);
  await sleep(600);
  await saveScreenshot('focus-view.png');

  // 5. Notes View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'notes');
  `);
  await sleep(600);
  await saveScreenshot('notes-view.png');

  // 6. Planner View
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'planner');
  `);
  await sleep(600);
  await saveScreenshot('planner-view.png');

  // 7. Settings Modal
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('settingsOpen', true);
  `);
  await sleep(600);
  await saveScreenshot('settings-view.png');

  // 8. Command Palette
  await mainWin.webContents.executeJavaScript(`
    window.appStore.set('settingsOpen', false);
    window.appStore.set('paletteOpen', true);
  `);
  await sleep(600);
  await saveScreenshot('palette-view.png');

  // 9. Mini Timer
  const miniWin = windowManager.createMiniTimerWindow({ remaining: 1122, duration: 1500, running: true, task: 'Ship Doing It v4.4 Aceternity UI' });
  await new Promise(r => miniWin.webContents.once('did-finish-load', r));
  await sleep(600);
  const miniImg = await miniWin.webContents.capturePage();
  targetDirs.forEach(dir => {
    fs.writeFileSync(path.join(dir, 'mini-timer.png'), miniImg.toPNG());
  });
  console.log(`✔ Captured mini-timer.png (${miniImg.getSize().width}x${miniImg.getSize().height})`);
  miniWin.close();

  // 10. Quick Add
  const quickWin = windowManager.createQuickAddWindow();
  await new Promise(r => quickWin.webContents.once('did-finish-load', r));
  await sleep(600);
  const quickImg = await quickWin.webContents.capturePage();
  targetDirs.forEach(dir => {
    fs.writeFileSync(path.join(dir, 'quick-add.png'), quickImg.toPNG());
  });
  console.log(`✔ Captured quick-add.png (${quickImg.getSize().width}x${quickImg.getSize().height})`);
  quickWin.close();

  // 11. FAB Overlay Bubble
  const fabWin = windowManager.createFabWindow();
  await new Promise(r => fabWin.webContents.once('did-finish-load', r));
  await sleep(600);
  const fabImg = await fabWin.webContents.capturePage();
  targetDirs.forEach(dir => {
    fs.writeFileSync(path.join(dir, 'fab-overlay.png'), fabImg.toPNG());
  });
  console.log(`✔ Captured fab-overlay.png (${fabImg.getSize().width}x${fabImg.getSize().height})`);
  fabWin.close();

  mainWin.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  console.log('✨ All 11 views captured flawlessly and saved to both imgs/ and docs/imgs/!');
  app.exit(0);
});
