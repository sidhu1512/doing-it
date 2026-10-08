const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const { setupIpcHandlers } = require('../src/main/ipc');

app.setAppUserModelId('com.doingit.desktop.capturer');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-captures-'));
const storeManager = new StoreManager(tmpDir);
storeManager.initStore();

const projectRoot = path.resolve(__dirname, '..');
const windowManager = new WindowManager(projectRoot, storeManager, SystemIntegration);

const todayStr = new Date().toISOString().split('T')[0];
const sampleTodos = [
  {
    id: 't-1',
    text: 'Finalize v4.4 production architecture & showcase',
    completed: false,
    priority: 'high',
    dueDate: todayStr,
    tags: ['release', 'architecture'],
    created: Date.now() - 3600000 * 4
  },
  {
    id: 't-2',
    text: 'Review RFC 5545 iCalendar sync payloads with team',
    completed: false,
    priority: 'medium',
    dueDate: todayStr,
    tags: ['calendar'],
    created: Date.now() - 3600000 * 3
  },
  {
    id: 't-3',
    text: 'Morning Mindfulness & Focus Calibration',
    completed: true,
    isHabit: true,
    streak: 14,
    priority: 'normal',
    dueDate: todayStr,
    created: Date.now() - 3600000 * 8
  },
  {
    id: 't-4',
    text: 'Circadian Deep Work Block (90m uninterrupted)',
    completed: true,
    isHabit: true,
    streak: 8,
    priority: 'high',
    dueDate: todayStr,
    created: Date.now() - 3600000 * 6
  },
  {
    id: 't-5',
    text: 'Polish Windows 11 Mica & Acrylic materials',
    completed: false,
    priority: 'normal',
    dueDate: todayStr,
    tags: ['design'],
    created: Date.now() - 3600000 * 2
  },
  {
    id: 't-6',
    text: 'Evening Reflection & Gratitude Log',
    completed: false,
    isHabit: true,
    streak: 21,
    priority: 'normal',
    dueDate: todayStr,
    created: Date.now() - 3600000 * 1
  }
];

const sampleDiary = [
  {
    id: 'd-1',
    journal: 'personal',
    title: 'Thursday Momentum: Deep Work & Clarity',
    text: 'Early morning architectural push went exceptionally well. Local-first JSON storage eliminates network roundtrips entirely. Feeling sharp, calm, and ready for launch sprint.\n\nKey reflection: Protect the 9am–1pm cognitive peak at all costs.',
    mood: 'great',
    energy: 5,
    starred: true,
    tags: ['flow', 'architecture', 'velocity'],
    date: todayStr,
    created: Date.now() - 3600000 * 2,
    audio: {
      filePath: 'voice-note-2026-10-08.webm',
      mediaUrl: '',
      duration: 84
    },
    context: 'Visual Studio Code'
  },
  {
    id: 'd-2',
    journal: 'work',
    title: 'Sprint Debrief: Zero-Asset Audio Engine',
    text: 'Tested the procedural Web Audio synthesizer across multiple sessions. Brown noise + 6Hz binaural beats noticeably reduced context switching fatigue.',
    mood: 'good',
    energy: 4,
    starred: false,
    tags: ['focus', 'audio'],
    date: todayStr,
    created: Date.now() - 3600000 * 18
  }
];

const sampleFocusHistory = [
  {
    id: 'f-1',
    date: todayStr,
    timestamp: Date.now() - 3600000 * 3,
    durationMinutes: 45,
    taskTitle: 'Finalize v4.4 production architecture & showcase',
    activeApps: ['Visual Studio Code', 'Windows Terminal', 'Doing It']
  },
  {
    id: 'f-2',
    date: todayStr,
    timestamp: Date.now() - 3600000 * 5,
    durationMinutes: 50,
    taskTitle: 'Review RFC 5545 iCalendar sync payloads with team',
    activeApps: ['Visual Studio Code', 'Edge Dev']
  },
  {
    id: 'f-3',
    date: todayStr,
    timestamp: Date.now() - 3600000 * 7,
    durationMinutes: 30,
    taskTitle: 'Polish Windows 11 Mica & Acrylic materials',
    activeApps: ['Figma', 'Visual Studio Code']
  }
];

