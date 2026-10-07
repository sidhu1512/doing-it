const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Force 2x device scale factor for razor-sharp Retina/4K screenshots
app.commandLine.appendSwitch('force-device-scale-factor', '2');
app.setAppUserModelId('com.doingit.desktop.capture');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const { setupIpcHandlers } = require('../src/main/ipc');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-all-views-'));
const storeManager = new StoreManager(tmpDir);
storeManager.initStore();

storeManager.storeData.windowSize = { width: 440, height: 720 };
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
// 3. Analytics & Focus History (84 days = 12 weeks of rich distributed sessions)
storeManager.storeData.focusHistory = [];
const sessionHours = [9, 10, 11, 14, 15, 16];
const sessionDurations = [25, 30, 45, 50, 40, 35];

for (let d = 0; d < 84; d++) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  const dStr = dt.toISOString().split('T')[0];
  const dayOfWeek = dt.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  const count = isWeekend ? (d % 2 === 0 ? 1 : 2) : (3 + (d % 3));

  for (let c = 0; c < count; c++) {
    const hour = sessionHours[(c + d) % sessionHours.length];
    const minute = (c * 15) % 60;
    const dur = sessionDurations[(c * 2 + d) % sessionDurations.length];
    const dtObj = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), hour, minute, 0);

    storeManager.storeData.focusHistory.push({
      id: 2000 + d * 10 + c,
      date: dStr,
      startTime: dtObj.toISOString(),
      durationMinutes: dur,
      taskTitle: c % 2 === 0 ? 'Deep Work Flow Sprint' : 'Architecture & Code Review',
      activeApps: ['VS Code', 'Chrome']
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
    text: '### Daily Scratchpad\n\n- [x] Refine Aceternity UI Light Design System (#fafafa)\n- [x] Verify razor-sharp multi-resolution favicons\n- [ ] Deploy live GitHub Pages release\n\n> "Productivity is deliberate focus sustained without friction."',
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
  theme: 'light',
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

  // Suppress all toast notifications across all views for clean artifact capture
  await mainWin.webContents.executeJavaScript(`
    document.documentElement.setAttribute('data-theme', 'light');
    if (window.toast) {
      window.toast.show = () => {};
    }
    const tc = document.getElementById('toast-container');
    if (tc) {
      tc.innerHTML = '';
      tc.style.display = 'none';
    }
  `);

  // 1. Tasks View
  await mainWin.webContents.executeJavaScript(`
    document.documentElement.setAttribute('data-theme', 'light');
    if (window.appStore) window.appStore.set('theme', 'light');
    if (window.appStore) window.appStore.set('activeView', 'tasks');
    if (window.appStore) window.appStore.set('settingsOpen', false);
    if (window.appStore) window.appStore.set('paletteOpen', false);
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
  await sleep(300);
  await mainWin.webContents.executeJavaScript(`
    const scratch = document.getElementById('scratchpad-area');
    if (scratch) scratch.style.height = '44px';
    const container = document.querySelector('#view-notes .view-container') || document.querySelector('.notes-container');
    if (container) container.scrollTop = 0;
  `);
  await sleep(300);
  await saveScreenshot('notes-view.png');

  // 6. Planner View (with real 1-click meeting join buttons)
  await mainWin.webContents.executeJavaScript(`
    const todayStr = new Date().toISOString().split('T')[0];
    window.appStore.set('calendarEvents', [
      {
        id: 'cal-1',
        title: 'Doing It v4.4 Sprint Architecture Sync',
        startDate: todayStr + 'T11:00:00',
        endDate: todayStr + 'T11:45:00',
        location: 'Google Meet',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        meetingPlatform: 'Google Meet'
      },
      {
        id: 'cal-2',
        title: 'Design Review & Aceternity UI Showcase',
        startDate: todayStr + 'T14:30:00',
        endDate: todayStr + 'T15:15:00',
        location: 'Zoom Meeting',
        meetingUrl: 'https://zoom.us/j/1234567890',
        meetingPlatform: 'Zoom'
      }
    ]);
    window.appStore.set('activeView', 'planner');
  `);
  await sleep(600);
  await saveScreenshot('planner-view.png');

  // 7. Settings Modal (with clean, realistic storage path)
  await mainWin.webContents.executeJavaScript(`
    if (window.api) window.api.getCurrentStorePath = async () => 'C:\\\\Users\\\\Alex\\\\AppData\\\\Roaming\\\\doing-it';
    window.appStore.set('settingsOpen', true);
  `);
  await sleep(600);
  await mainWin.webContents.executeJavaScript(`
    const p = document.getElementById('inapp-settings-path');
    if (p) p.textContent = 'C:\\\\Users\\\\Alex\\\\AppData\\\\Roaming\\\\doing-it';
  `);
  await sleep(200);
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
  await miniWin.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme', 'light');`);
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
  await quickWin.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme', 'light');`);
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
  await fabWin.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme', 'light');`);
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
