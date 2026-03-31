# Changelog

## [4.0.1] — 2026-03-25

### Removed
- **Toast notifications** — All toast/undo-toast UI removed entirely (functions made no-ops, HTML/CSS cleaned up)
- **Uninstall prompt** — "Goodbye! We will secretly miss your notes..." MessageBox removed from NSIS installer; uninstall is now single-click, data is silently cleaned up

### Fixed
- **App icon reverting to default Electron icon** — `afterPack.js` was looking for `rcedit.exe` in `electron-winstaller/vendor/` (not installed); switched to using the `rcedit` npm package API (`require('rcedit').rcedit`) directly — icon now patches on first attempt
- **Search not clearing** — Note search input now auto-clears when switching tabs

### Added
- **FAB Toggle** — New setting to completely enable/disable the Floating Action Button. When disabled, the app stays running silently in the background when minimized.
- **Ghost FAB** — The floating icon is now 40% transparent when idling on screen to be less distracting, fading to full color on hover or drag.
- **Developer guardrails** — `DO NOT CHANGE` comments added to protect:
  - App icons (`build/icon.ico`, `assets/icon.ico`, `assets/icon.png`) 
  - Window transparency (`transparent: true`, `backgroundColor: '#00000000'`)
  - Frameless window (`frame: false`)
  - Rounded corners (`clip-path: inset(0 round 8px)`)

### Changed
- `rcedit` added as devDependency for reliable icon patching
- Version bump: 4.0.0 → 4.0.1

---

## [4.0.0] — 2026-03-24

### Added — Invisible Polish

#### Universal #Hashtags
- Type `#tag` anywhere in a note or task → auto-highlighted in purple accent
- Dynamic tag pill bar appears at top of Notes and Tasks panels
- Click any `#tag` pill to instantly filter the view; click again to clear
- Replaces hardcoded Personal/Work/Ideas category system — infinite flexibility, zero config

#### Markdown Checklists
- Type `- [ ] Subtask` inside any note or task → renders as interactive checkbox
- Click checkbox → raw text toggles to `- [x]` and auto-saves
- Checked items get strikethrough + dimmed styling
- Works with infinite nesting — zero schema changes

#### "My Day" Unified View
- Dynamic "Today" section at top of Tasks panel
- Aggregates tasks due today + reminders firing today + .ics calendar events for today
- Sorted chronologically with type-specific icons (✓ task, 🔔 reminder, 📅 event)
- Updates automatically as data changes

#### Focus Assist (Auto-DND)
- Starting a Pomodoro automatically enables Windows Do Not Disturb
- Pausing, resetting, or completing the timer disables DND
- Uses PowerShell registry toggle — no external dependencies

#### Silent Image Garbage Collection
- Background cleanup runs 30 seconds after boot
- Scans `images/` folder, deletes orphaned `.png` files not referenced by any note
- Prevents disk bloat from deleted notes with pasted images

### Changed
- Task text now renders with full markdown (hashtags, bold, italic, code, links)
- Removed hardcoded note categories (Personal/Work/Ideas) in favor of dynamic #hashtags
- Version bump: 3.2.0 → 4.0.0

---

## [3.2.0] — 2026-03-24

### Fixed
- **Desktop/taskbar icon** — Was still showing default Electron atom icon because `signAndEditExecutable: false` in electron-builder skips icon embedding; regenerated `icon.ico` using Python Pillow (the Node.js manual ICO was malformed and rejected by rcedit) and directly patched the installed executable with the correct brain icon using `rcedit.exe`
- **App User Model ID** — Updated from `com.livenotes.desktop` to `com.doingit.desktop` in `main.js`

### Changed
- **FAB icon** — Replaced inline SVG brain approximation with the actual `icon.png` image (CSS-inverted for dark background), so the minimized floating button now matches the desktop shortcut icon exactly
- Moved build icon to `build/icon.ico` (electron-builder standard location)

---

## [3.1.0] — 2026-03-24

### Rebranded — "Doing It"
- Renamed entire application from "Live Notes" to **Doing It**
- New detailed brain icon (engraving-style, organic/neural split, transparent background)
- Updated all window titles, tray tooltip, notifications, installer, shortcuts, and documentation
- Changed internal data files from `live-notes-data.json` to `doing-it-data.json`
- Updated appId to `com.doingit.desktop`

### Added
- **FAB Progress Ring** — Focus timer progress visually wraps around the floating action button as a circular arc
- **Boot to FAB** — App now always starts minimized to the floating icon; click to expand

### Fixed
- **Sharp window corners** — Removed native `mica` backdrop that forced opaque rectangular edges behind CSS border-radius
- **Timer persistence on minimize** — Window now hides instead of closing, preserving active focus sessions

---

## [3.0.1] — 2026-03-23

### Fixed — Full Audit Patch

#### renderer.js
- **Delete note undo race condition** — cloned note object before `filter()` so the undo closure captures valid data; added fallback for items not in DOM (filtered by search/category)
- **Delete task undo race condition** — same fix as notes, with deep clone of `files` array
- **clearPastReminders logic** — fixed filter that incorrectly kept all fired repeating reminders; added count toast ("2 past reminders cleared" or "No past reminders to clear")
- **Weekly pomodoro history trimming** — changed `slice(-7)` to date-based filtering so missed days don't push out recent entries
- **dropTaskOnDate falsy ID check** — replaced `if (!todoId)` (fails for `id === 0`) with `isNaN()` guard