const sampleNotes = [
  {
    id: 'n-1',
    text: '### Doing It Architecture Principles #core\n- **Local-first JSON**: 0ms latency, zero cloud dependency\n- **Zero telemetry**: 100% private and offline\n- **Windows 11 Native**: Edge docking, Mica acrylic, Raycast palette\n\n- [x] High-DPI authentic captures\n- [x] Restored canonical brain logo\n- [x] Pixel-perfect desktop layout',
    updated: Date.now() - 3600000
  },
  {
    id: 'n-2',
    text: '### Keyboard Shortcuts Cheat Sheet #shortcuts\n- `Ctrl + K`: Raycast Command Palette\n- `Ctrl + Shift + A`: Spotlight Quick Add\n- `Ctrl + 1..6`: Fast View Switcher\n- `Space`: Toggle Focus Timer',
    updated: Date.now() - 7200000
  }
];

const sampleCalendarEvents = [
  {
    id: 'cal-1',
    summary: 'Architecture Sprint & Systems Review',
    start: `${todayStr}T09:30:00`,
    end: `${todayStr}T10:15:00`,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingPlatform: 'Google Meet'
  },
  {
    id: 'cal-2',
    summary: 'Deep Flow: Core Engine Optimization',
    start: `${todayStr}T11:00:00`,
    end: `${todayStr}T12:30:00`,
    meetingUrl: null
  },
  {
    id: 'cal-3',
    summary: 'Product Design Sync',
    start: `${todayStr}T14:00:00`,
    end: `${todayStr}T14:45:00`,
    meetingUrl: 'https://zoom.us/j/123456789',
    meetingPlatform: 'Zoom'
  },
  {
    id: 'cal-4',
    summary: 'Async Documentation & Release Notes',
    start: `${todayStr}T16:00:00`,
    end: `${todayStr}T17:00:00`,
    meetingUrl: null
  }
];

