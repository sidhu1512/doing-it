const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const StoreManager = require('../src/main/store');

test('Diary & Analytics — StoreManager initializes diary and focusHistory defaults', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-diary-test-'));
  const storeManager = new StoreManager(tmpDir);
  const data = storeManager.initStore();

  assert.ok(Array.isArray(data.diary), 'diary must be an array');
  assert.ok(Array.isArray(data.focusHistory), 'focusHistory must be an array');
  assert.strictEqual(data.diary.length, 0);
  assert.strictEqual(data.focusHistory.length, 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Diary & Analytics — Preserves diary entry with mood, tags, and audio metadata', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-diary-test-'));
  const storeManager = new StoreManager(tmpDir);
  storeManager.initStore();

  storeManager.storeData.diary.push({
    id: 9901,
    date: '2026-09-23',
    time: '14:30',
    journal: 'personal',
    title: 'Milestone Achieved',
    text: 'Completed voice notes and productivity analytics engine #launch #milestone',
    mood: 'great',
    energy: 5,
    starred: true,
    tags: ['launch', 'milestone'],
    audio: {
      filePath: 'C:/AppData/audio/audio-123.webm',
      mediaUrl: 'doingit-media://C:/AppData/audio/audio-123.webm',
      duration: 35
    },
    context: 'VS Code'
  });

  storeManager.saveStore();

  const reloadManager = new StoreManager(tmpDir);
  reloadManager.initStore();

  assert.strictEqual(reloadManager.storeData.diary.length, 1);
  const entry = reloadManager.storeData.diary[0];
  assert.strictEqual(entry.title, 'Milestone Achieved');
  assert.strictEqual(entry.mood, 'great');
  assert.strictEqual(entry.audio.duration, 35);
  assert.strictEqual(entry.starred, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Diary & Analytics — Focus history logging preserves session durations and active apps', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-diary-test-'));
  const storeManager = new StoreManager(tmpDir);
  storeManager.initStore();

  storeManager.storeData.focusHistory.push({
    id: 8801,
    date: '2026-09-23',
    startTime: '2026-09-23T10:00:00.000Z',
    endTime: '2026-09-23T10:45:00.000Z',
    durationMinutes: 45,
    taskId: 101,
    taskTitle: 'Refactor audio engine',
    activeApps: ['Visual Studio Code', 'Terminal']
  });

  storeManager.saveStore();

  const reloadManager = new StoreManager(tmpDir);
  reloadManager.initStore();

  assert.strictEqual(reloadManager.storeData.focusHistory.length, 1);
  const sess = reloadManager.storeData.focusHistory[0];
  assert.strictEqual(sess.durationMinutes, 45);
  assert.deepStrictEqual(sess.activeApps, ['Visual Studio Code', 'Terminal']);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
