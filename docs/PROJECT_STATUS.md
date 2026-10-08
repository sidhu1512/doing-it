# Doing It — Project Status & Technical Memory

## 1. Architectural Overview & Decisions

Doing It is a high-performance Windows desktop overlay productivity widget designed for seamless multitasking without workflow disruption.

- **Stack**: Electron 28, Vanilla ES6+ Web Components architecture, Node.js Test Runner.
- **Protected Window Invariants**:
  - `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`, `hasShadow: true`.
  - Windows are hardware-accelerated with DWM glass acrylic/mica styling, avoiding frame flicker using opacity masks.
- **Window Topologies**:
  1. **Main Widget** (`index.html`): 400x650 overlay with edge docking support (snapping to full screen height on screen boundaries) and multi-display position preservation across secondary monitors.
  2. **FAB Window** (`fab.html`): 48x48 AssistiveTouch draggable floating bubble with live SVG progress ring.
  3. **Quick Add Modal** (`quickadd.html`): 520x68 Spotlight-style capture modal with real-time NLP preview.
  4. **Mini Timer** (`mini-timer.html`): 290x50 PiP pill floating countdown companion.
  5. **In-App Settings**: Seamless overlay modal inside main widget replacing external popup windows.
- **Zero-Emoji UI Rule**: Verified in tests (`test/components.test.js`). All iconography uses clean, crisp vector SVGs for a modern, distraction-free aesthetic.
- **Atomic Persistence & Rolling Backups**:
  - `StoreManager` writes data atomically using temporary files and atomic renames, preventing corrupt stores on abrupt system shutdowns or power losses.
  - Rolling 5-day backup files saved in `backups/` directory with automatic recovery.
  - Custom storage directory support (OneDrive, Dropbox, Google Drive sync).
  - One-click JSON data export and backup restore.

## 2. Implemented Features & Integrations

- **Tasks & Habits Engine** (`TasksView.js`):
  - Smart sections: Today, Upcoming, Backlog, Completed.
  - Inline title editing on double-click with Enter/Escape controls.
  - Single-click "Clear Completed" button with Undo toast.
  - Daily habit streaks with midnight reset logic.
  - Focus linkage: Clicking play switches to Focus Studio and tracks time spent.
  - Full keyboard navigation: ArrowUp / ArrowDown highlighting, Space toggling check state, Enter editing, Delete removing.
- **Notes & Instant Scratchpad** (`NotesView.js`):
  - Auto-saving scratchpad debounced to local store.
  - Markdown rendering with interactive checkboxes (`- [ ]`, `- [x]`).
  - Active hashtag filtering (#tag) with filter bar.
  - Clickable markdown links (`.md-link`) opening external URLs in default Windows browser.
  - Rich Link Previews: Standalone URLs hydrate into OpenGraph cards with thumbnail, title, description, and host.
  - Image paste (`Ctrl+V`) and drag-and-drop file attachment saving PNG buffers locally.
  - Secure media protocol `doingit-media://` with Windows drive letter normalization.
- **Focus Studio & Audio Companion** (`FocusView.js`, `audio.js`):
  - High-precision 603px circular countdown ring.
  - Synthesized ambient audio (Brown Noise, Rainfall, Forest Breeze, Lo-Fi Calm) via Web Audio API.
  - Spotify integration: Embedded Web Player with presets (Deep Focus, Lofi Beats, Piano, Brain Food, Synthwave, Custom URL).
  - Native Spotify desktop status bar: Detects running Spotify Windows process, displaying live track & artist with previous, play/pause, and next controls.
  - Auto-play on focus start and auto-pause on completion/pause.
  - Windows 11 Focus Assist (Do Not Disturb) registry toggle.
- **Day Planner & Calendar** (`PlannerView.js`, `calendar.js`):
  - Horizontal week strip selector.
  - Synced external `.ics` calendar feeds (Google Calendar, Outlook, Apple Calendar).
  - 1-click meeting join links (Teams, Zoom, Google Meet).
  - Manual calendar refresh button and recurring 15-minute background sync.
  - Proactive meeting alerts: Chimes and alerts 5 minutes before scheduled meetings.
- **Proactive Notification Engine** (`state.js`):
  - 30-second recurring checker for pre-meeting warnings (0-5 minutes) and high-priority tasks due today.
  - Plays acoustic chimes (`audioEngine.playNotificationChime()`), displays in-app toast HUD, and fires native Windows notifications.
  - Deduplicated notification registry preventing repeat alerts.
- **Always-On-Top Window Pinning** (`Header.js`, `windows.js`, `SettingsView.js`, `Palette.js`):
  - Quick-toggle pin button in Header bar (`#btn-pin-window`) with active glow state.
  - Global IPC and settings sync for always-on-top mode.
  - Settings panel toggle switch.
  - Command palette action: "Window: Toggle Always On Top (Pin Widget)".
- **Data Export & Backup Restore** (`ipc.js`, `SettingsView.js`, `Palette.js`):
  - Export Doing It database to custom JSON file via Windows Save Dialog.
  - Restore Doing It database from backup JSON with automatic store re-initialization and UI refresh.
- **Command Palette** (`Palette.js`):
  - Global `Ctrl+K` shortcut.
  - Fast search across commands, tasks, and notes.
  - Built-in commands: switch views, clear completed tasks, timer controls, PiP pop-out, Spotify controls (play/pause, next, prev), calendar refresh, always-on-top toggle, export backup, restore backup, undock window, preferences.
- **Global Shortcuts & System Tray** (`main.js`):
  - `Ctrl+Shift+N`: Toggle main widget.
  - `Ctrl+Shift+A`: Open Quick Add bar anywhere in Windows.
  - `Ctrl+Shift+C`: Context-aware clipboard capture (fetches active window title via user32.dll).
  - Single-instance lock ensuring only one instance runs.
- **Official Landing Page & Product Showcase** (`docs/`):
  - GitHub Pages ready (`https://sidhu1512.github.io/doing-it/`).
  - High-converting dark-mode glassmorphic design matching Doing It design system.
  - Interactive tabbed screenshot showcase with high-res zoom lightbox.
  - Step-by-step workflow guide, keyboard shortcuts reference, SmartScreen walkthrough, and interactive FAQ.
  - Comprehensive SEO metadata: OpenGraph cards, Twitter preview cards, and Schema.org `SoftwareApplication` JSON-LD.

## 3. Test Coverage & Verification

- `npm test`: 21 passing unit tests
  - `test/calendar.test.js`: ICS line unfolding, date parsing, meeting links.
  - `test/components.test.js`: Zero-emoji compliance, constructor initialization, direct uninstall verification, header pin button, settings backup & pin controls, command palette actions, arrow key navigation.
  - `test/nlp.test.js`: Quick add parsing, Chrono natural language date extraction.
  - `test/spotify.test.js`: Process title parsing, status detection, URI conversion.
  - `test/store.test.js`: Store initialization, atomic file saving, backup recovery, window size validation.
- `npm run test:e2e`: Smoke tests for all 5 windows loading successfully with zero console errors.
- `npm run lint`: Full syntax verification on `main.js` and all `src/**/*.js` files.

## 4. Current Priorities & Next Enhancements

1. **Multi-Monitor Edge Snapping**:
   - Enhance docking calculations to handle dynamic DPI scaling and multi-monitor edge barriers.
2. **Offline Resilience**:
   - Ensure all rich preview and calendar failures fail gracefully without console noise.
3. **Soundscape Customization**:
   - Optional local white noise custom sound file loading.
