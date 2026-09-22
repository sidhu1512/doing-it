const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const StoreManager = require('../src/main/store');

test('StoreManager — Initialization and defaults', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-test-'));
  const storeManager = new StoreManager(tmpDir);

  const data = storeManager.initStore();
  assert.strictEqual(data.version, '5.0.0');
  assert.ok(Array.isArray(data.notes));
  assert.ok(Array.isArray(data.todos));
  assert.ok(Array.isArray(data.reminders));
  assert.strictEqual(typeof data.moods, 'object');
  assert.strictEqual(data.pomodoro.sessions, 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('StoreManager — Atomic file saving preserves integrity', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-test-'));
  const storeManager = new StoreManager(tmpDir);
  storeManager.initStore();

  storeManager.storeData.notes.push({
    id: 1001,
    text: 'Test note #production',
    category: 'production',
    timestamp: new Date().toISOString()
  });

  const success = storeManager.saveStore();
  assert.strictEqual(success, true);

  // Read back directly from disk
  const filePath = storeManager.getStoreFilePath();
  assert.ok(fs.existsSync(filePath));
  const diskData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert.strictEqual(diskData.notes.length, 1);
  assert.strictEqual(diskData.notes[0].text, 'Test note #production');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('StoreManager — Backup creation and recovery from corrupt store', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-test-'));
  const storeManager = new StoreManager(tmpDir);
  storeManager.initStore();

  storeManager.storeData.todos.push({
    id: 2001,
    text: 'Critical task',
    completed: false
  });
  storeManager.saveStore();
  storeManager.createBackup();

  // Verify backup exists
  const backupDir = path.join(tmpDir, 'backups');
  assert.ok(fs.existsSync(backupDir));
  const backups = fs.readdirSync(backupDir);
  assert.ok(backups.length >= 1);

  // Corrupt the active file
  fs.writeFileSync(storeManager.getStoreFilePath(), 'CORRUPT_INVALID_JSON{{{', 'utf-8');

  // Initialize new store instance — should automatically recover from backup
  const recoveryManager = new StoreManager(tmpDir);
  recoveryManager.initStore();
  assert.strictEqual(recoveryManager.storeData.todos.length, 1);
  assert.strictEqual(recoveryManager.storeData.todos[0].text, 'Critical task');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('StoreManager — windowSize persistence and validation', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doingit-test-'));
  const storeManager = new StoreManager(tmpDir);
  storeManager.initStore();

  assert.strictEqual(storeManager.storeData.windowSize, null);

  storeManager.storeData.windowSize = { width: 480, height: 720 };
  storeManager.saveStore();

  const reloaded = new StoreManager(tmpDir);
  reloaded.initStore();
  assert.deepStrictEqual(reloaded.storeData.windowSize, { width: 480, height: 720 });

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