app.whenReady().then(async () => {
  windowManager.registerMediaProtocol();
  setupIpcHandlers(storeManager, windowManager, SystemIntegration);

  const outImgs = path.join(projectRoot, 'imgs');
  const outDocsImgs = path.join(projectRoot, 'docs', 'imgs');
  if (!fs.existsSync(outImgs)) fs.mkdirSync(outImgs, { recursive: true });
  if (!fs.existsSync(outDocsImgs)) fs.mkdirSync(outDocsImgs, { recursive: true });

  // Perfectly proportioned window: 620 x 980 with zoomFactor 1.35
  // Logical size: 460 x 725, physical resolution: 620 x 980
  const win = new BrowserWindow({
    width: 620,
    height: 980,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(projectRoot, 'preload.js')
    }
  });

  await win.loadFile(path.join(projectRoot, 'index.html'));
  win.webContents.setZoomFactor(1.35);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  await wait(1500);

  // In renderer: populate store state via reactive setters
  await win.webContents.executeJavaScript(`
    document.documentElement.setAttribute('data-theme', 'light');
    window.appStore.set('tasks', ${JSON.stringify(sampleTodos)});
    window.appStore.set('diary', ${JSON.stringify(sampleDiary)});
    window.appStore.set('notes', ${JSON.stringify(sampleNotes)});
    window.appStore.set('focusHistory', ${JSON.stringify(sampleFocusHistory)});
    window.appStore.set('scratchpad', 'Rapid thought capture: Local-first architecture is the future of desktop software. Always instant, always accessible.');
    window.appStore.set('calendarEvents', ${JSON.stringify(sampleCalendarEvents)});
  `);
  await wait(800);

  async function captureView(viewName, filename, setupCode = '') {
    if (setupCode) {
      await win.webContents.executeJavaScript(setupCode);
      await wait(300);
    }
    await win.webContents.executeJavaScript(`
      document.documentElement.setAttribute('data-theme', 'light');
      window.appStore.set('activeView', '${viewName}');
    `);
    await wait(600);

    const img = await win.webContents.capturePage();
    const pngBuf = img.toPNG();
    fs.writeFileSync(path.join(outImgs, filename), pngBuf);
    fs.writeFileSync(path.join(outDocsImgs, filename), pngBuf);
    console.log(`✔ Captured ${filename} (${img.getSize().width}x${img.getSize().height})`);
  }

  // 1. Core Views
  await captureView('tasks', 'tasks-view.png');
  await captureView('diary', 'diary-view.png');
  await captureView('analytics', 'analytics-view.png');
  await captureView('focus', 'focus-view.png', `
    window.appStore.state.focus.linkedTaskId = 't-1';
    window.appStore.state.focus.soundscape = 'brown';
    window.appStore.state.focus.volume = 0.7;
    window.appStore.notify('focus');
  `);
  await captureView('planner', 'planner-view.png');
  await captureView('notes', 'notes-view.png');
  await captureView('settings', 'settings-view.png');

  // 2. Command Palette View
  await win.webContents.executeJavaScript(`
    window.appStore.set('activeView', 'tasks');
    window.appStore.set('paletteOpen', true);
  `);
  await wait(600);
  const palImg = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outImgs, 'palette-view.png'), palImg.toPNG());
  fs.writeFileSync(path.join(outDocsImgs, 'palette-view.png'), palImg.toPNG());
  console.log(`✔ Captured palette-view.png`);

  await win.webContents.executeJavaScript(`window.appStore.set('paletteOpen', false);`);
  await wait(300);
  win.destroy();

  // 3. Quick Add Window (Using WindowManager method directly)
  try {
    const qWin = windowManager.createQuickAddWindow();
    await wait(800);
    await qWin.webContents.executeJavaScript(`
      const input = document.getElementById('quickadd-input');
      if (input) {
        input.value = 'Ship Doing It v4.4 website tomorrow 2pm !high #launch';
      }
    `);
    await wait(400);
    const qImg = await qWin.webContents.capturePage();
    fs.writeFileSync(path.join(outImgs, 'quick-add.png'), qImg.toPNG());
    fs.writeFileSync(path.join(outDocsImgs, 'quick-add.png'), qImg.toPNG());
    console.log(`✔ Captured quick-add.png (${qImg.getSize().width}x${qImg.getSize().height})`);
    qWin.destroy();
  } catch (err) {
    console.warn('QuickAdd capture error:', err.message);
  }

  // 4. Mini-Timer Window
  try {
    const mWin = windowManager.createMiniTimerWindow({ remaining: 1125, duration: 1500, running: true });
    await wait(800);
    const mImg = await mWin.webContents.capturePage();
    fs.writeFileSync(path.join(outImgs, 'mini-timer.png'), mImg.toPNG());
    fs.writeFileSync(path.join(outDocsImgs, 'mini-timer.png'), mImg.toPNG());
    console.log(`✔ Captured mini-timer.png (${mImg.getSize().width}x${mImg.getSize().height})`);
    mWin.destroy();
  } catch (err) {
    console.warn('MiniTimer capture error:', err.message);
  }

  // 5. FAB Window
  try {
    const fWin = windowManager.createFabWindow();
    await wait(800);
    const fImg = await fWin.webContents.capturePage();
    fs.writeFileSync(path.join(outImgs, 'fab-overlay.png'), fImg.toPNG());
    fs.writeFileSync(path.join(outDocsImgs, 'fab-overlay.png'), fImg.toPNG());
    console.log(`✔ Captured fab-overlay.png (${fImg.getSize().width}x${fImg.getSize().height})`);
    fWin.destroy();
  } catch (err) {
    console.warn('FAB capture error:', err.message);
  }

  console.log('\n🎉 ALL REAL PRODUCT CAPTURES COMPLETED CRISPLY!');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  app.exit(0);
});
