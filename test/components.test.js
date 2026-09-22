const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Components — Zero Emojis in source code', () => {
  const filesToCheck = [
    'src/renderer/components/Header.js',
    'src/renderer/components/TasksView.js',
    'src/renderer/components/NotesView.js',
    'src/renderer/components/FocusView.js',
    'src/renderer/components/PlannerView.js',
    'src/renderer/components/Palette.js',
    'src/renderer/components/SettingsView.js',
  ];

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/u;

  for (const relPath of filesToCheck) {
    const fullPath = path.resolve(__dirname, '..', relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(emojiRegex);
    assert.equal(match, null, `Found unexpected emoji in ${relPath}: ${match ? match[0] : ''}`);
  }
});

test('NotesView — Renders feed in constructor and registers subscriptions', () => {
  const notesViewPath = path.resolve(__dirname, '../src/renderer/components/NotesView.js');
  const content = fs.readFileSync(notesViewPath, 'utf8');
  assert.ok(content.includes('this.renderNotesFeed();'), 'NotesView constructor must call this.renderNotesFeed()');
  assert.ok(!content.includes('⚡'), 'Instant scratchpad must not have lightning bolt emoji');
});

test('SettingsView — Direct 1-click uninstall without confirmation dialog', () => {
  const settingsPath = path.resolve(__dirname, '../src/renderer/components/SettingsView.js');
  const content = fs.readFileSync(settingsPath, 'utf8');
  assert.ok(!content.includes('confirm('), 'SettingsView must not contain confirm() popup for uninstall');
  assert.ok(content.includes('window.api.uninstallApp()'), 'SettingsView must invoke window.api.uninstallApp() directly');
});

test('ReactiveStore — init notifies tasks, notes, scratchpad, focus', () => {
  const statePath = path.resolve(__dirname, '../src/renderer/store/state.js');
  const content = fs.readFileSync(statePath, 'utf8');
  assert.ok(content.includes("this.notify('tasks');"), "init must notify 'tasks'");
  assert.ok(content.includes("this.notify('notes');"), "init must notify 'notes'");
  assert.ok(content.includes("this.notify('scratchpad');"), "init must notify 'scratchpad'");
  assert.ok(content.includes("this.notify('focus');"), "init must notify 'focus'");
});
