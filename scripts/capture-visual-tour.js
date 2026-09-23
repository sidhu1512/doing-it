/**
 * Real GUI Visual Verification Script
 * Launches the real Electron window with full rendering engine, captures screenshots of each view,
 * and saves them to the conversation artifact directory for visual inspection.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const StoreManager = require('../src/main/store');
const WindowManager = require('../src/main/windows');
const SystemIntegration = require('../src/main/system');
const { setupIpcHandlers } = require('../src/main/ipc');

const artifactDir = path.resolve('C:\\Users\\Asus\\.gemini\\antigravity\\brain\\7090ba16-8bc1-436b-a16f-149fdcbcc51d');
if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

const projectRoot = path.resolve(__dirname, '..');
const storeManager = new StoreManager(app.getPath('userData'));
storeManager.initStore();

// Populate realistic sample data for visual verification if empty
if (!storeManager.storeData.todos || storeManager.storeData.todos.length === 0) {
  storeManager.storeData.todos = [
    { id: 1, text: 'Review architecture documentation', completed: true, priority: 'high', dueDate: new Date().toISOString().split('T')[0] },
    { id: 2, text: 'Ship v4.4 release with Day One & Analytics', completed: false, priority: 'high', dueDate: new Date().toISOString().split('T')[0] },
    { id: 3, text: 'Daily Morning Meditation', isHabit: true, streak: 5, completed: true },
    { id: 4, text: 'Hydration 2L target', isHabit: true, streak: 3, completed: false }
  ];
}

if (!storeManager.storeData.diary || storeManager.storeData.diary.length === 0) {
  storeManager.storeData.diary = [
    {
      id: 101,
      date: new Date().toISOString().split('T')[0],
      time: '09:15',
      journal: 'personal',
      title: 'Morning Intention & Kickoff',
      text: 'Today we are testing the entire application visually. Voice recording is hooked up and the analytics dashboard is calculating daily scores.',
      mood: 'great',
      energy: 5,
      starred: true,
      tags: ['milestone', 'launch'],
      context: 'Visual Studio Code',
      audio: {
        filePath: 'mock.webm',
        mediaUrl: '',
        duration: 38
      }
    },
    {
      id: 102,
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      journal: 'work',
      title: 'Midday Architecture Sync',
      text: 'Team approved the local-first storage design. High throughput, zero latency.',
      mood: 'good',
      energy: 4,
      starred: false,
      tags: ['work', 'design']
    }
  ];
}

if (!storeManager.storeData.focusHistory || storeManager.storeData.focusHistory.length === 0) {
  const todayStr = new Date().toISOString().split('T')[0];
  storeManager.storeData.focusHistory = [
    { id: 201, date: todayStr, startTime: `${todayStr}T10:00:00Z`, durationMinutes: 45, taskTitle: 'Ship v4.4 release', activeApps: ['VS Code', 'Chrome'] },
    { id: 202, date: todayStr, startTime: `${todayStr}T11:15:00Z`, durationMinutes: 30, taskTitle: 'Refactor UI components', activeApps: ['VS Code'] },
    { id: 203, date: todayStr, startTime: `${todayStr}T15:00:00Z`, durationMinutes: 25, taskTitle: 'Review pull requests', activeApps: ['Chrome'] }
  ];
}
storeManager.saveStore();

const windowManager = new WindowManager(projectRoot, storeManager, SystemIntegration);

app.whenReady().then(async () => {
  windowManager.registerMediaProtocol();
  setupIpcHandlers(storeManager, windowManager, SystemIntegration);

  const win = windowManager.createMainWindow(false);

  win.webContents.once('did-finish-load', async () => {
    console.log('Window loaded. Taking visual screenshots...');

    async function capture(viewName, filename) {
      // Switch view
      await win.webContents.executeJavaScript(`window.appStore.set('activeView', '${viewName}')`);
      await new Promise(r => setTimeout(r, 600)); // wait for layout & transitions

      const image = await win.webContents.capturePage();
      const savePath = path.join(artifactDir, filename);
      fs.writeFileSync(savePath, image.toPNG());
      console.log(`Saved screenshot: ${filename} (${image.getSize().width}x${image.getSize().height})`);
    }

    try {
      await capture('tasks', 'screenshot_tasks.png');
      await capture('focus', 'screenshot_focus.png');
      await capture('diary', 'screenshot_diary.png');
      await capture('analytics', 'screenshot_analytics.png');

      console.log('\nAll 4 views captured as real PNG screenshots successfully!');
      app.exit(0);
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      app.exit(1);
    }
  });
});