#### main.js
- **ICS fetch timeout abort** — stored request reference and called `req.destroy()` on timeout to prevent hanging connections
- **Backup cleanup crash resilience** — wrapped per-file `statSync`/`unlinkSync` in try-catch so one corrupt backup doesn't crash the entire cleanup loop

#### styles.css
- **Missing `.settings-path-row` CSS class** — added flex layout rule for ICS URL input + Save button row in Settings

### Changed
- Version bump: 3.0.0 → 3.0.1

---

## [3.0.0] — 2026-03-23

### Added — Phase 3: SOTA Desktop Features

#### Task-Driven Focus Timers
- ▶ Play button on each task — auto-switches to Focus tab and starts Pomodoro
- Task name displayed in timer label during session
- `timeSpent` logged to task JSON on session completion
- "Did you finish?" prompt — click "Yes" to auto-complete the task

#### Ctrl+K Command Palette
- `Ctrl+K` opens a dimmed overlay with fuzzy search bar
- Searches across all notes and tasks simultaneously
- Action commands via `>` prefix: Start Timer, Reset Timer, Clear Completed, Switch Tabs, Open Settings, Undock Window
- Arrow-key navigation + Enter to execute

#### Arrow-Key List Navigation
- `↑/↓` to move highlight across notes, tasks, reminders
- `Space` checks off highlighted task
- `Enter` opens inline edit mode
- `Delete` triggers undo-toast delete
- 100% mouse-free operation within the widget

#### Markdown Rendering
- Lightweight zero-dependency parser: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`
- URLs auto-linked and rendered as clickable green links
- Opens links in default browser via `shell.openExternal()`
- Plain-text editing preserved — markdown only renders on display

#### Context-Aware Capture (Active Window)
- PowerShell + WinAPI (`user32.dll`) detects foreground window title
- Context pills displayed on notes/tasks metadata
- No native npm dependencies required

#### Screen Edge Docking
- Drag main window within 20px of screen edge → snaps to full-height sidebar
- Behaves like Windows Copilot sidebar (400 × workAreaHeight)
- Undock by dragging away from edge or via Command Palette
- Dock state tracked and communicated via IPC

#### Local Image Pasting
- `Ctrl+V` while Notes panel is active saves clipboard image as PNG
- Images stored in `images/` folder alongside JSON data
- Rendered as clickable thumbnails in notes

#### .ics Calendar Sync
- Settings → External Calendar → paste secret .ics URL
- Main process fetches .ics hourly via `https.get()`
- Custom inline parser extracts VEVENT blocks (SUMMARY, DTSTART, DTEND, DESCRIPTION, LOCATION)
- External events shown as grey dots on calendar grid
- "Join Meeting" button for events with Zoom, Teams, or Google Meet links

#### Drag-and-Drop Task Scheduling
- Tasks have `draggable="true"` attribute
- Drag a task from the list onto any date in the Calendar grid
- Calendar cells show green drop indicator on hover
- Sets the task's `dueDate` and re-renders both lists

### Changed
- Version bump: 2.0.0 → 3.0.0
- IPC channels expanded from 18 to 25+
- `renderer.js` expanded with ~800 lines of Phase 3 features
- `styles.css` expanded with 14 new style sections
- `index.html` updated with Command Palette overlay and .ics settings field

---

## [2.0.0] — 2026-03-23

### Added — Phase 2: Premium Desktop Features

#### Native Windows 11 Integration
- **Mica material** on main window — native hardware-accelerated frosted glass blur
- **Acrylic material** on FAB, Quick Add bar, and Mini Timer

#### Alt+Space Quick Add Bar
- Global hotkey `Alt+Space` opens instant capture bar from anywhere
- Smart NLP parser: "Buy milk tomorrow !high" → high-priority task due tomorrow

#### Multi-Monitor Cursor Awareness
- All windows open on the monitor where the cursor is

#### Smart Timer (Lock Screen Detection)
- Focus timer auto-pauses on `Win+L`, resumes on unlock

#### Pop-out Mini Timer (PiP)
- Detachable 180×56 always-on-top countdown pill

#### BYOC Custom Storage Location
- Settings modal allows changing data save directory for cloud sync

#### Rolling Backups
- Automatic 5-day backup history on every app launch

#### Global Clipboard Injection
- `Ctrl+Shift+C` clips text from any app as a note with system notification

#### Drag & Drop File Shortcuts
- Drag files from Explorer onto tasks to attach clickable file links

---

## [1.0.0] — 2026-03-22

### Initial Release
- Notes with search, pin, inline editing, categories, undo delete
- Tasks with priority cycling, due dates, filters, undo delete
- Reminders with date/time, repeat, system notifications, snooze
- Pomodoro focus timer with ring progress, presets, weekly history
- Calendar with clickable days, event dots, upcoming events
- Floating AssistiveTouch-style icon (FAB)
- System tray with context menu
- Auto-start on Windows boot
- Global shortcut: `Ctrl+Shift+N`
- Data persistence in `%APPDATA%`
